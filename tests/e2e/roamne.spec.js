import { test, expect } from "@playwright/test";
import axe from "axe-core";
import { openApp } from "./helpers.js";

const routes = [
  ["Explore", "/index.html", "explore"],
  ["Planner", "/planner.html", "planner"],
  ["Travel guide", "/guide.html", "guide"],
  ["My trips", "/trips.html", "trips"],
  ["Settings", "/settings.html", "settings"],
];
const viewports = [320, 375, 390, 400, 430, 768, 1024, 1440];

async function scanAxe(page, label) {
  if (!(await page.evaluate(() => Boolean(window.axe))))
    await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () =>
    window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    }),
  );
  expect(
    results.violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target),
    })),
    `${label} axe scan`,
  ).toEqual([]);
}

test.describe("RoamNE brand and multi-page site", () => {
  test("uses RoamNE branding, the approved tagline and canonical host on all pages", async ({
    page,
  }) => {
    await openApp(page);
    for (const [label, route, pageName] of routes) {
      await page.goto(route);
      await expect(page).toHaveTitle(/RoamNE/);
      await expect(page.locator("body")).toHaveAttribute("data-page", pageName);
      await expect(page.locator(".brand-name").first()).toHaveText("RoamNE");
      await expect(page.locator(".brand").first()).toHaveAttribute(
        "aria-label",
        "RoamNE — Explore India's Gateway to Southeast Asia",
      );
      await expect(page.locator(".site-footer")).toContainText(
        "Explore India's Gateway to Southeast Asia.",
      );
      await expect(
        page.locator('meta[property="og:site_name"]'),
      ).toHaveAttribute("content", "RoamNE");
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        /RoamNE/,
      );
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute(
        "content",
        /^Explore India's Gateway to Southeast Asia\./,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /\/assets\/brand\/roamne-social-preview\.jpg$/,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(
          `^https://roamne\\.vercel\\.app/${pageName === "explore" ? "?$" : `${pageName === "planner" ? "planner" : pageName === "guide" ? "guide" : pageName === "trips" ? "trips" : "settings"}\\.html$`}`,
        ),
      );
      await expect(page.locator(".brand-mark").first()).toHaveJSProperty(
        "complete",
        true,
      );
      expect(
        await page
          .locator(".brand-mark")
          .first()
          .evaluate((image) => image.naturalWidth),
        `${label} logo must load`,
      ).toBeGreaterThan(0);
      await expect(page.locator("body")).not.toContainText(/TravelMateNE/);
    }
    const preview = await page.request.get(
      "http://127.0.0.1:4173/assets/brand/roamne-social-preview.jpg",
    );
    expect(preview.ok()).toBe(true);
    expect(preview.headers()["content-type"]).toContain("image/jpeg");
  });

  test("all five pages avoid horizontal scrolling at required viewport widths", async ({
    page,
  }) => {
    await openApp(page);
    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });
      for (const [label, route] of routes) {
        await page.goto(route);
        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        expect(
          dimensions.content,
          `${label} overflows at ${width}px`,
        ).toBeLessThanOrEqual(dimensions.viewport + 1);
      }
    }
  });

  test("all twelve destination card images load from the local bundle", async ({
    page,
  }) => {
    await openApp(page);
    const images = page.locator(".destination-card .destination-image img");
    await expect(images).toHaveCount(12);
    await images.evaluateAll((nodes) =>
      nodes.forEach((image) => {
        image.loading = "eager";
      }),
    );
    await expect
      .poll(() =>
        images.evaluateAll(
          (nodes) =>
            nodes.filter((image) => image.complete && image.naturalWidth > 0)
              .length,
        ),
      )
      .toBe(12);
  });

  test("mobile navigation supports focus, Escape, and outside dismissal", async ({
    page,
  }) => {
    await openApp(page);
    const toggle = page.locator(".mobile-menu"),
      nav = page.locator(".main-nav");
    for (const [width, height] of [
      [320, 260],
      [320, 480],
      [390, 844],
      [430, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(nav).toHaveJSProperty("inert", true);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator('[data-tab="explore"]')).toBeFocused();
      await expect(nav).toHaveJSProperty("inert", false);
      const bounds = await nav.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          height: element.clientHeight,
        };
      });
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(height + 1);
      await page.keyboard.press("Escape");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page.mouse.click(width - 2, 1);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("appearance preference persists across pages and Auto follows the system", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await openApp(page);
    const selector = page.locator("#appearance-select");
    await expect(selector).toHaveValue("auto");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await selector.selectOption("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await selector.selectOption("dark");

    for (const [label, route] of routes) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await expect(page.locator("#appearance-select")).toHaveValue("dark");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await scanAxe(page, `${label} dark appearance`);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#appearance-select").selectOption("auto");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("roamne-appearance")),
      )
      .toBe("auto");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("back-to-top is available after scrolling and hides while mobile navigation is open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    const control = page.locator("#back-to-top");
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(control).toBeVisible();
    await page.locator(".mobile-menu").click();
    await expect(control).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator(".mobile-menu")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(control).toBeVisible();
    await control.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(5);
  });

  test("all five pages pass axe on desktop and mobile", async ({ page }) => {
    await openApp(page);
    for (const [label, route] of routes) {
      for (const [viewportName, width, height] of [
        ["desktop", 1440, 1000],
        ["mobile", 390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        await page.goto(route);
        await scanAxe(page, `${label} ${viewportName}`);
      }
    }
  });

  test("planner and destination modules load only on the pages that need them", async ({
    page,
  }) => {
    await openApp(page);
    const exploreResources = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).pathname),
    );
    expect(exploreResources).toContain("/modules/slideshow.js");
    expect(exploreResources).not.toContain("/modules/planner.js");
    await page.goto("/planner.html");
    const plannerResources = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => new URL(entry.name).pathname),
    );
    expect(plannerResources).toContain("/modules/planner.js");
  });

  test("offline state explains which features need a connection", async ({
    page,
    context,
  }) => {
    await openApp(page);
    await context.setOffline(true);
    await expect(page.locator("#app-notice")).toContainText(
      "Bundled destination details remain available",
    );
    await expect(page.locator("#app-notice")).toContainText(
      "map tiles and account sync need a connection",
    );
    await context.setOffline(false);
  });
});
