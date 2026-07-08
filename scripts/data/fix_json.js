const fs = require('fs');
const path = require('path');

const files = ['batch3.json', 'batch4.json', 'batch5.json'];

/**
 * Fix JSON files that have two problems:
 * 1. Multiple JSON arrays concatenated (]\n[) instead of one array
 * 2. Unescaped double quotes inside string values
 */
function fixJsonFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Step 1: Merge concatenated arrays
  // Replace ]\n[ (with optional whitespace/newlines) with a comma
  // This turns: ...}]\n[\n{... into: ...},\n{...
  content = content.replace(/\]\s*\[/g, ',');
  
  // Step 2: Fix unescaped quotes using the char-by-char parser
  content = fixUnescapedQuotes(content);
  
  // Validate
  try {
    const parsed = JSON.parse(content);
    console.log(`${path.basename(filePath)}: FIXED! (${parsed.length} items)`);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (e) {
    console.log(`${path.basename(filePath)}: STILL INVALID - ${e.message}`);
    // Save attempt for debugging
    fs.writeFileSync(filePath + '.attempt', content, 'utf8');
    
    // Show context around the error
    const match = e.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      console.log(`Context around error:`);
      console.log(JSON.stringify(content.substring(Math.max(0, pos - 50), pos + 50)));
    }
  }
}

/**
 * Fix unescaped quotes inside JSON string values using a character-by-character parser.
 * 
 * When we're inside a JSON string and encounter a ", we look ahead:
 * - If followed by a JSON structural character (, } ] :) it's the real end of the string
 * - Otherwise, it's an unescaped quote that needs to be escaped
 */
function fixUnescapedQuotes(content) {
  let result = '';
  let i = 0;
  
  while (i < content.length) {
    const ch = content[i];
    
    if (ch === '"') {
      // Start of a JSON string
      result += '"';
      i++;
      
      // Process string content
      while (i < content.length) {
        if (content[i] === '\\') {
          // Escaped character - keep both chars
          if (i + 1 < content.length) {
            result += content[i] + content[i + 1];
            i += 2;
          } else {
            result += content[i];
            i++;
          }
          continue;
        }
        
        if (content[i] === '"') {
          // Check if this is the real end of the string
          let lookAhead = i + 1;
          while (lookAhead < content.length && /[\r\n\t ]/.test(content[lookAhead])) {
            lookAhead++;
          }
          
          const nextChar = content[lookAhead];
          
          // These characters indicate this quote ends the string
          if (nextChar === ',' || nextChar === '}' || nextChar === ']' || 
              nextChar === ':' || nextChar === undefined) {
            result += '"';
            i++;
            break;
          } else {
            // This is an unescaped quote inside the string - escape it
            result += '\\"';
            i++;
            continue;
          }
        }
        
        result += content[i];
        i++;
      }
    } else {
      result += ch;
      i++;
    }
  }
  
  return result;
}

// Process files
for (const file of files) {
  const filePath = path.join(__dirname, file);
  console.log(`\nProcessing ${file}...`);
  fixJsonFile(filePath);
}

// Final validation of ALL batch files
console.log('\n=== Final Validation (all batch files) ===');
for (const file of ['batch1.json', 'batch2.json', 'batch3.json', 'batch4.json', 'batch5.json']) {
  const filePath = path.join(__dirname, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`${file}: VALID (${Array.isArray(data) ? data.length + ' items' : 'object'})`);
  } catch (e) {
    console.log(`${file}: INVALID - ${e.message}`);
  }
}
