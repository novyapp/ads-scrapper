import { test, expect } from "@playwright/test";
import { scraperOlx } from "../olx";
import { scraperAllegro } from "../allegro";

const hypothesis = true;

// Make sure tests run in serial mode, so if we write to a database, we know the order of operations
test.describe.configure({ mode: "serial" });
// Run indefinitely
test.setTimeout(0);

test("Scrape data olx", async ({ page }) => {
  await scraperOlx(page);

  expect(hypothesis).toBe(true);
});
test("Scrape data allegro", async ({ page }) => {
  await scraperAllegro(page);

  expect(hypothesis).toBe(true);
});
