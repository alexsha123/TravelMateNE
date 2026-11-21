# RoamNE quality audit

## Final pre-release polish — 2026-11-22

### Appearance, navigation, slideshow, and recovery states

The shared appearance control now supports Auto, Light, and Dark across all five routes. A small inline head bootstrap applies the saved choice before CSS paints to prevent a light-to-dark flash; Auto tracks system preference changes, while manual choices remain persisted across pages and reloads. Dark surfaces and text were tuned against WCAG 2.2 AA checks. The mobile disclosure navigation was checked at 320, 375, 390, 400, and 430 CSS pixels, including a short 260px viewport; it supports focus-on-open, Escape and outside-click dismissal, and closes without covering the back-to-top control. Hero autoplay uses a single 3,000ms timer, pauses for reduced motion, hidden tabs, focus, hover, and recent interaction, and retains its crossfade, swipe, arrows, and dots.

Destination no-results messaging and reset controls, image and map retries, Supabase destination-read retry, online/offline notices, and the shared back-to-top control have regression coverage. Open Graph and Twitter cards use a locally bundled branded 1200 × 630 JPEG and the tagline “Explore India's Gateway to Southeast Asia.” The image preview uses an already verified Ziro Valley photograph and its existing attribution metadata.

### Production public Supabase configuration audit

On 2026-11-22, read-only requests to `https://roamne.vercel.app` and `https://travelmatene.vercel.app` returned HTTP 200 for both the homepage and the public `supabase-config.js`. The browser config in both deployments was present and used the Supabase publishable-key prefix; anonymous `GET /rest/v1/destinations?select=id&limit=20` returned HTTP 200 and 12 public rows for each. The config/key values were not printed. No secret/service-role key, schema, RLS policy, production environment variable, or domain alias was changed.

This verifies the deployed public config and destination read path, but does not expose or independently inspect Vercel's environment-variable dashboard. The static Vercel build expects `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Production and any Preview/Development contexts that need Supabase; use only the URL and `sb_publishable_...` key. Do not add `SUPABASE_SECRET_KEY` or a service-role key to browser build variables. The current deployed sites still show the older TravelMateNE release because this local candidate has not been deployed. Supabase Auth redirect allow-list and Google OAuth provider behavior remain manual/live-provider checks for the final domain.

### Verification for this pass

`npm run test:all` passed 49 release tests (11 Vitest and 38 Playwright browser tests). Six isolated cleanup-helper tests use mocks only and remain local-only, outside the release test command. The suite covers all five routes, search/reset, retry and offline states, dark theme, responsive layouts, navigation, slideshow timing and pause behavior, map fallback, and account-bound mocked operations. The account-deletion feature was not exercised against an account, and remains absent from production output. Final Lighthouse mobile results for this pass are recorded below after repeat runs.

Two Lighthouse 13.6 mobile runs against the built site at `http://127.0.0.1:8174/index.html` scored performance 85 and 86, accessibility 100, Best Practices 100, and SEO 100 on both. FCP was 1.9s and 1.2s; simulated LCP 4.1s and 4.2s; TBT 10ms and 20ms; CLS 0.007 on both. Each run recorded 38 requests and 1,781 KiB transfer. Against the immediately preceding post-image runs (performance 84–85, LCP 4.21–4.36s, TBT 12–71ms, 36 requests and 1,669–1,670 KiB), the score and LCP are roughly stable to slightly better and TBT remains low; request count and transfer varied upward, likely from loaded third-party responses. These are lab values, not field measurements.

The live map was opened through the same HTTP build at 1440px desktop and 390 × 844 mobile. Both rendered 12 markers and a MapLibre canvas without page errors; OpenFreeMap/OpenMapTiles received 41 successful responses on desktop and 33 on mobile, with no failed provider responses. The mobile page had no horizontal overflow. On desktop, zooming and activating the Shillong marker opened its detail panel.

## Supabase and performance follow-up — 2026-11-22

### Destination read diagnosis

The anonymous Supabase REST request to `/rest/v1/destinations` returned HTTP 200 with 12 rows and the expected schema fields (`name`, `state`, `description`, `image_url`, `latitude`, `longitude`, `daily_budget`, `vibes`, `seasons`, and `details`). RLS was not the cause. The frontend then threw `TypeError: Cannot read properties of null (reading 'value')`: the Explore page has no `#guide-destination` select, but the successful destination-load path dereferenced it unconditionally. `loadRemoteDestinations()` now refreshes guide content only when that page-specific selector exists. A new browser regression test failed before the guard and passed afterward. Through the rebuilt HTTP site, the same request returned 12 rows, all 12 cards rendered, the warning stayed hidden, and no Supabase fallback warning was logged. No schema, RLS policy, or production setting changed.

### Performance method and findings

Lighthouse 13.6 ran against the same local HTTP URL with the same Chromium build and default mobile simulation: three cold mobile runs before and three after the image change, plus two desktop runs in each set. A separate Playwright/CDP loop used 4× CPU slowdown, 150ms latency, 1.6Mbps download, a 412×823 viewport, DPR 1.75, disabled cache, and three uncached runs on each side. The mobile TBT outlier of 1,770ms from the earlier single run did not recur. The repeated default mobile TBT was 25–116ms before and 12–71ms after. Lighthouse trace records also showed browser-observed LCP at 201–336ms after the change, while Lighthouse's simulated LCP remained much higher; a provided-throttling diagnostic before the image change reported 0.4s LCP and 20ms TBT. The 5-second autoplay was not the LCP candidate in the captured trace.

The reproducible throttled-browser bottleneck was the initial hero image: the 960px mobile WebP transferred 180,180 bytes, with response completion around 2.62s and observed LCP at 3.17–3.67s. I produced 800px mobile derivatives from the same verified images, using WebP quality 85. The 800px source exceeds the tested viewport's 721 physical-pixel width, and the original 1600px source remains available for higher-density selection. Side-by-side captures at the target mobile display size showed no visible quality loss. The 12 mobile slideshow files total 1,045,882 bytes after optimization, down from 1,485,514 bytes (29.6% smaller); the first image transfer fell to 127,682 bytes (29.1% smaller).

| Measure                              |  Mobile before (3 runs) | Mobile after (3 runs) | Desktop before (2 runs) | Desktop after (2 runs) |
| ------------------------------------ | ----------------------: | --------------------: | ----------------------: | ---------------------: |
| Lighthouse performance               |                   79–80 |                 84–85 |                      99 |                    100 |
| Accessibility / Best Practices / SEO |         100 / 100 / 100 |       100 / 100 / 100 |         100 / 100 / 100 |        100 / 100 / 100 |
| FCP                                  |              1.21–1.81s |            1.21–1.92s |              0.28–0.29s |             0.29–0.46s |
| Lighthouse simulated LCP             |              5.18–5.26s |            4.21–4.36s |              0.96–0.97s |                  0.80s |
| TBT                                  |                25–116ms |               12–71ms |                   0–1ms |                    0ms |
| CLS                                  |           0.0004–0.0084 |         0.0064–0.0088 |           0.0052–0.0061 |          0.0052–0.0061 |
| Transfer / requests                  | 1,754–1,874 KiB / 36–38 |  1,669–1,670 KiB / 36 |          1,754 KiB / 36 |         1,670 KiB / 36 |

In the separate throttled Playwright loop, median observed mobile LCP improved from 3.53s to 2.08s (about 1.45s faster); the image response completed in 1.74–2.36s after optimization. This diagnostic uses explicit network and CPU throttling and is distinct from Lighthouse's simulated LCP. The latter improved by about 0.97s at the median. Lighthouse runs still vary, so field performance should be checked after deployment; no deployment was performed.

### Google OAuth on the new domain

The live `https://roamne.vercel.app/` request returned HTTP 200, but it still serves the old TravelMateNE title/brand. Its auth modal showed “Add your local Supabase URL and publishable key first,” and clicking its Google button produced no `/auth/v1/authorize` request. So live Google OAuth cannot be verified on that domain before an updated deployment and its existing Vercel/Supabase configuration. I did not deploy or change those settings. A new mock unit test verifies the local Google OAuth call requests the current safe redirect `https://roamne.vercel.app/settings.html`; this is a mocked frontend test, not live provider verification.

The preexisting verified backup ZIP remains unchanged. The account-deletion feature and Edge Function remain local and excluded from the release build.

## RoamNE redesign follow-up — 2026-11-22

This follow-up compares a fresh baseline taken immediately before the redesign with Lighthouse 13.6 runs against the rebuilt site at `http://127.0.0.1:8174/index.html`. It uses the same Chromium build, local HTTP server, and Lighthouse presets. Desktop was run once after the changes; mobile was run twice because the first result was an outlier. These are lab measurements and external service timing can vary.

| Device  | Metric                               |          Before |      After run 1 |    After repeat |
| ------- | ------------------------------------ | --------------: | ---------------: | --------------: |
| Desktop | Performance                          |              99 |               99 |               — |
| Desktop | Accessibility / Best Practices / SEO | 100 / 100 / 100 |  100 / 100 / 100 |               — |
| Desktop | FCP / LCP                            |   0.3 s / 0.9 s |    0.3 s / 0.9 s |               — |
| Desktop | TBT / CLS                            |    0 ms / 0.012 |     0 ms / 0.006 |               — |
| Desktop | Transfer / requests                  |  1,766 KiB / 38 |   1,753 KiB / 36 |               — |
| Mobile  | Performance                          |              81 |               51 |              76 |
| Mobile  | Accessibility / Best Practices / SEO | 100 / 100 / 100 |  100 / 100 / 100 | 100 / 100 / 100 |
| Mobile  | FCP / LCP                            |   1.8 s / 4.9 s |    1.2 s / 5.8 s |   1.2 s / 5.3 s |
| Mobile  | TBT / CLS                            |    0 ms / 0.006 | 1,770 ms / 0.002 |  230 ms / 0.016 |
| Mobile  | Transfer / requests                  |  1,767 KiB / 38 |   1,754 KiB / 36 |  1,754 KiB / 36 |

The redesign retained the 99 desktop score and cut two requests and about 13 KiB from the lab transfer. Mobile first-contentful-paint improved, but Lighthouse mobile performance was variable (51 then 76 versus 81 before), and both after runs had a slower LCP. The first run reported 1,770 ms TBT; the repeat reported 230 ms. This is a remaining performance issue, not a claimed mobile improvement. Lighthouse attributed part of the repeat's long-task activity to the client Supabase bundle and main-thread style/layout work. The initial hero image is discoverable, eager, and fetch-prioritized; it remains the LCP element. Recheck on a representative production connection before treating the mobile score as stable.

The separate live HTTP map check rendered 12 Leaflet markers, displayed OpenFreeMap/OpenMapTiles/OpenStreetMap attribution, and received 41 style, sprite, and vector-tile responses with HTTP 200. Clicking the Shillong marker opened its destination details. A second check on the mobile Planner page rendered all 12 markers and received 39 successful map responses with no horizontal overflow. The map's busy state cleared and no browser page errors were observed. A deterministic Playwright test also exercises the no-tile fallback. Live tile availability is still provider- and network-dependent.

All five built pages were checked at desktop and mobile widths, with no horizontal overflow; the logo loaded; all twelve bundled card images loaded when made eager; and axe-core reported zero violations in the scanned page states. The release build contained five pages and twelve local card images, no account-deletion UI/handlers or Edge Function files, no old user-facing TravelMateNE labels, and a browser key validated as publishable-only. The ignored local Supabase config is not tracked. No Git staging, commit, push, deployment, database schema, or policy change was made.

Date: 2026-11-21. The desktop/mobile Lighthouse runs used Lighthouse 13.6 against the local HTTP server at `127.0.0.1:4181`, with Chromium from Playwright. This is a repeatable lab comparison, not field data. The baseline and final runs used the same host and page; external font/map providers and network timing can still vary between runs. Desktop used Lighthouse's desktop preset; mobile used its default mobile throttling.

## Lighthouse: before and after

| Device  | Measure                   |               Before |            After run 1 → repeat |            Final run(s) |
| ------- | ------------------------- | -------------------: | ------------------------------: | ----------------------: |
| Desktop | Performance               |                   23 |                         60 → 99 |                      99 |
| Desktop | Accessibility             |                   88 |                       100 → 100 |                     100 |
| Desktop | Best Practices / SEO      |             96 / 100 |           100 / 100 → 100 / 100 |               100 / 100 |
| Desktop | FCP / LCP                 |       4.2 s / 18.2 s |   0.5 s / 1.9 s → 0.4 s / 0.8 s |           0.4 s / 1.0 s |
| Desktop | Total Blocking Time / CLS |     4,164 ms / 0.083 | 1,210 ms / 0.005 → 0 ms / 0.007 |            0 ms / 0.012 |
| Desktop | Transfer / requests       | 8,236,828 bytes / 74 | 1,729 KiB / 29 → 1,849 KiB / 30 |          1,886 KiB / 39 |
| Mobile  | Performance               |                   31 |                         70 → 86 |                 78 → 80 |
| Mobile  | Accessibility             |                   88 |                       100 → 100 |                     100 |
| Mobile  | Best Practices / SEO      |             96 / 100 |           100 / 100 → 100 / 100 |               100 / 100 |
| Mobile  | FCP / LCP                 |       2.6 s / 14.9 s |   2.0 s / 6.0 s → 1.7 s / 4.1 s |   1.8–1.9 s / 5.2–5.3 s |
| Mobile  | Total Blocking Time / CLS |     5,640 ms / 0.009 |  180 ms / 0.006 → 20 ms / 0.011 | 10–100 ms / 0.006–0.009 |
| Mobile  | Transfer / requests       | 7,846,841 bytes / 74 | 1,730 KiB / 31 → 1,729 KiB / 29 |    1,766–1,767 KiB / 38 |

Repeated Lighthouse runs varied materially, especially for desktop performance (60–99) and mobile performance/LCP (78–86 / 4.1–6.0 seconds in the after runs). Both final mobile repeats still improve the baseline, though they are below the previous 86 score. The current mobile LCP image is discoverable, priority-hinted, eagerly loaded, and its measured request is small/fast; the LCP score nevertheless remains a lab concern. The largest code-level savings came from serving 800px WebP card derivatives instead of full-size photos, loading map libraries only when the map enters view, deferring Google Fonts CSS, preloading the initial hero photo, and adding responsive image candidates. The twelve card derivatives total about 884 KiB. Lighthouse still estimates about 82 KiB of unused JavaScript and 33 KiB of unused CSS on mobile, so route-level code splitting is a future optimization. Current mobile transfer is about 1.77 MiB across 38 requests.

## Accessibility

The before audit found 110 color-contrast node instances, one guide select without an accessible name, an authentication button name mismatch, and 12 slideshow indicators below the recommended touch target. Changes darkened muted/terracotta text, labeled the guide select, corrected the authentication control name, increased the hit areas of slide indicators while preserving the small visual dots, added visible keyboard focus, and added modal focus return/trapping plus Escape behavior.

Final axe-core checks reported zero violations in five scanned states: desktop explorer, destination dialog, mobile explorer, mobile navigation, and mobile planner. Lighthouse Accessibility scored 100 on both viewports. These checks do not replace manual screen-reader and real-device evaluation.

## Security review

- Fixed a reflected markup injection path: search text had been interpolated into filter-chip HTML. The renderer now creates text nodes and regression coverage confirms an image/event-handler payload stays inert.
- Browser Supabase configuration now rejects non-HTTPS project URLs except loopback HTTP used for local development, rejects URL credentials/path/query/hash, and rejects secret/service-role key formats. The static build emits only a publishable key.
- Auth redirects are limited to HTTPS or loopback HTTP, and remote Supabase/Leaflet/MapLibre assets use pinned versions with integrity hashes.
- Favorites, profiles, and itineraries remain owner-filtered in browser queries. Added synthetic account A/B and anonymous regression coverage using a mocked Supabase client; it exercises expected owner scoping, not production Postgres enforcement.
- No live credentials were printed or changed. No schema or RLS policies were altered. The read-only query in `supabase/audit-rls.sql` was not executed here, and actual production RLS remains unverified. Run that SQL in the project SQL Editor and review the policies before relying on production isolation.
- A deployment build check strips the untested account-deletion UI and event handlers from `dist/`; the local source and Edge Function remain in the workspace for future testing. No account-deletion behavior was exercised.

## Travel-planning content

The explorer still covers 12 destinations across all eight North East states. Permit labels and copy now distinguish Indian ILP requirements from foreign visitor PAP/RAP checks where those distinctions are established, and Sikkim restricted-route guidance describes permit requirements as route/visitor-dependent. Destinations without a permit requirement in this guide say “No special permit is listed,” rather than asserting that no permit can ever apply. The guide asks travelers to confirm current requirements with the relevant authorities. Budget and travel conditions remain clearly estimates; the planner has no live traffic, booking, price, or road-condition feed.

Official permit references used for the copy review:

- [Arunachal Pradesh Tourism: arrival formalities](https://arunachaltourism.com/arrival-formalities/) and [eILP information](https://eilp.arunachal.gov.in/ilpInfo)
- [Nagaland ILP portal](https://ilp.nagaland.gov.in/about)
- [Mizoram ILP portal](https://ilp.mizoram.gov.in/)
- [Manipur ILP portal](https://manipurilponline.mn.gov.in/forms/temporary-permit-info.aspx)
- [Sikkim Tourism: PAP](https://www.sikkimtourism.gov.in/pap) and [RAP](https://www.sikkimtourism.gov.in/rap)

## Verification

- `npm run test:all`: passed, 8 Vitest tests, 6 mocked account-deletion helper tests, and 28 Playwright browser tests (42 total).
- Playwright axe checks: passed with zero axe violations across the five pages at desktop and mobile sizes, plus the destination dialog and relevant mobile states.
- `npm run lint`: passed.
- `npm run format:check`: passed for application rules, build/config files, and unit/browser tests.
- `npm run build`: passed. Confirmed all five generated pages and all 12 destination card images are present; scanned generated HTML/JS/CSS and found no account-deletion UI, handlers, or Edge Function deployment files.
- A temporary clean Git archive with current release-candidate source overlaid built successfully and passed the same output-boundary checks. No files were staged or committed.
- `npm audit --omit=dev`: 0 reported vulnerabilities.
- `npm run audit:lighthouse:desktop` and `npm run audit:lighthouse:mobile` completed for this follow-up; fresh results and known mobile variance are listed at the top of this document. Reports are written to the OS temporary directory as `roamne-lighthouse-{desktop,mobile}.json`.

RLS policies and live Supabase permissions were not changed or tested against production. Map tile delivery depends on OpenFreeMap and a browser network connection; the app retains its offline map fallback. Lighthouse scores are single-run lab measurements and may vary across machines and provider conditions.
