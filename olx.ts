import { chromium } from "playwright";
import { OLX_SWITCH_NEW_GAMES } from "./consts";
import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

export const scraper = async (page: Page) => {
  // Launch a headless browser
  const browser = await chromium.launch({ headless: true });

  // Open a new page
  const context = await browser.newContext();

  // Navigate to the desired URL
  await page.goto(OLX_SWITCH_NEW_GAMES);

  // Select and extract data from the page
  const extractedItems = await page.evaluate(() => {
    // Select elements by data-cy or data-testid attributes
    const items = Array.from(
      document.querySelectorAll('[data-cy="l-card"][data-testid="l-card"]')
    );
    const today = new Date();
    const todayFormatted = `${today.getDate()}.${
      today.getMonth() + 1
    }.${today.getFullYear()}`;

    const result = items
      .map((item) => {
        // Extract the id attribute
        const id = item.getAttribute("id");

        // Ignore items with data-testid="adCard-featured"
        if (item.querySelector('[data-testid="adCard-featured"]')) {
          return null;
        }

        const titleElement = item.querySelector<HTMLHeadingElement>(
          '[data-cy="ad-card-title"] h6'
        );
        const priceElement = item.querySelector<HTMLElement>(
          '[data-testid="ad-price"]'
        );
        const imgElement = item.querySelector<HTMLImageElement>("img")?.src;
        const urlElement = item.querySelector<HTMLAnchorElement>(
          '[data-cy="ad-card-title"] a'
        )?.href;
        const typeElement = item.querySelector<HTMLElement>(
          '[class="css-krg4hw"] div span span span'
        );
        const cityDateElement = item.querySelector<HTMLElement>(
          '[data-testid="location-date"]'
        );

        let cityElement = "";
        let dateElement = "";
        let timestamp = 0;

        if (cityDateElement) {
          const cityDateText = cityDateElement.innerText.split("-");
          if (cityDateText.length >= 2) {
            cityElement = cityDateText[0].trim();
            const dateText = cityDateText[1].trim();

            // Check if dateText starts with "Dzisiaj"
            if (dateText.startsWith("Dzisiaj")) {
              // Extract time part from "Dzisiaj o 18:11"
              const timePart = dateText.split(" o ")[1];
              dateElement = `${todayFormatted} ${timePart}`;

              // Get timestamp in milliseconds
              const timestampDate = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                parseInt(timePart.split(":")[0]),
                parseInt(timePart.split(":")[1])
              );
              timestamp = timestampDate.getTime();
            } else {
              dateElement = dateText;

              // Get timestamp in milliseconds
              const dateParts = dateText.split(" ");
              if (dateParts.length >= 2) {
                const day = parseInt(dateParts[0].split(".")[0]);
                const month = parseInt(dateParts[0].split(".")[1]) - 1;
                const year = today.getFullYear();
                const timeParts = dateParts[1].split(":");
                if (timeParts.length >= 2) {
                  const hours = parseInt(timeParts[0]);
                  const minutes = parseInt(timeParts[1]);
                  const timestampDate = new Date(
                    year,
                    month,
                    day,
                    hours,
                    minutes
                  );
                  timestamp = timestampDate.getTime();
                }
              }
            }
          }
        }

        let priceText = null;
        if (priceElement) {
          // Extract only text nodes from the price element
          const textNodes = Array.from(priceElement.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.nodeValue.trim())
            .join("");
          priceText = textNodes;
        }

        return {
          id: id ? parseInt(id, 10) : null,
          title: titleElement?.innerText || "",
          thumbnail: imgElement || "",
          url: urlElement || "",
          city: cityElement || "",
          type: typeElement?.innerText || "",
          price: priceText || "",
          date: dateElement || "",
          timestamp: timestamp || 0,
        };
      })
      .filter((item) => item !== null); // Filter out null items

    // Sort items primarily by timestamp (descending), secondarily by id (ascending)
    result.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp; // Descending order for timestamp
      }
      return a.id - b.id; // Ascending order for id
    });

    return result;
  });

  const data = JSON.stringify(extractedItems, null, 2);
  const filePath = path.join(__dirname, "data", "db.json");

  fs.writeFileSync(filePath, data);

  // Log the extracted data
  console.log(extractedItems);

  // Close the browser
  await context.close();
  await browser.close();
};
