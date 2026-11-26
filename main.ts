// Writes the site into app/ by copying every file from src/. Idempotent: running it twice gives identical output.
import { mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'app');

mkdirSync(out, { recursive: true });
for (const file of readdirSync(src).sort()) {
  copyFileSync(join(src, file), join(out, file));
  console.log(`wrote app/${file}`);
}
