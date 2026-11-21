import { test, expect } from "@playwright/test";
import { openApp, signInAs } from "./helpers.js";

test.describe("mocked Supabase RLS boundary contract", () => {
  test("renders search input as text instead of executable markup", async ({
    page,
  }) => {
    await openApp(page);
    await page.evaluate(() => {
      window.__searchXssProbe = 0;
    });
    await page
      .locator("#search-input")
      .fill('<img src=x onerror="window.__searchXssProbe=1">');
    await expect(page.locator("#filter-chips img")).toHaveCount(0);
    expect(await page.evaluate(() => window.__searchXssProbe)).toBe(0);
    await expect(page.locator("#filter-chips")).toContainText(
      "<img src=x onerror=",
    );
  });

  test("rejects an insecure non-loopback Supabase URL", async ({ page }) => {
    await page.route("https://**", (route) => route.abort());
    await page.route("**/supabase-config.js", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "window.TRAVELMATENE_SUPABASE={url:'http://untrusted.example',publishableKey:'sb_publishable_test_key'};",
      }),
    );
    await page.goto("/trips.html");
    await expect(page.locator("#trips-message")).toContainText(
      "not safe for browser authentication",
    );
    await expect(page.locator("#auth-trigger")).toContainText(
      "Login / Sign Up",
    );
  });

  test("keeps all private tables owner-scoped for two accounts and denies anonymous reads", async ({
    page,
    browser,
  }) => {
    await openApp(page, { supabase: true });
    const anonymous = await page.evaluate(async () => {
      const client = window.__travelMateTestClient;
      const privateResults = await Promise.all(
        ["profiles", "favorites", "itineraries"].map((table) =>
          client.from(table).select("*"),
        ),
      );
      const publicDestinations = await client.from("destinations").select("*");
      return {
        privateStatuses: privateResults.map((result) => result.error?.status),
        publicCount: publicDestinations.data?.length,
      };
    });
    expect(anonymous.privateStatuses).toEqual([401, 401, 401]);
    expect(anonymous.publicCount).toBe(12);

    const auditAccount = async (account, other) => {
      const accountPage = await browser.newPage();
      try {
        await openApp(accountPage, { supabase: true });
        await signInAs(accountPage, account);
        return await accountPage.evaluate(
          async ({ accountId, otherId }) => {
            const client = window.__travelMateTestClient;
            const specs = {
              profiles: {
                owner: "id",
                own: { id: accountId, username: `${accountId}-changed` },
                foreign: { id: otherId, username: "foreign-write" },
              },
              favorites: {
                owner: "user_id",
                own: { user_id: accountId, destination_id: 10 },
                foreign: { user_id: otherId, destination_id: 11 },
              },
              itineraries: {
                owner: "user_id",
                own: {
                  user_id: accountId,
                  title: "Own disposable test",
                  plan: {},
                },
                foreign: {
                  user_id: otherId,
                  title: "Foreign disposable test",
                  plan: {},
                },
              },
            };
            const result = {};
            for (const [table, spec] of Object.entries(specs)) {
              const own = await client
                .from(table)
                .select("*")
                .eq(spec.owner, accountId);
              const other = await client
                .from(table)
                .select("*")
                .eq(spec.owner, otherId);
              const insert = await client.from(table).insert(spec.foreign);
              const update = await client
                .from(table)
                .update(spec.own)
                .eq(spec.owner, otherId);
              const remove = await client
                .from(table)
                .delete()
                .eq(spec.owner, otherId);
              result[table] = {
                ownCount: own.data?.length,
                otherCount: other.data?.length,
                insertStatus: insert.error?.status,
                updatedCount: update.data?.length,
                deletedCount: remove.data?.length,
              };
            }
            return result;
          },
          { accountId: `test-user-${account}`, otherId: `test-user-${other}` },
        );
      } finally {
        await accountPage.close();
      }
    };

    for (const [account, other] of [
      ["a", "b"],
      ["b", "a"],
    ]) {
      const result = await auditAccount(account, other);
      for (const table of ["profiles", "favorites", "itineraries"]) {
        expect(result[table], `${account} -> ${table}`).toMatchObject({
          ownCount: 1,
          otherCount: 0,
          insertStatus: 403,
          updatedCount: 0,
          deletedCount: 0,
        });
      }
    }
  });

  test("does not display private saved trips until the visitor signs in", async ({
    page,
  }) => {
    await openApp(page, { supabase: true });
    await page.locator('[data-tab="trips"]').click();
    await expect(page.locator(".trips-message")).toContainText(
      "Sign in to save",
    );
    await expect(page.locator(".saved-trip-card")).toHaveCount(0);
  });
});
