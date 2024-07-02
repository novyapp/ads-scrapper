import { chromium } from "playwright";

import fs from "fs";
import path from "path";
import { ALLEGRO_LOC_SWITCH_NEW_GAMES } from "./types/allegroLokalnie/const";

const __dirname = path.resolve();
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(ALLEGRO_LOC_SWITCH_NEW_GAMES);
  let allExtractedItems = [];

  async function handleConsentModal() {
    await page.evaluate(() => {
      const modal = document.getElementById("opbox-gdpr-consents-modal");
      if (modal) {
        modal.remove();
      }
    });
  }

  while (true) {
    await handleConsentModal();

    const extractedItems = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll(".mlc-card.mlc-itembox")
      );
      const filteredItems = [];

      items.forEach((item) => {
        // Check if the item contains the promoted ad button
        const adButton = item.querySelector(".mlc-itembox__promoted-button");
        if (!adButton) {
          // Item does not contain promoted ad button, extract data
          const titleElement = item.querySelector("h3");
          const priceElement = item.querySelector(".ml-offer-price__dollars");
          if (titleElement && priceElement) {
            filteredItems.push({
              title: titleElement.textContent.trim(),
              price: priceElement.textContent.trim(),
            });
          }
        }
      });

      return filteredItems;
    });

    console.log(extractedItems);
    allExtractedItems = allExtractedItems.concat(extractedItems);

    const nextButton = await page.$(
      'a.ml-pagination__link span:has-text("Następna strona")'
    );
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(1000); // Adjust the timeout as needed
      await page.waitForSelector(".mlc-card.mlc-itembox", {
        state: "visible",
        timeout: 2000,
      }); // Wait for the items to load
    } else {
      break;
    }
  }
  const data = JSON.stringify(allExtractedItems, null, 2);
  const filePath = path.join(__dirname, "data", "dballegro.json");

  fs.writeFileSync(filePath, data);

  console.log(allExtractedItems);

  await context.close();
  await browser.close();
})();
