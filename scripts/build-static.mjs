import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

function readLocalConfig() {
  const configPath = path.join(root, "supabase-config.js");
  if (!existsSync(configPath)) return null;
  const sandbox = { window: {} };
  const source = readFileSync(configPath, "utf8");
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  return sandbox.window.TRAVELMATENE_SUPABASE || null;
}

function makeBrowserConfig(url, publishableKey) {
  if (!url || !publishableKey) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project environment.",
    );
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:")
    throw new Error("SUPABASE_URL must use HTTPS.");
  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key (sb_publishable_...).",
    );
  }
  if (
    publishableKey.includes("service_role") ||
    publishableKey.startsWith("sb_secret_")
  ) {
    throw new Error(
      "Secret and service-role keys are not allowed in the browser config.",
    );
  }
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

function makeReleaseHtml(html) {
  const accountSettings =
    /\s*<section class="account-settings" id="account-settings"[\s\S]*?<\/section>/;
  if (!accountSettings.test(html))
    throw new Error(
      "Could not locate experimental account settings in index.html.",
    );
  html = html.replace(accountSettings, "");
  const modalStart = html.indexOf(
    '    <div class="modal-backdrop account-delete-backdrop" id="delete-account-modal"',
  );
  const modalEnd = html.indexOf('    <div id="app-notice"', modalStart);
  if (modalStart < 0 || modalEnd < 0)
    throw new Error(
      "Could not locate experimental account deletion modal in index.html.",
    );
  return html.slice(0, modalStart) + html.slice(modalEnd);
}

function makeReleaseStyles(css) {
  const deletionStyles = css.indexOf(".account-settings{");
  const followingStyles = css.indexOf(
    ".hero-art{isolation:isolate}",
    deletionStyles,
  );
  if (deletionStyles < 0 || followingStyles < 0)
    throw new Error(
      "Could not locate experimental account deletion styles in styles.css.",
    );
  return css.slice(0, deletionStyles) + css.slice(followingStyles);
}

function makeReleaseApp(app) {
  app = app.replace(/^let deleteAccountRequestInProgress = false;\n/m, "");
  const deletionStart = app.indexOf("function openDeleteAccount()");
  const deletionEnd = app.indexOf("function setTripsMessage", deletionStart);
  if (deletionStart < 0 || deletionEnd < 0)
    throw new Error(
      "Could not locate experimental account deletion handlers in app.js.",
    );
  app = app.slice(0, deletionStart) + app.slice(deletionEnd);
  app = app.replace(/^\s*\$\('#delete-account-open'\)[^\n]*\n/m, "\n");
  app = app.replace("closeAuth();closeDeleteAccount();", "closeAuth();");
  app = app.replace(
    "const settings=$('#account-settings');if(settings){settings.hidden=!authUser;const email=$('#account-email');if(email)email.textContent=authUser?.email||'Signed-in account';}",
    "",
  );
  app = app.replace(
    "if(!$('#delete-account-modal').hidden){closeDeleteAccount();return;}",
    "",
  );
  if (app.includes("delete-account"))
    throw new Error("Account deletion code remains in release app.js.");
  return app;
}

async function main() {
  const local = process.env.VERCEL ? null : readLocalConfig();
  const config = makeBrowserConfig(
    process.env.SUPABASE_URL || local?.url,
    process.env.SUPABASE_PUBLISHABLE_KEY || local?.publishableKey,
  );

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of [
    "index.html",
    "styles.css",
    "app.js",
    "planner-rules.mjs",
    "favicon.svg",
    "supabase-config.example.js",
  ]) {
    await cp(path.join(root, file), path.join(output, file));
  }
  await cp(path.join(root, "assets"), path.join(output, "assets"), {
    recursive: true,
  });
  await writeFile(
    path.join(output, "index.html"),
    makeReleaseHtml(await readFileSync(path.join(root, "index.html"), "utf8")),
  );
  await writeFile(
    path.join(output, "app.js"),
    makeReleaseApp(await readFileSync(path.join(root, "app.js"), "utf8")),
  );
  await writeFile(
    path.join(output, "styles.css"),
    makeReleaseStyles(readFileSync(path.join(root, "styles.css"), "utf8")),
  );
  await writeFile(
    path.join(output, "supabase-config.js"),
    `window.TRAVELMATENE_SUPABASE = ${JSON.stringify(config, null, 2)};\n`,
  );
  console.log(
    "Built static TravelMateNE site in dist/ with publishable-key-only Supabase config.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
