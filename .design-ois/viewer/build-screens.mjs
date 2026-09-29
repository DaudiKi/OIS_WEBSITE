// Convert each .dc.html artboard into a standalone viewable HTML page.
// The artboards are static (no template holes, loops or imports — verified),
// so this is a mechanical unwrap: keep the helmet's font link and styles,
// keep the root markup, drop the design-runtime scaffolding.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2] || '.';
const OUT = process.argv[3] || 'viewer/screens';
mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(readFileSync(join(SRC, 'canvas.json'), 'utf8'));
const byFile = new Map(manifest.artboards.map((a) => [a.file, a]));

const files = readdirSync(SRC).filter((f) => f.endsWith('.dc.html')).sort();
const results = [];

for (const file of files) {
  const raw = readFileSync(join(SRC, file), 'utf8');

  // Pull the font stylesheet link(s) out of the helmet.
  const links = [...raw.matchAll(/<link\s+rel="stylesheet"[^>]*>/g)].map((m) => m[0]);

  // Pull the helmet's <style> block.
  const styleMatch = raw.match(/<helmet>[\s\S]*?(<style>[\s\S]*?<\/style>)[\s\S]*?<\/helmet>/);
  const style = styleMatch ? styleMatch[1] : '';

  // Everything between </helmet> and </x-dc> is the artboard markup.
  const bodyMatch = raw.match(/<\/helmet>([\s\S]*?)<\/x-dc>/);
  if (!bodyMatch) {
    console.error(`SKIP ${file} — could not locate artboard markup`);
    continue;
  }
  const body = bodyMatch[1].trim();

  const meta = byFile.get(file) || {};
  const stem = file.replace(/\.dc\.html$/, '');
  const title = meta.title || stem;

  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — OrchardsWood</title>
${links.join('\n')}
${style}
</head>
<body>
${body}
</body>
</html>
`;

  writeFileSync(join(OUT, `${stem}.html`), page, 'utf8');
  results.push({
    stem,
    title,
    page: meta.page || 'unsorted',
    w: meta.w || 1280,
    h: meta.h || 900,
    bytes: page.length,
  });
}

writeFileSync(
  join(OUT, '..', 'screens.json'),
  JSON.stringify({ pages: manifest.pages, screens: results }, null, 2),
  'utf8'
);

console.log(`converted ${results.length} screens`);
for (const r of results) console.log(`  ${r.stem.padEnd(16)} ${String(r.w).padStart(5)}x${String(r.h).padStart(5)}  ${r.page}`);
