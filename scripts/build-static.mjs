import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

function readLocalConfig() {
  const configPath = path.join(root, 'supabase-config.js');
  if (!existsSync(configPath)) return null;
  const sandbox = { window: {} };
  const source = readFileSync(configPath, 'utf8');
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  return sandbox.window.TRAVELMATENE_SUPABASE || null;
}


function makeBrowserConfig(url, publishableKey) {
  if (!url || !publishableKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the Vercel project environment.');
  }
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch { throw new Error('SUPABASE_URL must be a valid HTTPS URL.'); }
  if (parsedUrl.protocol !== 'https:') throw new Error('SUPABASE_URL must use HTTPS.');
  if (!publishableKey.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key (sb_publishable_...).');
  }
  if (publishableKey.includes('service_role') || publishableKey.startsWith('sb_secret_')) {
    throw new Error('Secret and service-role keys are not allowed in the browser config.');
  }
  return {
    url: parsedUrl.origin,
    publishableKey,
    tables: { destinations: 'destinations', profiles: 'profiles', favorites: 'favorites', itineraries: 'itineraries' },
    columns: {
      destinations: { budget: 'daily_budget', vibes: 'vibes', seasons: 'seasons', latitude: 'latitude', longitude: 'longitude', details: 'details' },
      profiles: { id: 'id', username: 'username' },
      favorites: { userId: 'user_id', destinationId: 'destination_id' },
      itineraries: { id: 'id', userId: 'user_id', title: 'title', hub: 'hub', month: 'travel_month', duration: 'duration', totalBudget: 'total_budget', estimatedCost: 'estimated_cost', plan: 'plan' }
    }
  };
}

async function main() {
  const local = process.env.VERCEL ? null : readLocalConfig();
  const config = makeBrowserConfig(
    process.env.SUPABASE_URL || local?.url,
    process.env.SUPABASE_PUBLISHABLE_KEY || local?.publishableKey
  );

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of ['index.html', 'styles.css', 'app.js', 'supabase-config.example.js']) {
    await cp(path.join(root, file), path.join(output, file));
  }
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
  await writeFile(path.join(output, 'supabase-config.js'), `window.TRAVELMATENE_SUPABASE = ${JSON.stringify(config, null, 2)};\n`);
  console.log('Built static TravelMateNE site in dist/ with publishable-key-only Supabase config.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
