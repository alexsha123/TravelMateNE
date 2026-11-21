import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const device = process.argv[2];
if (!["desktop", "mobile"].includes(device)) {
  throw new Error("Usage: node scripts/run-lighthouse.mjs <desktop|mobile>");
}

const reportPath = process.env.LIGHTHOUSE_REPORT_PATH
  ? path.resolve(process.env.LIGHTHOUSE_REPORT_PATH)
  : path.join(os.tmpdir(), `roamne-lighthouse-${device}.json`);
const args = [
  process.env.LIGHTHOUSE_URL || "http://127.0.0.1:4181/index.html",
  "--chrome-path",
  chromium.executablePath(),
  "--output=json",
  `--output-path=${reportPath}`,
  "--only-categories=performance,accessibility,best-practices,seo",
];
if (device === "desktop") args.push("--preset=desktop");
if (process.env.LIGHTHOUSE_THROTTLING_METHOD)
  args.push(`--throttling-method=${process.env.LIGHTHOUSE_THROTTLING_METHOD}`);
if (process.env.LIGHTHOUSE_SAVE_ASSETS === "1") args.push("--save-assets");

const result = spawnSync("npx", ["lighthouse", ...args], { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status ?? 1;
else console.log(`Lighthouse ${device} report: ${reportPath}`);
