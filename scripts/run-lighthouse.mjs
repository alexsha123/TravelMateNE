import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const device = process.argv[2];
if (!["desktop", "mobile"].includes(device)) {
  throw new Error("Usage: node scripts/run-lighthouse.mjs <desktop|mobile>");
}

const reportPath = path.join(
  os.tmpdir(),
  `travelmatene-lighthouse-${device}.json`,
);
const args = [
  "http://127.0.0.1:4181/index.html",
  "--chrome-path",
  chromium.executablePath(),
  "--output=json",
  `--output-path=${reportPath}`,
  "--only-categories=performance,accessibility,best-practices,seo",
];
if (device === "desktop") args.push("--preset=desktop");

const result = spawnSync("npx", ["lighthouse", ...args], { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status ?? 1;
else console.log(`Lighthouse ${device} report: ${reportPath}`);
