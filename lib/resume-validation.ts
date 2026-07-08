
export interface ValidationResult {
    isValid: boolean;
    recommendedAction: 'accept' | 'review' | 'reject';
    score: number;
    reason?: string; // Mapped from rejectionReason for backward compatibility/simplicity
    rejectionReason?: string;
    telemetryId: string;
    checks: ValidationCheckResult[];
}

export interface ValidationCheckResult {
    name: string;
    passed: boolean;
    reason?: string;
}

// ===== HYGIENE CHECKS (New) =====

function checkFileSize(fileSize?: number): ValidationCheckResult {
    if (!fileSize) return { name: 'FILE_SIZE', passed: true };
    const maxSize = 5 * 1024 * 1024;
    return {
        name: 'FILE_SIZE',
        passed: fileSize <= maxSize,
        ...(fileSize > maxSize ? { reason: 'exceeds 5MB' } : {})
    };
}

function checkFileType(fileType?: string): ValidationCheckResult {
    if (!fileType) return { name: 'FILE_TYPE', passed: true };
    // Check for pdf in type string
    const isPdf = fileType.toLowerCase().includes('pdf') || fileType === 'application/pdf';
    return {
        name: 'FILE_TYPE',
        passed: isPdf,
        ...(isPdf ? {} : { reason: 'not pdf' })
    };
}

function checkPasswordProtected(extractionError?: boolean): ValidationCheckResult {
    return {
        name: 'PASSWORD_PROTECTED',
        passed: !extractionError,
        ...(extractionError ? { reason: 'password protected' } : {})
    };
}

function checkScannedOrImage(text: string): ValidationCheckResult {
    // If text is very short but file size is significant (implied), it's likely scanned.
    // We use a threshold of 200 chars for meaningful content.
    const hasText = text.trim().length >= 200;
    return {
        name: 'SCANNED_IMAGE',
        passed: hasText,
        ...(hasText ? {} : { reason: 'scanned or image pdf' })
    };
}

function checkPageLimit(numPages?: number): ValidationCheckResult {
    if (!numPages) return { name: 'PAGE_LIMIT', passed: true };
    return {
        name: 'PAGE_LIMIT',
        passed: numPages <= 5,
        ...(numPages > 5 ? { reason: 'exceeds 5 pages' } : {})
    };
}

// ===== CRITICAL BUSINESS RULE: CONTACT (Moved to RED) =====

function checkPersonalIdentity(text: string): ValidationCheckResult {
    // Check for email OR phone OR generic identity patterns
    const patterns = [
        // Strong email pattern
        /[\w\.-]+@[\w\.-]+\.\w+/i,
        // Phone patterns (International & Indian)
        /(\+91|91)?[6-9]\d{9}/,
        /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/
    ];

    const hasPattern = patterns.some(p => p.test(text));

    // As a fallback, check for common header words near top of file (though regex is better)
    // For now, regex is sufficient for contact details.

    return {
        name: 'PERSONAL_IDENTITY',
        passed: hasPattern,
        ...(hasPattern ? {} : { reason: 'no contact details' })
    };
}

// ===== ORIGINAL CONTENT CHECKS =====

function checkEmploymentHistory(text: string): ValidationCheckResult {
    const patterns = [
        /(?:worked|experience).*?(?:at|in)\s+[a-zA-Z]{2,}/i,
        /\b(?:20|19)\d{2}\s*[-–to]+\s*(?:20|19)\d{2}\b/i,
        /(?:engineer|manager|developer|lead)\s+(?:engineer|manager|lead)/i,
        /experience/i,
        /employment/i,
        /work history/i
    ];

    // If explicitly mentions "Experience" section
    const hasSection = /experience|work history|employment history/i.test(text);
    const matches = patterns.filter(p => p.test(text)).length;

    return {
        name: 'EMPLOYMENT_HISTORY',
        passed: hasSection || matches >= 1,
        ...(hasSection || matches >= 1 ? {} : { reason: 'missing employment history' })
    };
}

function checkEducation(text: string): ValidationCheckResult {
    const patterns = [
        /(?:university|college|institute).*?(?:b\.tech|bs|mba|ms|phd)/i,
        /(?:bachelor|master|phd).*?(?:science|engineering|technology)/i,
        /(?:iit|nit|stanford|mit|harvard)/i,
        /education/i,
        /qualifications/i,
        /academic/i
    ];

    const hasSection = /education|qualifications|academic background/i.test(text);
    const matches = patterns.filter(p => p.test(text)).length;

    return {
        name: 'EDUCATION',
        passed: hasSection || matches >= 1,
        ...(hasSection || matches >= 1 ? {} : { reason: 'missing education' })
    };
}

function checkSkills(text: string): ValidationCheckResult {
    const skillsKeywords = ['python', 'javascript', 'react', 'aws', 'docker', 'sql', 'java', 'html', 'css', 'node', 'manager', 'sales', 'marketing', 'design', 'analysis', 'communication'];
    const hasSection = /skills?|technologies|competencies/i.test(text);
    const lowerText = text.toLowerCase();
    const keywordCount = skillsKeywords.filter(skill => lowerText.includes(skill)).length;

    return {
        name: 'SKILLS',
        passed: hasSection || keywordCount >= 3,
        ...(hasSection || keywordCount >= 3 ? {} : { reason: 'missing skills' })
    };
}

function checkContentSanity(text: string): ValidationCheckResult {
    const blockerPatterns = [
        /etf|stock|investment|financial|mutual fund/i,
        /invoice|receipt|bill|payment/i,
        /google result|search engine|favicon/i
    ];

    // We want to block specific non-resume documents but be careful not to block finance resumes.
    // "ETF" might be in a skill. "Invoice" might be in "Invoice Processing".
    // So we look for document-level signals, or high frequency of these without resume signals.

    // A safer sanity check is: Does it have ANY resume signal?
    const resumeSignals = [
        /resume|curriculum vitae|cv/i,
        /experience|education|skills/i,
        /phone|email|contact/i
    ];

    const hasResumeSignal = resumeSignals.some(p => p.test(text));

    return {
        name: 'CONTENT_SANITY',
        passed: hasResumeSignal,
        ...(hasResumeSignal ? {} : { reason: 'not a resume' })
    };
}

// ===== MAIN VALIDATION FUNCTION =====

export function validateResume(
    text: string,
    numPages?: number,
    filename?: string,
    fileSize?: number,
    fileType?: string,
    extractionError?: boolean
): ValidationResult {

    // Simple ID generation since crypto might not be available
    const telemetryId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Run ALL checks
    const checks = [
        checkFileSize(fileSize),
        checkFileType(fileType),
        checkPasswordProtected(extractionError),
        checkScannedOrImage(text),
        checkPageLimit(numPages),
        checkPersonalIdentity(text),
        checkContentSanity(text),
        checkEmploymentHistory(text),
        checkEducation(text),
        checkSkills(text)
    ];

    const failedChecks = checks.filter(c => !c.passed);
    const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);

    // Determine first failed check (for message priority)
    const firstFailed = failedChecks.length > 0 ? failedChecks[0] : undefined;

    // Determine recommendation
    let recommendedAction: 'accept' | 'review' | 'reject';
    if (failedChecks.length === 0) {
        recommendedAction = 'accept';
    } else if (
        failedChecks.every(c => ['SKILLS', 'EMPLOYMENT_HISTORY', 'EDUCATION'].includes(c.name))
    ) {
        // Only content gaps → review
        recommendedAction = 'review';
    } else {
        // Any hygiene or critical business rule → reject
        recommendedAction = 'reject';
    }

    return {
        isValid: recommendedAction === 'accept' || recommendedAction === 'review', // Review is considered valid-enough to proceed, but with caution.
        recommendedAction,
        score,
        rejectionReason: firstFailed?.reason,
        reason: firstFailed?.reason, // Alias for backward compatibility
        telemetryId,
        checks
    };
}

// Alias for backward compatibility if needed, though we update callsites.
export const isValidResume = validateResume;