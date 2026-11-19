// main.ts — entry program for the gta6-cover-art-01 bounty (VICE KEY).
// Copies app/ and screenshots/ into the output directory and writes
// /output/dossier.json via the kit's unchanged vendor/makefun-app.ts.
// Run: node main.ts (output dir: $MAKEFUN_OUTPUT_DIR or /output).

import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(src: string, dest: string): void {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const appSrc = join(repoRoot, 'app');
if (!existsSync(appSrc)) throw new Error(`main.ts: no app/ directory beside main.ts (${appSrc})`);
copyTree(appSrc, join(outDir, 'app'));

const shotsSrc = join(repoRoot, 'screenshots');
if (existsSync(shotsSrc)) copyTree(shotsSrc, join(outDir, 'screenshots'));

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const dossierBytes = statSync(join(outDir, 'dossier.json')).size;
console.log(`VICE KEY dossier written: ${join(outDir, 'dossier.json')} (${dossierBytes} bytes)`);
