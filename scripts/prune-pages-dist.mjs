import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distTilesDir = path.join(repoRoot, 'dist', 'tiles');

async function main() {
  let entries = [];

  try {
    entries = await fs.readdir(distTilesDir, { withFileTypes: true });
  } catch {
    return;
  }

  const deletions = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.pmtiles'))
    .map((entry) => fs.rm(path.join(distTilesDir, entry.name), { force: true }));

  await Promise.all(deletions);

  const remaining = await fs.readdir(distTilesDir).catch(() => []);
  if (remaining.length === 0) {
    await fs.rm(distTilesDir, { recursive: true, force: true });
  }

  console.log('[pages:prepare] Removed local .pmtiles assets from dist/tiles for Cloudflare Pages deployment.');
}

await main();