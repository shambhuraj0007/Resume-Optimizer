const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'batch4.json');
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Fix all split lines first by looking for lines where a value string
// continues on the next line (the key insight: if a line opens a "quickAnswer" 
// or "description" value and doesn't close it properly, the next line is a continuation)

// More direct approach: Find the specific pattern of a number split across lines
// e.g. "2,\r\n        500+" should become "2,500+"
// In general: find cases where a line ends with content inside a string
// and the next line continues it

// Let's use regex to find and fix the split: a comma followed by newline+spaces+digit
// when it's clearly inside a string value
content = content.replace(/(\d),\r?\n\s+(\d)/g, '$1,$2');

// Step 2: Merge concatenated arrays
content = content.replace(/\]\s*\[/g, ',');

// Step 3: Fix unescaped quotes
content = fixUnescapedQuotes(content);

// Validate
try {
  const parsed = JSON.parse(content);
  console.log(`batch4.json: FIXED! (${parsed.length} items)`);
  fs.writeFileSync(filePath, content, 'utf8');
} catch (e) {
  console.log(`batch4.json: STILL INVALID - ${e.message}`);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.log(`Context: ${JSON.stringify(content.substring(Math.max(0, pos - 80), pos + 80))}`);
  }
}

function fixUnescapedQuotes(content) {
  let result = '';
  let idx = 0;
  
  while (idx < content.length) {
    const ch = content[idx];
    
    if (ch === '"') {
      result += '"';
      idx++;
      
      while (idx < content.length) {
        if (content[idx] === '\\') {
          if (idx + 1 < content.length) {
            result += content[idx] + content[idx + 1];
            idx += 2;
          } else {
            result += content[idx];
            idx++;
          }
          continue;
        }
        
        if (content[idx] === '"') {
          let lookAhead = idx + 1;
          while (lookAhead < content.length && /[\r\n\t ]/.test(content[lookAhead])) {
            lookAhead++;
          }
          
          const nextChar = content[lookAhead];
          
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' ||
              nextChar === ':' || nextChar === undefined) {
            result += '"';
            idx++;
            break;
          } else {
            result += '\\"';
            idx++;
            continue;
          }
        }
        
        result += content[idx];
        idx++;
      }
    } else {
      result += ch;
      idx++;
    }
  }
  
  return result;
}
