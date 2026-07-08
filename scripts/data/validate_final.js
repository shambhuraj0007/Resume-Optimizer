const fs = require('fs');
const path = require('path');

console.log('=== Final Validation of ALL Batch Files ===\n');

const files = ['batch1.json', 'batch2.json', 'batch3.json', 'batch4.json', 'batch5.json'];
let totalItems = 0;
let allValid = true;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const count = Array.isArray(data) ? data.length : 1;
    totalItems += count;
    
    // Verify each item has required fields
    let issues = [];
    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        if (!item.slug) issues.push(`Item ${idx}: missing slug`);
        if (!item.jobTitle) issues.push(`Item ${idx}: missing jobTitle`);
        if (!item.schemaVersion) issues.push(`Item ${idx}: missing schemaVersion`);
      });
    }
    
    if (issues.length > 0) {
      console.log(`${file}: VALID JSON (${count} items) but has issues:`);
      issues.forEach(i => console.log(`  - ${i}`));
    } else {
      console.log(`✓ ${file}: VALID (${count} items)`);
    }
  } catch (e) {
    allValid = false;
    console.log(`✗ ${file}: INVALID - ${e.message}`);
  }
}

console.log(`\nTotal: ${totalItems} job role templates across ${files.length} files`);
console.log(allValid ? '\n✓ All files are valid JSON!' : '\n✗ Some files still have issues.');
