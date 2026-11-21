import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const pages = {
  explore: {
    file: "index.html",
    title: "RoamNE — Explore North East India",
    description:
      "Explore India's Gateway to Southeast Asia. Discover 12 destinations across North East India by state, season, and travel style.",
  },
  planner: {
    file: "planner.html",
    title: "Trip Planner — RoamNE",
    description:
      "Plan an affordable North East India trip with realistic routes, transfer days, and itemized estimates.",
  },
  guide: {
    file: "guide.html",
    title: "Travel Guide — RoamNE",
    description:
      "Review local transport, permits, connectivity, seasonal conditions, food, and etiquette for North East India.",
  },
  trips: {
    file: "trips.html",
    title: "My Trips — RoamNE",
    description: "Open, save, and print your private RoamNE itineraries.",
  },
  settings: {
    file: "settings.html",
    title: "Account Settings — RoamNE",
    description: "Manage your RoamNE account and saved travel data.",
  },
};

function readLocalConfig() {
  const configPath = path.join(root, "supabase-config.js");
  if (!existsSync(configPath)) return null;
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(configPath, "utf8"), sandbox, {
    timeout: 1000,
  });
  return sandbox.window.TRAVELMATENE_SUPABASE || null;
}

function makeBrowserConfig(url, publishableKey) {
  if (!url && !publishableKey) {
    if (process.env.VERCEL)
      throw new Error(
        "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project environment.",
      );
    return null;
  }
  if (!url || !publishableKey)
    throw new Error("Both Supabase URL and publishable key are required.");

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:")
    throw new Error("SUPABASE_URL must use HTTPS.");
  if (!publishableKey.startsWith("sb_publishable_"))
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY must use the Supabase publishable-key format.",
    );
  if (
    publishableKey.includes("service_role") ||
    publishableKey.startsWith("sb_secret_")
  )
    throw new Error(
      "Secret and service-role keys cannot be exposed in a browser.",
    );

  return {
    url: parsedUrl.origin,
    publishableKey,
    tables: {
      destinations: "destinations",
      profiles: "profiles",
      favorites: "favorites",
      itineraries: "itineraries",
    },
    columns: {
      destinations: {
        budget: "daily_budget",
        vibes: "vibes",
        seasons: "seasons",
        latitude: "latitude",
        longitude: "longitude",
        details: "details",
      },
      profiles: { id: "id", username: "username" },
      favorites: { userId: "user_id", destinationId: "destination_id" },
      itineraries: {
        id: "id",
        userId: "user_id",
        title: "title",
        hub: "hub",
        month: "travel_month",
        duration: "duration",
        totalBudget: "total_budget",
        estimatedCost: "estimated_cost",
        plan: "plan",
      },
    },
  };
}

function elementRange(html, tagName, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openingPattern = new RegExp(
    `<${tagName}\\b(?=[^>]*\\bid=["']${escapedId}["'])[^>]*>`,
    "i",
  );
  const opening = openingPattern.exec(html);
  if (!opening) return null;
  const tokenPattern = new RegExp(`</?${tagName}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = opening.index + opening[0].length;
  let depth = 1;
  for (let token; (token = tokenPattern.exec(html));) {
    if (token[0].startsWith("</")) depth -= 1;
    else if (!token[0].endsWith("/>")) depth += 1;
    if (depth === 0)
      return { start: opening.index, end: tokenPattern.lastIndex };
  }
  throw new Error(`Could not safely close the ${id} element in release HTML.`);
}

function removeElement(html, tagName, id) {
  const range = elementRange(html, tagName, id);
  return range ? html.slice(0, range.start) + html.slice(range.end) : html;
}

function makeReleaseHtml(html) {
  html = removeElement(html, "section", "account-settings");
  html = removeElement(html, "div", "delete-account-modal");
  if (/delete-account|account-delete|account-settings/.test(html))
    throw new Error("Account-deletion UI remains in a production page.");
  return html;
}

function makeReleaseApp(app) {
  app = app.replace(/^let deleteAccountRequestInProgress = false;\n/m, "");
  const deletionStart = app.indexOf("function openDeleteAccount()");
  if (deletionStart >= 0) {
    const deletionEnd = app.indexOf("function setTripsMessage", deletionStart);
    if (deletionEnd < 0)
      throw new Error(
        "Could not safely remove local account-deletion handlers from the release app.",
      );
    app = app.slice(0, deletionStart) + app.slice(deletionEnd);
  }
  app = app.replace(
    /\/\/ EXPERIMENTAL_ACCOUNT_DELETION_START[\s\S]*?\/\/ EXPERIMENTAL_ACCOUNT_DELETION_END\s*/g,
    "",
  );
  if (
    /delete-account|account-settings|openDeleteAccount|closeDeleteAccount|deleteMyAccount|deleteAccountRequestInProgress/.test(
      app,
    )
  )
    throw new Error("Account-deletion code remains in the production app.");
  return app;
}

async function buildPage({
  key,
  release,
  layout,
  head,
  header,
  footer,
  credits,
  map,
  dialogs,
  notice,
}) {
  const page = pages[key];
  const pageContent = await readFile(
    path.join(root, "site/pages", `${key}.html`),
    "utf8",
  ).then((content) => content.replace("{{MAP}}", map));
  const pageUrl = `https://roamne.vercel.app/${key === "explore" ? "" : page.file}`;
  let pageHead = head
    .replaceAll("{{TITLE}}", page.title)
    .replaceAll("{{DESCRIPTION}}", page.description)
    .replaceAll("{{URL}}", pageUrl);
  if (key !== "explore")
    pageHead = pageHead.replace(
      /\s*<link\s+rel="preload"\s+as="image"[\s\S]*?\/>/i,
      "",
    );
  let pageHeader = header.replace(/<a\b[^>]*>/g, (anchor) => {
    const tab = anchor.match(
      /\bdata-tab="(explore|planner|guide|trips|settings)"/,
    )?.[1];
    if (tab !== key) return anchor;
    return anchor
      .replace(
        /class="([^"]*)"/,
        (_match, classes) => `class="${classes} active"`,
      )
      .replace(/>$/, ' aria-current="page">');
  });
  let html = layout
    .replace("{{HEAD}}", pageHead)
    .replace("{{PAGE}}", key)
    .replace("{{HEADER}}", pageHeader)
    .replace("{{CONTENT}}", pageContent)
    .replace("{{FOOTER}}", footer)
    .replace("{{CREDITS}}", credits)
    .replace("{{DIALOGS}}", dialogs)
    .replace("{{NOTICE}}", notice);
  if (release) html = makeReleaseHtml(html);
  return html;
}

async function main() {
  const local = process.env.VERCEL ? null : readLocalConfig();
  const config = makeBrowserConfig(
    process.env.SUPABASE_URL || local?.url,
    process.env.SUPABASE_PUBLISHABLE_KEY || local?.publishableKey,
  );
  const pageKeys = Object.keys(pages);
  const layout = await readFile(path.join(root, "site/layout.html"), "utf8");
  const head = await readFile(path.join(root, "site/head.html"), "utf8");
  const partial = async (name) =>
    readFile(path.join(root, "site/partials", name), "utf8");
  const [header, footer, credits, map, dialogs, notice] = await Promise.all([
    partial("header.html"),
    partial("footer.html"),
    partial("credits.html"),
    partial("map.html"),
    partial("dialogs.html"),
    partial("notice.html"),
  ]);

  const cssFiles = [
    "styles/tokens.css",
    "styles/components.css",
    "styles/pages.css",
    "styles/accessibility.css",
    "styles/themes.css",
  ];
  const releaseCss = (
    await Promise.all(
      cssFiles.map((file) => readFile(path.join(root, file), "utf8")),
    )
  ).join("\n");
  const experimentalAccountCss = path.join(
    root,
    "site/experimental/account-deletion.css",
  );
  const localCss = existsSync(experimentalAccountCss)
    ? `${releaseCss}\n${await readFile(experimentalAccountCss, "utf8")}`
    : releaseCss;
  const appSource = await readFile(path.join(root, "app.js"), "utf8");
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await mkdir(path.join(output, "modules"), { recursive: true });
  await mkdir(path.join(output, "styles"), { recursive: true });
  await cp(path.join(root, "assets"), path.join(output, "assets"), {
    recursive: true,
  });
  await cp(path.join(root, "favicon.svg"), path.join(output, "favicon.svg"));
  await cp(path.join(root, "modules"), path.join(output, "modules"), {
    recursive: true,
  });
  await cp(
    path.join(root, "planner-rules.mjs"),
    path.join(output, "planner-rules.mjs"),
  );
  for (const key of pageKeys) {
    const html = await buildPage({
      key,
      config,
      release: true,
      layout,
      head,
      header,
      footer,
      credits,
      map,
      dialogs,
      notice,
    });
    await writeFile(path.join(output, pages[key].file), html);
    const localHtml = await buildPage({
      key,
      config,
      release: false,
      layout,
      head,
      header,
      footer,
      credits,
      map,
      dialogs,
      notice,
    });
    await writeFile(path.join(root, pages[key].file), localHtml);
    if (key === "explore")
      await writeFile(path.join(root, "index.html"), localHtml);
  }
  await writeFile(path.join(output, "app.js"), makeReleaseApp(appSource));
  await writeFile(path.join(root, "styles.css"), localCss);
  await writeFile(path.join(output, "styles.css"), releaseCss);
  await writeFile(
    path.join(output, "supabase-config.js"),
    `window.TRAVELMATENE_SUPABASE = ${JSON.stringify(config, null, 2)};\n`,
  );
  console.log(
    `Built ${pageKeys.length} RoamNE pages in dist/ with publishable-key-only Supabase config and account deletion disabled.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
