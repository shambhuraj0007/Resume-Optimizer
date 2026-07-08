/**
 * Seed script for Job Roles (Schema v1)
 * 
 * Usage: npx tsx scripts/seed-job-roles.ts
 * 
 * This script validates and upserts job roles from scripts/data/batch1.json 
 * into the MongoDB database using the production validator.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import validator and model
import { validateBatch } from '../lib/resume-templates/validator';
import JobRole from '../models/JobRole';

// List all files to process by default
const BATCH_FILES = ['batch6.json', 'batch7.json','batch1.json','batch2.json','batch3.json','batch4.json','batch5.json','batch8.json'];

async function seedJobRoles() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ MONGODB_URI is not set in environment variables');
        process.exit(1);
    }

    // 1. Connect to MongoDB
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }

    // 2. Determine which files to seed
    const targetFiles = process.argv[2] ? [process.argv[2]] : BATCH_FILES;

    let totalImported = 0;
    let totalSkipped = 0;

    console.log(`🚀 Starting seed process for ${targetFiles.length} files: ${targetFiles.join(', ')}`);

    for (const fileName of targetFiles) {
        const rolesPath = path.resolve(__dirname, 'data', fileName);

        if (!fs.existsSync(rolesPath)) {
            console.error(`\n❌ Data file not found: ${rolesPath}`);
            continue;
        }

        console.log(`\n📄 Processing ${fileName}...`);

        try {
            const rawJson = fs.readFileSync(rolesPath, 'utf-8');
            const { validRoles, invalidRoles } = validateBatch(rawJson);

            if (invalidRoles.length > 0) {
                console.warn(`   ⚠️  Found ${invalidRoles.length} invalid roles. These will be skipped.`);
                invalidRoles.forEach(r => console.log(`      - ${r.slug}: ${r.errors.join(', ')}`));
                totalSkipped += invalidRoles.length;
            }

            if (validRoles.length === 0) {
                console.log('   ⚠️  No valid roles found to import in this file.');
                continue;
            }

            console.log(`   � Importing ${validRoles.length} roles...`);

            for (const { slug, data } of validRoles) {
                try {
                    await JobRole.findOneAndUpdate(
                        { slug },
                        { $set: data },
                        { upsert: true, new: true, runValidators: true }
                    );
                    // console.log(`      ✅ ${slug}`);
                    totalImported++;
                } catch (error) {
                    console.error(`      ❌ Failed to upsert ${slug}:`, (error as Error).message);
                }
            }
        } catch (error) {
            console.error(`   ❌ Failed to process file ${fileName}:`, (error as Error).message);
        }
    }

    // 3. Cleanup
    console.log(`\n📊 FINAL SEED SUMMARY:`);
    console.log(`   ✅ Total Imported: ${totalImported}`);
    console.log(`   ⚠️ Total Skipped:  ${totalSkipped}`);

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed. Done!');
}

seedJobRoles().catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
});
