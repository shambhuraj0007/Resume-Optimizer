function cleanJobBoardText(raw: string): string {
    let text = raw;
    text = text.replace(/https?:\/\/[^\s\)]+/g, '');
    text = text.replace(/www\.[^\s\)]+/g, '');
    text = text.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1 ');
    text = text.replace(/^\|(.+?)\|$/gm, '$1');
    text = text.replace(/^\|[-|:\s]*\|$/gm, '');
    text = text.replace(/–/g, '-');
    text = text.replace(/—/g, '-');
    text = text.replace(/•|○|●|◦|·/g, '-');
    text = text.replace(/[']/g, "'");
    text = text.replace(/[""]/g, '"');
    text = text.replace(/(\w)(Benefits|Schedule|Location|Experience|Requirements|Salary|Pay|Responsibilities)/gi, '$1 $2');
    text = text.replace(/(\d{4})(YEARLY|HOURLY)/g, '$1 $2');
    text = text.replace(/\d{10,}(?!\d*-\d)/g, '');
    text = text.replace(/\[(website|company\s+name|insert[^\]]*)\]/gi, '');
    text = text.replace(/\{(website|company\s+name)\}/gi, '');
    text = text.replace(/About Indeed[\s\S]*$/gi, '');
    text = text.replace(/Show more[\s\S]*$/gi, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function checkRoleSignals(text: string): number {
    let points = 0;
    if (/\b(position|role|job|vacancy|we are (hiring|looking for)|we seek|opportunity)/i.test(text)) {
        points += 2;
    }
    if (/\b(junior|mid.level|senior|lead|principal|manager|director|intern|graduate|fresher)/i.test(text)) {
        points += 2;
    }
    if (/[A-Z][a-z]+\s+(Developer|Engineer|Manager|Designer|Analyst|Specialist|Officer|Executive|Intern|Consultant)/i.test(text)) {
        points += 1;
    }
    return Math.min(points, 6);
}

function checkResponsibilitySignals(text: string): number {
    let points = 0;
    if (/\b(what you.*do|what you'll do|responsibilit|accountabilit|your role|duties|day-to-day|das erwartet|selected.*responsib)/i.test(text)) {
        points += 2;
    }
    const sentences = text.split(/[.!?]/);
    let actionSentences = 0;
    for (const sentence of sentences) {
        const hasAction = /\b(develop|design|manage|lead|build|create|implement|collaborate|work|support|drive|execute|deliver|analyze|optimize|conduct|partner|improve|identify)\b/i.test(sentence);
        const hasObject = /\b(team|system|project|product|feature|customer|application|service|campaign|strategy|data|process|code|interview|research|goal)\b/i.test(sentence);
        if (hasAction && hasObject) {
            actionSentences++;
        }
    }
    if (actionSentences >= 3) {
        points += 3;
    } else if (actionSentences >= 1) {
        points += 1;
    }
    return Math.min(points, 5);
}

function checkRequirementSignals(text: string): number {
    let points = 0;
    if (/\b(requirement|qualification|must have|should have|ideal candidate|das bringen|profil recherch)/i.test(text)) {
        points += 1;
    }
    if (/\d+\+?\s*years?\s+(?:of\s+)?(?:experience|background)/i.test(text)) {
        points += 1;
    }
    if (/\b(bachelor|degree|diploma|certificate|certified|phd|master|mba|b\.?tech|skills?:|technical)/i.test(text)) {
        points += 1;
    }
    if (/\b(skills?|technical\s+skills?|must have|hands.on|experience with)[\s:]+([a-z, ]+)/i.test(text)) {
        points += 1;
    }
    return Math.min(points, 4);
}

export interface ValidationResult {
    status: string;
    isValid: boolean;
    message?: string;
}

export function validateJobDescription(rawText: string): ValidationResult {
    if (!rawText || typeof rawText !== 'string') {
        return {
            status: 'REJECT',
            isValid: false,
            message: "This doesn't seem like a JD"
        };
    }

    const length = rawText.trim().length;
    if (length < 150 || length > 9000) {
        return {
            status: 'REJECT',
            isValid: false,
            message: "Length invalid (must be 150-9000 chars)"
        };
    }

    const cleaned = cleanJobBoardText(rawText);
    const rolePoints = checkRoleSignals(cleaned);
    const responsibilityPoints = checkResponsibilitySignals(cleaned);
    const requirementPoints = checkRequirementSignals(cleaned);
    const totalPoints = rolePoints + responsibilityPoints + requirementPoints;

    if (totalPoints >= 6) {
        return {
            status: 'ACCEPT',
            isValid: true
        };
    }

    return {
        status: 'REJECT',
        isValid: false,
        message: "This doesn't seem like a valid Job Description"
    };
}