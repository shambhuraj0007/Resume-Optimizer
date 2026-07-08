import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IResumeTip {
    title: string;
    description: string;
}

export interface IFaq {
    question: string;
    answer: string;
}

export interface IQualityChecks {
    bannedPhrasesFound: string[];
    exampleToolsMentioned: number;
    exampleMetricsCount: number;
    uniquenessScore: number;
}

export interface IJobRole extends Document {
    slug: string;                 // "software-engineer"
    jobTitle: string;             // "Software Engineer"
    jobTitleVariants: string[];
    industry?: string;

    metaTitle?: string;
    metaDescription?: string;
    quickAnswer: string;          // 100–200 words

    topSkills: string[];
    resumeTips: IResumeTip[];
    commonResponsibilities: string[];

    averageSalary?: string;       // "$90K-$280K"
    salaryRange?: string;         // "$90K-$280K"
    salaryGrowth?: string;        // "Up 8% from 2025"
    jobGrowth?: string;           // "+13% YoY"
    demandLevel?: string;         // "Very High" | "High" | "Medium" | "Low"
    topCompanies?: string[];

    faqs: IFaq[];

    relatedRoles: string[];       // ["frontend-developer", ...]

    sampleImageUrl?: string;

    // Author & source info
    authorName?: string;
    authorTitle?: string;
    sourceNotes?: string;

    // Schema v1 additions
    schemaVersion?: string;       // "v1"
    qualityChecks?: IQualityChecks;

    createdAt: Date;
    updatedAt: Date;
}

const JobRoleSchema = new Schema<IJobRole>(
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

        // Author & source info with defaults
        authorName: { type: String, default: 'ShortlistAI Editorial' },
        authorTitle: { type: String, default: 'Resume Optimization Team' },
        sourceNotes: { type: String, default: 'Salary and job market data based on typical ranges from Glassdoor, LinkedIn, and BLS.' },

        // Schema v1 additions
        schemaVersion: { type: String, default: undefined },
        qualityChecks: {
            type: {
                bannedPhrasesFound: [{ type: String }],
                exampleToolsMentioned: { type: Number },
                exampleMetricsCount: { type: Number },
                uniquenessScore: { type: Number },
            },
            default: undefined,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure model isn't recompiled in dev mode
const JobRole = (models.JobRole as mongoose.Model<IJobRole>) ||
    model<IJobRole>('JobRole', JobRoleSchema);

export default JobRole;
