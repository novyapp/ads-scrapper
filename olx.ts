import { chromium } from "playwright";
import { OLX_SWITCH_NEW_GAMES } from "./types/olx/const";
import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { AD_TYPE, IAdItem, IOlxRawData } from "./types/interfaces";
import {
  getOlxProductCity,
  getOlxProductCondition,
  getOlxProductDate,
} from "./utils/olx";

const __dirname = path.resolve();

export const scraperOlx = async (page: Page) => {
  // Launch a headless browser
  const browser = await chromium.launch({ headless: true });

  // Open a new page
  const context = await browser.newContext();

  // Navigate to the desired URL
  await page.goto(OLX_SWITCH_NEW_GAMES);

  // Select and extract data from the page
  const extractedItems = await page.evaluate(() => {
    // Select elements from main list
    const items = Array.from(
      document.querySelectorAll('[data-cy="l-card"][data-testid="l-card"]')
    );

    //Generate array of products
    const result: IOlxRawData[] = items
      .map((item) => {
        // Extract the id attribute
        const localId = item.getAttribute("id");

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

        return {
          localId: Number(localId),
          title: titleElement.innerText,
          thumbnail: imgElement,
          url: urlElement,
          city: cityDateElement.innerText,
          type: typeElement?.innerText,
          pricePLN: priceElement.innerText,
        };
      })
      .filter((item) => item !== null); // Filter out null items

    return result;
  });

  // Close the browser
  await context.close();
  await browser.close();

  const finalData: IAdItem[] = extractedItems.map((data) => {
    const { localId, title, thumbnail, url, city, type, pricePLN } = data;

    const productCondition = getOlxProductCondition(type);
    const productCity = getOlxProductCity(city);
    const productDate = getOlxProductDate(city);

    return {
      localId,
      title,
      thumbnail,
      url,
      pricePLN,
      city: productCity,
      type: AD_TYPE.BUY_NOW,
      productType: productCondition,
      date: productDate.date,
      timestamp: productDate.timestamp,
    };
  });

  const data = JSON.stringify(finalData, null, 2);
  const filePath = path.join(__dirname, "data", "olx.json");

  fs.writeFileSync(filePath, data);

  // Log the extracted data
  console.log(finalData);
};
