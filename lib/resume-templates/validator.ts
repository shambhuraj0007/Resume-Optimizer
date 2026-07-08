// lib/resume-templates/validator.ts
// Schema v1 — Batch Validator

import type { ResumeTemplate, BatchResult, ValidationResult } from "./types";

const DEMAND_LEVELS = ["Very High", "High", "Medium", "Low"];

export function validateBatch(rawJson: string): BatchResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawJson);
    } catch {
        return {
            validRoles: [],
            invalidRoles: [{ slug: "BATCH_ERROR", errors: ["Invalid JSON syntax"] }],
        };
    }

    if (!Array.isArray(parsed)) {
        return {
            validRoles: [],
            invalidRoles: [
                { slug: "BATCH_ERROR", errors: ["Top-level JSON must be an array"] },
            ],
        };
    }

    const validRoles: { slug: string; data: ResumeTemplate }[] = [];
    const invalidRoles: ValidationResult[] = [];

    for (const item of parsed) {
        const errors: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = item as any;

        // Basic Object Check
        if (typeof obj !== "object" || obj === null) {
            invalidRoles.push({ slug: "unknown", errors: ["Item is not an object"] });
            continue;
        }

        const slug = typeof obj.slug === "string" ? obj.slug : "unknown";

        // --- 1. Required String Fields ---
        const requiredStringFields = [
            "slug",
            "jobTitle",
            "industry",
            "metaTitle",
            "metaDescription",
            "quickAnswer",
            "averageSalary",
            "salaryRange",
            "salaryGrowth",
            "jobGrowth",
            "demandLevel",
            "authorName",
            "authorTitle",
            "sourceNotes",
            "schemaVersion",
        ];

        for (const field of requiredStringFields) {
            if (typeof obj[field] !== "string" || !obj[field].trim()) {
                errors.push(`Field "${field}" must be a non-empty string`);
            }
        }

        // --- 2. Array Fields & Sizes ---
        const checkArray = (field: string, min: number, max: number): boolean => {
            if (!Array.isArray(obj[field])) {
                errors.push(`Field "${field}" must be an array`);
                return false;
            }
            if (obj[field].length < min || obj[field].length > max) {
                errors.push(
                    `Field "${field}" must have between ${min} and ${max} items (got ${obj[field].length})`
                );
                return false;
            }
            return true;
        };

        // Simple String Arrays
        if (checkArray("jobTitleVariants", 3, 6)) {
            if (
                !obj.jobTitleVariants.every(
                    (s: unknown) => typeof s === "string" && (s as string).trim()
                )
            )
                errors.push("jobTitleVariants items must be non-empty strings");
        }
        if (checkArray("topSkills", 10, 16)) {
            if (
                !obj.topSkills.every(
                    (s: unknown) => typeof s === "string" && (s as string).trim()
                )
            )
                errors.push("topSkills items must be non-empty strings");
        }
        if (checkArray("commonResponsibilities", 4, 8)) {
            if (
                !obj.commonResponsibilities.every(
                    (s: unknown) => typeof s === "string" && (s as string).trim()
                )
            )
                errors.push("commonResponsibilities items must be non-empty strings");
        }
        if (checkArray("topCompanies", 6, 10)) {
            if (
                !obj.topCompanies.every(
                    (s: unknown) => typeof s === "string" && (s as string).trim()
                )
            )
                errors.push("topCompanies items must be non-empty strings");
        }
        if (checkArray("relatedRoles", 4, 8)) {
            if (
                !obj.relatedRoles.every(
                    (s: unknown) => typeof s === "string" && (s as string).trim()
                )
            )
                errors.push("relatedRoles items must be non-empty strings");
        }

        // Complex Object Arrays (ResumeTips & FAQs) - DEEP CHECK
        if (checkArray("resumeTips", 5, 7)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invalidTips = obj.resumeTips.some(
                (t: any) =>
                    typeof t.title !== "string" ||
                    !t.title.trim() ||
                    typeof t.description !== "string" ||
                    !t.description.trim()
            );
            if (invalidTips)
                errors.push(
                    "One or more resumeTips are missing 'title' or 'description' strings"
                );
        }

        if (checkArray("faqs", 4, 6)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invalidFaqs = obj.faqs.some(
                (f: any) =>
                    typeof f.question !== "string" ||
                    !f.question.trim() ||
                    typeof f.answer !== "string" ||
                    !f.answer.trim()
            );
            if (invalidFaqs)
                errors.push(
                    "One or more faqs are missing 'question' or 'answer' strings"
                );
        }

        // --- 3. Value Constraints ---
        if (
            typeof obj.averageSalary === "string" &&
            !obj.averageSalary.includes("-")
        ) {
            errors.push('averageSalary must be a range containing "-"');
        }
        if (
            typeof obj.salaryRange === "string" &&
            !obj.salaryRange.includes("-")
        ) {
            errors.push('salaryRange must be a range containing "-"');
        }
        if (obj.schemaVersion !== "v1") {
            errors.push(`schemaVersion must be "v1", got "${obj.schemaVersion}"`);
        }
        if (obj.demandLevel && !DEMAND_LEVELS.includes(obj.demandLevel)) {
            errors.push(
                `demandLevel must be one of [${DEMAND_LEVELS.join(", ")}], got "${obj.demandLevel}"`
            );
        }

        // --- 4. Quality Checks Consistency ---
        if (!obj.qualityChecks || typeof obj.qualityChecks !== "object") {
            errors.push("qualityChecks must be a non-null object");
        } else {
            const qc = obj.qualityChecks;
            if (!Array.isArray(qc.bannedPhrasesFound))
                errors.push("qualityChecks.bannedPhrasesFound must be an array");
            if (typeof qc.exampleToolsMentioned !== "number")
                errors.push(
                    "qualityChecks.exampleToolsMentioned must be a number"
                );
            if (typeof qc.exampleMetricsCount !== "number")
                errors.push("qualityChecks.exampleMetricsCount must be a number");
            if (typeof qc.uniquenessScore !== "number")
                errors.push("qualityChecks.uniquenessScore must be a number");
        }

        // --- Final Verdict ---
        if (errors.length === 0 && slug !== "unknown") {
            validRoles.push({ slug, data: obj as ResumeTemplate });
        } else {
            invalidRoles.push({ slug, errors });
        }
    }

    return { validRoles, invalidRoles };
}
