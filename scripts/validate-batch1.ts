// Run the batch validator against batch1.json
// Usage: npx tsx scripts/validate-batch1.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { validateBatch } from '../lib/resume-templates/validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const batchPath = path.join(__dirname, 'data', 'batch1.json');
const rawJson = fs.readFileSync(batchPath, 'utf-8');

console.log('🔍 Running Schema v1 Validator on batch1.json...\n');

const { validRoles, invalidRoles } = validateBatch(rawJson);

console.log('━'.repeat(60));
console.log(`📊 SUMMARY`);
console.log('━'.repeat(60));
console.log(`  Total received : ${validRoles.length + invalidRoles.length}`);
console.log(`  ✅ Valid        : ${validRoles.length}`);
console.log(`  ❌ Invalid      : ${invalidRoles.length}`);
console.log('━'.repeat(60));

if (validRoles.length > 0) {
    console.log('\n✅ Valid Roles:');
    validRoles.forEach((r) => console.log(`   • ${r.slug}`));
}

if (invalidRoles.length > 0) {
    console.log('\n❌ Invalid Roles:');
    invalidRoles.forEach((r) => {
        console.log(`\n   🔴 ${r.slug}`);
        r.errors.forEach((e) => console.log(`      → ${e}`));
    });
}

console.log('\n✅ Validation complete.');
