import { test, expect } from "@playwright/test";
import { scraper } from "../olx";

const hypothesis = true;

// Make sure tests run in serial mode, so if we write to a database, we know the order of operations
test.describe.configure({ mode: "serial" });
// Run indefinitely
test.setTimeout(0);

test("Scrape data", async ({ page }) => {
  await scraper(page);

  expect(hypothesis).toBe(true);
});
