/**
 * Script to import job roles from JSON file into MongoDB
 * 
 * Usage:
 *   npx tsx scripts/importJobRoles.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Handle __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
}

// Import the JobRole model schema inline to avoid module resolution issues
const JobRoleSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true, index: true },
        jobTitle: { type: String, required: true },
        jobTitleVariants: [{ type: String }],
        industry: String,
        metaTitle: String,
        metaDescription: String,
        quickAnswer: { type: String, required: true },
        topSkills: [{ type: String, required: true }],
        resumeTips: [
            {
                title: { type: String, required: true },
                description: { type: String, required: true },
            },
        ],
        commonResponsibilities: [{ type: String }],
        averageSalary: String,
        salaryRange: String,
        salaryGrowth: String,
        jobGrowth: String,
        demandLevel: String,
        topCompanies: [{ type: String }],
        faqs: [
            {
                question: { type: String, required: true },
                answer: { type: String, required: true },
            },
        ],
        relatedRoles: [{ type: String }],
        sampleImageUrl: String,
    },
    {
        timestamps: true,
    }
);

const JobRole = mongoose.models.JobRole || mongoose.model('JobRole', JobRoleSchema);

async function run() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Load roles from JSON file
    const rolesPath = path.join(__dirname, 'roles.json');

    if (!fs.existsSync(rolesPath)) {
        console.error(`❌ roles.json not found at ${rolesPath}`);
        console.log('📝 Please create a roles.json file with your job role data.');
        process.exit(1);
    }

    const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf-8'));
    console.log(`📄 Found ${rolesData.length} roles to import`);

    let created = 0;
    let updated = 0;

    for (const role of rolesData) {
        const existing = await JobRole.findOne({ slug: role.slug });

        const result = await JobRole.findOneAndUpdate(
            { slug: role.slug },
            role,
            { upsert: true, new: true, runValidators: true }
        );

        if (!existing) {
            created++;
            console.log(`  ✅ Created: ${role.jobTitle}`);
        } else {
            updated++;
            console.log(`  🔄 Updated: ${role.jobTitle}`);
        }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${rolesData.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Done! Disconnected from MongoDB.');
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
