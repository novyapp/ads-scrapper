import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { OLX_SWITCH_NEW_GAMES } from "./types/olx/const";
import {
  getOlxProductCity,
  getOlxProductCondition,
  getOlxProductDate,
} from "./utils/olx";
import { AD_TYPE, IAdItem, IOlxRawData } from "./types/interfaces";

const __dirname = path.resolve();

(async () => {
  // Read existing data from JSON file
  const filePath = path.join(__dirname, "data", "olx.json");
  let existingData: IAdItem[] = [];
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, "utf-8");
    existingData = JSON.parse(rawData);
  }
  // Extract existing IDs
  const existingIds = new Set(existingData.map((item) => item.localId));
  try {
    // Launch a headless browser
    const browser = await chromium.launch({ headless: true });

    // Open a new page
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the desired URL
    await page.goto(OLX_SWITCH_NEW_GAMES);

    // Select and extract data from the page
    const extractedItems = await page.evaluate(() => {
      // Select elements from main list
      const items = Array.from(
        document.querySelectorAll('[data-cy="l-card"][data-testid="l-card"]')
      );

      // Generate array of products
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

    // Filter out already existing items by ID
    const newItems = extractedItems.filter(
      (item) => !existingIds.has(item.localId)
    );

    console.log(newItems);

    // Convert new items to final data format
    const finalData: IAdItem[] = newItems.map((data) => {
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

    // Combine existing data with new items
    const updatedData = [...existingData, ...finalData];

    // Sort the combined data by timestamp (descending) and localId (ascending)
    updatedData.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return b.timestamp - a.timestamp;
      } else if (a.timestamp) {
        return -1;
      } else if (b.timestamp) {
        return 1;
      } else {
        return a.localId - b.localId;
      }
    });

    // Limit the sorted data to the latest 1000 elements
    const limitedData = updatedData.slice(0, 1000);

    // Write the limited data to JSON file
    const data = JSON.stringify(limitedData, null, 2);
    fs.writeFileSync(filePath, data);

    // Log the new items
    //console.log(updatedData);
  } catch (error) {
    console.log(error);
  }
})();
