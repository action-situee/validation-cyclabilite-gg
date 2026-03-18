const fs = require('fs');
const src = fs.readFileSync('src/app/components/Map.tsx', 'utf8');
const lines = src.split('\n');
let depth = 0;
let inMapInner = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('function MapInner')) { inMapInner = true; depth = 0; }
  if (inMapInner === false) continue;
  for (const ch of line) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  if (depth <= 0 && inMapInner && i > 780) {
    console.log('MapInner closes at line', i+1, 'depth=', depth);
    inMapInner = false;
    break;
  }
}
