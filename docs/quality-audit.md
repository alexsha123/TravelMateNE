# TravelMateNE quality audit

Date: 2026-11-21. The desktop/mobile Lighthouse runs used Lighthouse 13.6 against the local HTTP server at `127.0.0.1:4181`, with Chromium from Playwright. This is a repeatable lab comparison, not field data. The baseline and final runs used the same host and page; external font/map providers and network timing can still vary between runs. Desktop used Lighthouse's desktop preset; mobile used its default mobile throttling.

## Lighthouse: before and after

| Device  | Measure                   |               Before |            After run 1 → repeat |
| ------- | ------------------------- | -------------------: | ------------------------------: |
| Desktop | Performance               |                   23 |                         60 → 99 |
| Desktop | Accessibility             |                   88 |                       100 → 100 |
| Desktop | Best Practices / SEO      |             96 / 100 |           100 / 100 → 100 / 100 |
| Desktop | FCP / LCP                 |       4.2 s / 18.2 s |   0.5 s / 1.9 s → 0.4 s / 0.8 s |
| Desktop | Total Blocking Time / CLS |     4,164 ms / 0.083 | 1,210 ms / 0.005 → 0 ms / 0.007 |
| Desktop | Transfer / requests       | 8,236,828 bytes / 74 | 1,729 KiB / 29 → 1,849 KiB / 30 |
| Mobile  | Performance               |                   31 |                         70 → 86 |
| Mobile  | Accessibility             |                   88 |                       100 → 100 |
| Mobile  | Best Practices / SEO      |             96 / 100 |           100 / 100 → 100 / 100 |
| Mobile  | FCP / LCP                 |       2.6 s / 14.9 s |   2.0 s / 6.0 s → 1.7 s / 4.1 s |
| Mobile  | Total Blocking Time / CLS |     5,640 ms / 0.009 |  180 ms / 0.006 → 20 ms / 0.011 |
| Mobile  | Transfer / requests       | 7,846,841 bytes / 74 | 1,730 KiB / 31 → 1,729 KiB / 29 |

Repeated Lighthouse runs varied materially, especially for desktop performance (60–99) and mobile LCP (4.1–6.0 seconds), reflecting lab/third-party timing variation. Both after runs improved the baseline. The largest code-level savings came from serving 800px WebP card derivatives instead of full-size photos, loading map libraries only when the map enters view, deferring Google Fonts CSS, preloading the initial hero photo, and adding responsive image candidates. The twelve card derivatives total about 884 KiB. The hero image remains the largest remaining LCP input on mobile.

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

- `npm run test:all`: passed, 3 Vitest unit tests and 21 Playwright browser tests.
- Playwright axe checks: passed with zero axe violations in the five states above.
- `npm run lint`: passed.
- `npm run format:check`: passed for application rules, build/config files, and unit/browser tests.
- `npm run build`: passed. Confirmed the generated `dist/index.html` and `dist/app.js` contain no account-deletion UI or handlers.
- `npm audit`: 0 reported vulnerabilities at dependency installation time.
- `npm run audit:lighthouse:desktop` and `npm run audit:lighthouse:mobile`: each completed twice. Reports are written to the OS temporary directory as `travelmatene-lighthouse-{desktop,mobile}.json`.

RLS policies and live Supabase permissions were not changed or tested against production. Map tile delivery depends on OpenFreeMap and a browser network connection; the app retains its offline map fallback. Lighthouse scores are single-run lab measurements and may vary across machines and provider conditions.
