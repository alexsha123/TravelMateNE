import { test, expect } from "@playwright/test";
import axe from "axe-core";
import { openApp } from "./helpers.js";

async function axeScan(page, label) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () =>
    axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    }),
  );
  const violations = results.violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    targets: nodes.map((node) => node.target),
    examples: nodes.slice(0, 3).map((node) => node.failureSummary),
  }));
  if (violations.length)
    console.log(`${label} axe violations`, JSON.stringify(violations));
  expect(violations, `${label} must satisfy the axe WCAG checks`).toEqual([]);
}

test.describe("axe accessibility checks", () => {
  test("desktop explorer and destination detail modal", async ({ page }) => {
    await openApp(page);
    await axeScan(page, "desktop explorer");
    await page.locator(".destination-card").first().click();
    await axeScan(page, "destination modal");
  });

  test("destination details manage focus and close with Escape", async ({
    page,
  }) => {
    await openApp(page);
    const card = page.locator(".destination-card").first();
    await card.click();
    await expect(page.locator(".destination-modal .modal-close")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator(".destination-modal .modal-plan")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#destination-modal")).toBeHidden();
    await expect(card).toBeFocused();
  });

  test("loads map code only near the map and leaves a readable offline fallback", async ({
    page,
  }) => {
    await openApp(page);
    expect(page.url()).toContain("/index.html");
    const earlyMapRequests = await page.evaluate(
      () =>
        performance
          .getEntriesByType("resource")
          .filter((entry) => /leaflet|maplibre/i.test(entry.name)).length,
    );
    expect(earlyMapRequests).toBe(0);
    await page.locator("#destination-map").scrollIntoViewIfNeeded();
    await expect(page.locator("#destination-map .map-fallback")).toBeVisible();
    await expect(page.locator(".destination-card")).toHaveCount(12);
  });

  test("mobile navigation and planner form", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await axeScan(page, "mobile explorer");
    await page.locator(".mobile-menu").click();
    await axeScan(page, "mobile navigation");
    await page.locator('[data-tab="planner"]').click();
    await axeScan(page, "mobile planner");
  });
});
