import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { ALLEGRO_LOC_SWITCH_NEW_GAMES } from "./types/allegroLokalnie/const";
import { Page } from "@playwright/test";

const __dirname = path.resolve();
export const scraperAllegro = async (page: Page) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await page.goto(ALLEGRO_LOC_SWITCH_NEW_GAMES);
  let allExtractedItems = [];
  let pageCount = 0;
  const maxPages = 10;

  async function handleConsentModal() {
    await page.evaluate(() => {
      const modal = document.getElementById("opbox-gdpr-consents-modal");
      if (modal) {
        modal.remove();
      }
    });
  }

  while (pageCount < maxPages) {
    await handleConsentModal();

    const extractedItems = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll(
          "article.mlc-itembox__container.is-desktop-vertical"
        )
      );
      const filteredItems = [];

      items.forEach((item) => {
        // Item does not contain promoted ad button, extract data
        const titleElement = item.querySelector<HTMLHeadingElement>("h3");
        const addressElement = item.querySelector("address");
        const priceElement = item.querySelector<HTMLElement>(
          ".ml-offer-price__dollars"
        );
        const imgElement = item.querySelector<HTMLImageElement>(
          ".mlc-itembox__image__wrapper img"
        );

        const svgIcon = item.querySelector(
          '[class="mlc-itembox__promoted-button"] p'
        );

        const smartElement = item.querySelector(
          ".mlc-smart-icon.mlc-smart-icon--small.mlc-itembox__smart-icon svg"
        );

        // Extract the URL and unique ID
        const urlElement = item.querySelector("a.mlc-card.mlc-itembox"); // Select the <a> element

        const url = urlElement.getAttribute("href");
        const localId = urlElement.getAttribute("data-card-analytics-click");

        if (titleElement && priceElement) {
          filteredItems.push({
            id: localId,
            title: titleElement.textContent.trim(),
            price: priceElement.textContent.trim(),
            img: imgElement.src,
            url: `https://allegrolokalnie.pl/${url}`,
            promoted: !!svgIcon,
            smartPost: !!smartElement,
            city: addressElement.textContent,
          });
        }
      });

      return filteredItems;
    });

    allExtractedItems.push(...extractedItems);

    const nextButton = await page.$(
      'a.ml-pagination__link span:has-text("Następna strona")'
    );
    if (nextButton && pageCount < maxPages - 1) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForSelector(".mlc-card.mlc-itembox", {
        state: "visible",
        timeout: 20000,
      }); // Wait for the items to load
    } else {
      break;
    }
    pageCount++;
  }

  const data = JSON.stringify(allExtractedItems, null, 2);
  const filePath = path.join(__dirname, "data", "allegroLokalnie.json");

  fs.writeFileSync(filePath, data);

  await context.close();
  await browser.close();
};
