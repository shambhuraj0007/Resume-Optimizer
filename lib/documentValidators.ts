export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    code?: "TOO_SHORT" | "TOO_LONG" | "NOT_RESUME" | "NOT_JD" | "LOOKS_LIKE_JD" | "LOOKS_LIKE_RESUME";
}
// --- REGEX PATTERNS ---
const YEAR_REGEX = /20\d{2}/;
const DATE_RANGE_REGEX = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2})\s*[-–—]\s*(?:20\d{2}|Present|Current|Ongoing)/i;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const PHONE_REGEX = /(\+?\d[\d\s\-()]{7,})/;
const BULLET_LINE_REGEX = /^\s*[-•·*○●]\s+/m;


// --- KEYWORDS ---
const JD_HIGH_CONFIDENCE = [
    "responsibilities", "requirements", "qualifications", "what you'll do",
    "the ideal candidate", "successful candidate", "equal opportunity employer",
    "reports to", "direct reports", "nice to have", "we are seeking", "preferred skills"
];

const JD_TONE_MARKERS = [
    "you will", "you'll", "your role", "join us", "we offer", "work with us",
    "the candidate will", "apply now", "hiring for"
];

const RESUME_HIGH_CONFIDENCE = [
    "experience", "professional experience", "work history", "employment history",
    "education", "skills", "technical skills", "certifications", "projects",
    "summary", "career objective", "personal profile", "achievements"
];

// --- HELPER FUNCTIONS ---

/**
 * Counts occurrences of keywords with boundary checks for accuracy
 */
function getMatchScore(text: string, keywords: string[]): number {
    const lower = text.toLowerCase();
    return keywords.reduce((score, kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const matches = lower.match(regex);
        return score + (matches ? matches.length : 0);
    }, 0);
}

/**
 * Checks for first-person vs second/third person tone
 */
function getToneAnalysis(text: string) {
    const lower = text.toLowerCase();
    const firstPerson = (lower.match(/\b(i|my|me|myself)\b/g) || []).length;
    const employerTone = (lower.match(/\b(you|your|we|our|us|candidate)\b/g) || []).length;
    return { firstPerson, employerTone };
}
// --- MAIN VALIDATORS ---

/**
 * Validates if the text is a Job Description
 */
export function validateJobDescriptionText(text: string): ValidationResult {
    const trimmed = (text || "").trim();
    const len = trimmed.length;

    // 1. Basic Length Guard
    if (len < 150) {
        return { isValid: false, code: "TOO_SHORT", reason: "Job description is too short. Please provide the full role details." };
    }
    if (len > 6000) {
        return { isValid: false, code: "TOO_LONG", reason: "Text is too long. Please paste only one job posting." };
    }

    const lower = trimmed.toLowerCase();
    const { firstPerson, employerTone } = getToneAnalysis(trimmed);

    // 2. JD Scoring
    const highConfHits = getMatchScore(trimmed, JD_HIGH_CONFIDENCE);
    const toneHits = getMatchScore(trimmed, JD_TONE_MARKERS);
    const hasStructure = (trimmed.match(/^\s*[-•·*○●]\s+/gm) || []).length >= 2;
    const hasDates = DATE_RANGE_REGEX.test(trimmed);

    // 3. Negative Logic (Is it actually a Resume?)
    const resumeSectionHits = getMatchScore(trimmed, RESUME_HIGH_CONFIDENCE);

    // REJECTION LOGIC: Massive first-person language + Date ranges usually = Resume
    if (hasDates && firstPerson > employerTone && resumeSectionHits > 2) {
        return {
            isValid: false,
            code: "LOOKS_LIKE_RESUME",
            reason: "This text looks like a CV or personal profile. Please paste the Job Description provided by the employer."
        };
    }

    // 4. Final JD Decision Score
    let finalScore = 0;
    finalScore += (highConfHits * 3);
    finalScore += (toneHits * 1.5);
    finalScore += (hasStructure ? 2 : 0);
    if (employerTone > firstPerson) finalScore += 3;

    // Threshold for valid JD: Score of 5 is usually the bare minimum for a valid posting
    if (finalScore < 5) {
        return {
            isValid: false,
            code: "NOT_JD",
            reason: "The text doesn't seem to be a valid job description. Ensure it includes role requirements and responsibilities."
        };
    }

    return { isValid: true };
}

/**
 * Validates if the text is a Resume
 */
export function validateResumeText(text: string): ValidationResult {
    const trimmed = (text || "").trim();
    const len = trimmed.length;

    if (len < 300) {
        return { isValid: false, code: "TOO_SHORT", reason: "Resume is too short. Please provide your full professional experience." };
    }

    const lower = trimmed.toLowerCase();
    const sectionHits = getMatchScore(trimmed, RESUME_HIGH_CONFIDENCE);
    const hasDates = DATE_RANGE_REGEX.test(trimmed);
    const hasEmail = EMAIL_REGEX.test(trimmed);
    const hasPhone = PHONE_REGEX.test(trimmed);
    const { firstPerson, employerTone } = getToneAnalysis(trimmed);

    // Resume Detection Score
    let resumeScore = 0;
    resumeScore += (sectionHits * 2);
    resumeScore += (hasDates ? 4 : 0);
    resumeScore += (hasEmail || hasPhone ? 3 : 0);
    if (firstPerson > 0) resumeScore += 2;

    // Check if it's actually a JD
    const jdPhrases = getMatchScore(trimmed, JD_HIGH_CONFIDENCE);
    if (jdPhrases > 5 && employerTone > firstPerson) {
        return {
            isValid: false,
            code: "LOOKS_LIKE_JD",
            reason: "This looks like a job description. Please paste your own Resume text here."
        };
    }

    if (resumeScore < 6) {
        return {
            isValid: false,
            code: "NOT_RESUME",
            reason: "This text doesn't seem to be a resume. Please provide a document detailing your experience and education."
        };
    }

    return { isValid: true };
}