// Fix batch1.json: merge separate arrays and escape embedded quotes
const fs = require('fs');

let raw = fs.readFileSync('scripts/data/batch1.json', 'utf8');

// Step 1: Merge all arrays: ][ or ]\n[ -> ,
raw = raw.replace(/\]\s*\[/g, ',');

// Step 2: Fix unescaped quotes inside JSON string values
// Use a character-by-character state machine
let result = [];
let inString = false;
let escaped = false;

for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];

  if (escaped) {
    result.push(ch);
    escaped = false;
    continue;
  }

  if (ch === '\\' && inString) {
    result.push(ch);
    escaped = true;
    continue;
  }

  if (!inString && ch === '"') {
    inString = true;
    result.push(ch);
    continue;
  }

  if (inString && ch === '"') {
    // Is this the end of the JSON string, or an embedded unescaped quote?
    // Look ahead past whitespace: if next meaningful char is structural, it's the real end
    let j = i + 1;
    while (j < raw.length && (raw[j] === ' ' || raw[j] === '\t')) j++;
    const next = raw[j];
    if (
      next === ':' ||
      next === ',' ||
      next === '}' ||
      next === ']' ||
      next === '\r' ||
      next === '\n' ||
      j >= raw.length
    ) {
      // Real end of string
      inString = false;
      result.push(ch);
    } else {
      // Embedded unescaped quote — escape it
      result.push('\\"');
    }
    continue;
  }

  result.push(ch);
}

const fixed = result.join('');

try {
  const parsed = JSON.parse(fixed);
  console.log('✅ Fixed JSON is valid!');
  console.log('Total roles:', parsed.length);
  parsed.forEach((r, i) => console.log(`  ${i + 1}. ${r.slug}`));
  fs.writeFileSync('scripts/data/batch1.json', JSON.stringify(parsed, null, 2), 'utf8');
  console.log('\nFile saved (pretty-printed)');
} catch (e) {
  console.log('❌ Still invalid:', e.message);
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  console.log('Context around error:');
  console.log(fixed.substring(Math.max(0, pos - 80), pos + 80));
  console.log(' '.repeat(Math.min(80, pos)) + '^');
}
