import { test, expect } from "@playwright/test";
import { openApp, signInAs } from "./helpers.js";

test.describe("destination discovery and navigation", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await expect(page.locator(".destination-card")).toHaveCount(12);
  });

  test("search and state, vibe and season filters narrow destinations", async ({
    page,
  }) => {
    await page.locator("#search-input").fill("Ziro");
    await expect(page.locator(".destination-card")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Ziro Valley" }),
    ).toBeVisible();

    await page.locator("#clear-filters").click();
    await page.locator("#state-filter").selectOption({ label: "Assam" });
    await expect(page.locator(".destination-card")).toHaveCount(2);
    await page.locator("#vibe-filter").selectOption({ label: "Wildlife" });
    await expect(page.locator(".destination-card")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Kaziranga" }),
    ).toBeVisible();
    await page.locator("#season-filter").selectOption({ label: "Winter" });
    await expect(page.locator(".destination-card")).toHaveCount(1);
  });

  test("navigation changes the active section and destination cards open details", async ({
    page,
  }) => {
    await page.locator('[data-tab="guide"]').click();
    await expect(page.locator('[data-tab="guide"]')).toHaveClass(/active/);
    await page.locator('[data-tab="explore"]').click();
    await page.getByRole("heading", { name: "Ziro Valley" }).click();
    await expect(page.locator("#destination-modal")).toBeVisible();
    await expect(page.locator("#modal-title")).toHaveText("Ziro Valley");
    await expect(page.locator("#modal-content")).toContainText("Apatani");
  });
});

test.describe("trip planning and presets", () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test("planner shows practical transfer days, itemized costs and a budget total", async ({
    page,
  }) => {
    await page.locator('[data-tab="planner"]').click();
    await page.locator("#duration-input").selectOption("3");
    await page.locator("#budget-input").fill("10000");
    await page.locator('#planner-form button[type="submit"]').click();
    await expect(page.locator("#itinerary-overlay")).toBeVisible();
    await expect(page.locator(".itinerary-day")).toHaveCount(3);
    await expect(page.locator("#itinerary-content")).toContainText(
      "Guwahati → Shillong",
    );
    await expect(page.locator("#itinerary-content")).toContainText("Transport");
    await expect(page.locator("#itinerary-content")).toContainText("Permits");
    await expect(page.locator("#itinerary-content")).toContainText(
      "APPROXIMATE INR",
    );

    const totals = await page.evaluate(() => ({
      total: window.currentItinerary.total,
      days: window.currentItinerary.days.map(
        (day) =>
          day.stay +
          day.meals +
          day.transport +
          day.activities +
          day.permitCost,
      ),
    }));
    expect(totals.total).toBe(
      totals.days.reduce((sum, value) => sum + value, 0),
    );
    expect(totals.total).toBeLessThanOrEqual(10000);
  });

  test("warns when duration or budget is inadequate", async ({ page }) => {
    await page.locator("#hub-input").selectOption({ label: "Dibrugarh" });
    await page.locator('input[value="Culture"]').check({ force: true });
    await page.locator("#duration-input").selectOption("2");
    await page.locator("#budget-input").fill("30000");
    await page.locator('#planner-form button[type="submit"]').click();
    await expect(page.locator("#itinerary-content")).toContainText(
      "This route needs more time.",
    );

    await page.locator(".itinerary-close-button").click();
    await page.locator("#duration-input").selectOption("5");
    await page.locator("#budget-input").fill("2500");
    await page.locator('#planner-form button[type="submit"]').click();
    await expect(page.locator("#itinerary-content")).toContainText(
      "A little more budget is needed.",
    );
  });

  test("Guwahati to Shillong and Dawki preset stays within ₹8,000", async ({
    page,
  }) => {
    await page.locator('[data-preset="shillong"]').click();
    await expect(page.locator("#itinerary-overlay")).toBeVisible();
    await expect(page.locator(".itinerary-day")).toHaveCount(3);
    await expect(page.locator("#itinerary-content")).toContainText(
      "Guwahati → Shillong → Dawki",
    );
    await expect(page.locator("#itinerary-content")).toContainText(
      "Shillong → Dawki",
    );
    const result = await page.evaluate(() => ({
      total: window.currentItinerary.total,
      budget: window.currentItineraryMeta.budget,
    }));
    expect(result.total).toBeLessThanOrEqual(8000);
  });

  test("Ziro cultural preset covers five days within its displayed budget", async ({
    page,
  }) => {
    await page.locator('[data-preset="ziro"]').click();
    await expect(page.locator("#itinerary-overlay")).toBeVisible();
    await expect(page.locator(".itinerary-day")).toHaveCount(5);
    await expect(page.locator("#itinerary-content")).toContainText(
      "Apatani villages with a local guide",
    );
    await expect(page.locator("#itinerary-content")).toContainText(
      "8–10 hours",
    );
    await expect(page.locator("#itinerary-content")).toContainText(
      "Return travel day",
    );
    const result = await page.evaluate(() => ({
      total: window.currentItinerary.total,
      budget: window.currentItineraryMeta.budget,
    }));
    expect(result.total).toBeLessThanOrEqual(result.budget);
  });

  test("prints the generated itinerary from its download control", async ({
    page,
  }) => {
    await page.locator('[data-preset="shillong"]').click();
    await page.evaluate(() => {
      window.__travelMatePrintCalled = false;
      window.print = () => {
        window.__travelMatePrintCalled = true;
      };
    });
    await page.locator("#print-itinerary").click();
    await expect
      .poll(() => page.evaluate(() => window.__travelMatePrintCalled))
      .toBe(true);
  });
});

test.describe("slideshow", () => {
  test.beforeEach(async ({ page }) => openApp(page));

  test("shows 12 destinations, changes after five seconds and supports manual navigation", async ({
    page,
  }) => {
    await expect(page.locator("#hero-slide-dots button")).toHaveCount(12);
    const first = await page.locator("#hero-slide-location").textContent();
    await expect
      .poll(() => page.locator("#hero-slide-location").textContent(), {
        timeout: 6500,
      })
      .not.toBe(first);

    const automatic = await page.locator("#hero-slide-location").textContent();
    await page.locator("#hero-slide-next").click();
    await expect(page.locator("#hero-slide-location")).not.toHaveText(
      automatic,
    );
    await page.locator('#hero-slide-dots button[data-hero-index="5"]').click();
    await expect(page.locator("#hero-slide-location")).toHaveText(
      "Ziro Valley · Arunachal Pradesh",
    );
    await expect(page.locator("#hero-slide-credit")).toContainText(
      "Kuntal Narayan Chaudhuri",
    );
    await expect(
      page.locator("#hero-image-a.is-active, #hero-image-b.is-active"),
    ).toHaveCount(1);
    const imageLoaded = await page
      .locator(".hero-slide-image.is-active")
      .evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(imageLoaded).toBe(true);
    await page.locator("#hero-slide-open").click();
    await expect(page.locator("#modal-title")).toHaveText("Ziro Valley");
  });

  test("honors reduced motion and remains keyboard-operable", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const initial = await page.locator("#hero-slide-location").textContent();
    await page.waitForTimeout(5200);
    await expect(page.locator("#hero-slide-location")).toHaveText(initial);
    await page.locator("#hero-slide-next").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#hero-slide-location")).not.toHaveText(initial);
    await expect(
      page.getByRole("button", { name: "Next destination" }),
    ).toBeVisible();
  });
});

test.describe("account-bound features using an isolated Supabase mock", () => {
  test("shows authentication errors and restores a user’s favorite", async ({
    page,
  }) => {
    await openApp(page, { supabase: true });
    await expect(page.locator(".destination-card")).toHaveCount(12);
    await page.locator("#auth-trigger").click();
    await page.locator("#auth-email").fill("traveler-a@example.test");
    await page.locator("#auth-password").fill("wrong-password");
    await page.locator("#auth-submit").click();
    await expect(page.locator("#auth-message")).toContainText(
      "Invalid login credentials",
    );

    await page.locator("#auth-password").fill("test-password");
    await page.locator("#auth-submit").click();
    await expect(page.locator("#auth-trigger")).toContainText("Logout");
    const shillong = page
      .locator(".destination-card")
      .filter({ has: page.getByRole("heading", { name: "Shillong" }) });
    await expect(shillong.locator(".heart-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const dawki = page
      .locator(".destination-card")
      .filter({ has: page.getByRole("heading", { name: "Dawki & Umngot" }) });
    await dawki.locator(".heart-button").click();
    await expect(dawki.locator(".heart-button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("saves and reopens an itinerary without using a real account", async ({
    page,
  }) => {
    await openApp(page, { supabase: true });
    await signInAs(page, "a");
    await expect(page.locator(".saved-trip-card")).toHaveCount(1);
    await page.locator('[data-preset="shillong"]').click();
    await page.locator("#save-itinerary").click();
    await page.locator(".itinerary-close-button").click();
    const saved = page
      .locator(".saved-trip-card")
      .filter({ hasText: "Guwahati → Shillong → Dawki" });
    await expect(saved).toBeVisible();
    await saved.getByRole("button", { name: "Open & print" }).click();
    await expect(page.locator("#itinerary-overlay")).toBeVisible();
    await expect(page.locator("#itinerary-content")).toContainText(
      "Guwahati → Shillong → Dawki",
    );
  });
});

test.describe("mobile responsive and accessible controls", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the hero and navigation usable without horizontal overflow", async ({
    page,
  }) => {
    await openApp(page);
    await expect(page.locator("#hero-slideshow")).toBeVisible();
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heroHeight: document
        .querySelector("#hero-slideshow")
        .getBoundingClientRect().height,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.heroHeight).toBe(300);
    await page.locator(".mobile-menu").click();
    await expect(page.locator(".main-nav")).toHaveClass(/open/);
    await page.locator('[data-tab="planner"]').click();
    await expect(page.locator('[data-tab="planner"]')).toHaveClass(/active/);
  });

  test("exposes labeled slideshow controls and a single page heading", async ({
    page,
  }) => {
    await openApp(page);
    await expect(
      page.getByRole("button", { name: "Previous destination" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next destination" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /North East destinations/ }),
    ).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByRole("searchbox", { name: "Search destinations" }),
    ).toBeVisible();
  });
});
