# TravelMateNE — North East Tourism Explorer

A responsive, client-side travel discovery and budget planning app for Northeast India.

## Run it

Serve the folder over HTTP with any static server, then open the local address (for example, `python3 -m http.server 8000`). Local development needs no build step. Google Fonts, the map renderer, and Supabase JS load from the web. All twelve destination photographs are bundled locally as optimized WebP files.

## Connect the existing Supabase project

1. Copy `supabase-config.example.js` to `supabase-config.js`. The real config file is ignored by git.
2. Fill in `url` with the Supabase Project URL and `publishableKey` with a publishable key from the project dashboard. A publishable key is intended for browser use; never put an `sb_secret_` or `service_role` key in this file.
3. Start a local HTTP server from this folder, such as `python3 -m http.server 8000`, and visit `http://localhost:8000`. Do not open the page with `file://`.
4. Add the local URL to Supabase Auth's allowed redirect URLs if email confirmation is enabled (for example, `http://localhost:8000/**`).
5. Review the existing RLS policies, then run `supabase/seed-destinations.sql` in the Supabase SQL Editor. The seed upserts the twelve destination rows and does not change the schema or disable RLS. If the rows are already seeded, run `supabase/update-destination-images.sql` in the SQL Editor to refresh image paths and JSONB image details; it updates existing rows only and performs no schema or policy changes.

The seed matches the provided `public.destinations` schema exactly: unique `name`, `state`, `district`, `description`, `image_url`, `latitude`, `longitude`, `daily_budget`, `vibes` (text array), `seasons` (text array), and `details` (JSONB). The details document the long description, local image path, permit, network, ATM, transport, food, and etiquette fields. The script upserts on the unique destination name and does not change the schema.

Client defaults for user tables are:

- `profiles`: `id`, `username`, `created_at` (the id matches `auth.users.id`; the app writes only id and username).
- `favorites`: `user_id`, `destination_id` (the destination id should reference `destinations.id`).
- `itineraries`: `id`, `user_id`, `title`, `hub`, `travel_month`, `duration`, `total_budget`, `estimated_cost`, `plan` (JSONB snapshot of the complete rule-based plan), and `created_at`.

The app's local config defaults are aligned to these columns. It filters private reads/writes by the signed-in user's id and relies on the database's existing RLS policies as the security boundary. No RLS policy is changed by this application.

Supabase is optional for the explorer: without a local config, or if destination loading fails, the bundled destination dataset remains active. Auth, cloud favorites, and saved trips require a configured project and compatible columns/policies.

## What’s included

- Destination search and filters for all eight states, travel vibes, and seasons.
- Twelve destination profiles with estimated daily spend, transport hubs, hidden-gem tags, locally bundled destination-specific WebP photography, food, last-mile transport, and etiquette notes. Photo credits link to the Wikimedia Commons source and applicable Creative Commons license in the footer.
- A planner with four starting hubs, a 2–10 day duration, travel month, budget, interests, and two instant sample trips.
- Destination-specific route plans with transfer-day estimates, minimum-duration checks, and accommodation, meals, transport, activities, and permit cost splits. Estimates use shared transport/local-stay assumptions and show a warning when a route exceeds the entered total.
- A Leaflet map with a MapLibre-rendered OpenFreeMap basemap, clickable destination markers, and a dotted itinerary sequence guide. The dotted connector shows destination order, not driving directions.
- Permit, connectivity, cash/ATM, and seasonal travel notes, including links to official permit information where available.

Trip planning is rule-based and does not use a live AI model, traffic, bookings, or road-status feed. Travel times, permits, and local prices can change; confirm current details with official authorities and local operators before travel. Leaflet, MapLibre, OpenFreeMap styles, and map tiles require an internet connection. OpenFreeMap provides its public tiles “as is” without an SLA; the map displays a fallback notice if tiles fail while leaving the location pins available.

## Automated tests

Install the development dependencies with `npm install`. Run the JavaScript unit tests with `npm test`; run the browser suite with `npm run test:e2e`. The Playwright suite starts a local HTTP server automatically and needs Chromium installed (`npx playwright install chromium` on a new machine). `npm run test:all` runs both suites.

Coverage includes destination search and filters, navigation and destination details, planner route/cost totals and warnings, both trip presets, slideshow timing/manual controls/reduced motion, mobile layout and accessible controls, authentication error handling, favorites, saved plans, and account isolation. Supabase browser interactions use an in-memory test double with synthetic `example.test` identities and disposable rows; external HTTPS requests are blocked. The security tests check that test double's authenticated-owner behavior and unauthenticated rejection. They do not connect to Supabase/Postgres and are not proof that the deployed RLS policies are configured correctly; run the separate read-only `supabase/audit-rls.sql` against the intended project for policy inspection.

The account-deletion UI and Edge Function are excluded from these suites and remain untested. The production build also strips the account-deletion UI, handlers, and styles from `dist/`; the local source and Edge Function remain available for later testing, but the build does not deploy the function. No real accounts or production data are used by the tests. Playwright artifacts are written under ignored `test-results/` and `playwright-report/` directories.

Latest local verification: `npm run test:all` passed (3 Vitest unit tests and 21 Playwright browser tests). `npm run lint`, `npm run format:check`, and `npm run build` passed. Desktop and mobile Lighthouse plus axe-core results, security scope, before/after measurements, and remaining limitations are documented in [docs/quality-audit.md](docs/quality-audit.md). Live Supabase RLS enforcement, real map tile availability under all networks, and non-Chromium browsers remain outside this automated run.

## Deploy to Vercel

This is still a static HTML/CSS/JavaScript site. `vercel.json` runs a small Node build script that copies the static app into `dist/` and creates the browser config before Vercel publishes it. There are no framework or package dependencies.

1. In Vercel, import the GitHub repository and use the repository root. The checked-in `vercel.json` sets the build command and `dist` output directory.
2. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the Vercel project environment for Production, Preview, and Development as needed. Use the Supabase project URL and an `sb_publishable_...` key only. The build validates the key prefix and refuses secret/service-role keys.
3. Redeploy after changing environment values; they are read at build time and written into the public `supabase-config.js` asset. A Supabase publishable key is designed to be visible in browser code; table access remains governed by the existing RLS policies.
4. In Supabase Auth URL Configuration, set the production Site URL and add the deployed production URL to the Redirect URLs allow-list (for example, `https://your-domain.example/**`). Add specific Vercel preview URLs if OAuth should work on previews. Keep the local development redirect URL if needed.
5. For Google OAuth, keep the Supabase project callback URL shown in Auth → Providers → Google registered in Google Cloud Console; Vercel does not replace that callback.

For local static development, continue using the ignored `supabase-config.js` copied from `supabase-config.example.js`. The production build reads Vercel environment variables instead, so the ignored local file is not required in the GitHub repository.
