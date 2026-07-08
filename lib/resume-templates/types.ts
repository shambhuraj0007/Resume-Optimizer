// lib/resume-templates/types.ts
// Schema v1 — Shared types for resume template batch validation

export type ResumeTip = { title: string; description: string };
export type FAQ = { question: string; answer: string };

export type QualityChecks = {
    bannedPhrasesFound: string[];
    exampleToolsMentioned: number;
    exampleMetricsCount: number;
    uniquenessScore: number;
};

export type ResumeTemplate = {
    slug: string;
    jobTitle: string;
    jobTitleVariants: string[];
    industry: string;
    metaTitle: string;
    metaDescription: string;
    quickAnswer: string;
    topSkills: string[];
    resumeTips: ResumeTip[];
    commonResponsibilities: string[];
    averageSalary: string; // Must contain "-"
    salaryRange: string;   // Must contain "-"
    salaryGrowth: string;
    jobGrowth: string;
    demandLevel: "Very High" | "High" | "Medium" | "Low";
    topCompanies: string[];
    faqs: FAQ[];
    relatedRoles: string[];
    authorName: string;
    authorTitle: string;
    sourceNotes: string;
    schemaVersion: "v1";
    qualityChecks: QualityChecks;
};

export type ValidationResult = {
    slug: string;
    errors: string[];
};

export type BatchResult = {
    validRoles: { slug: string; data: ResumeTemplate }[];
    invalidRoles: ValidationResult[];
};
