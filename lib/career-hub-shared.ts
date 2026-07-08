// ── Shared frontmatter types ──────────────────────────────────────────────────

export interface Question {
    q: string;
    category: string;
    answer: string;
    tips?: string;
}

export interface SalaryBand {
    level: string;
    min_salary: number;
    max_salary: number;
    median?: number;
}

export interface ResumeSection {
    name: string;
    rationale: string;
}

export interface RoadmapStep {
    milestone: string;
    timeline: string;
    skills: string[];
    desc: string;
}

export interface GrowthSubsection {
    heading?: string;
    subheading?: string;
    paragraphs?: string[];
    bullets?: string[];
}

export interface GrowthSection {
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
    subsections?: GrowthSubsection[];
}

export interface QuickAnswer {
    summary: string;
    bullets?: string[];
}

export interface GrowthExample {
    label?: string;
    body: string;
}

export interface GrowthFAQ {
    question: string;
    answer: string;
}

export interface GrowthCTA {
    heading: string;
    paragraph: string;
    primary_button_label?: string;
    primary_button_target?: string;
}

export interface InternalLink {
    label: string;
    target: string;
}

export interface KeyStat {
    metric: string;
    value: string;
}

export interface TrendingSkill {
    name: string;
    demand: 'rising' | 'stable' | 'cooling';
}

/** Union of all possible frontmatter fields across all 5 themes */
export interface PostData {
    slug: string;
    theme: string;
    contentHtml: string;
    title: string;
    description?: string;
    date?: string;
    draft?: boolean;
    cta_text?: string;
    // Interview Preparation
    job_role?: string;
    location?: string;
    seniority?: string;
    questions?: Question[];
    // Salary Insights
    salary_bands?: SalaryBand[];
    negotiation_tips?: string;
    // Resume Templates
    experience?: string;
    sections?: ResumeSection[];
    ats_tips?: string;
    preview_image?: string;
    // Career Growth
    target_role?: string;
    roadmap?: RoadmapStep[];
    quick_answer?: QuickAnswer;
    intro_paragraph?: string;
    growth_sections?: GrowthSection[];
    examples?: GrowthExample[];
    faq?: GrowthFAQ[];
    final_cta?: GrowthCTA;
    internal_links?: InternalLink[];
    primary_keyword?: string;
    secondary_keywords?: string[];
    author?: string;
    audience?: string;
    seo_title?: string;
    seo_description?: string;
    h1?: string;
    // Job Market Trends
    industry?: string;
    region?: string;
    year?: string | number;
    key_stats?: KeyStat[];
    trending_skills?: TrendingSkill[];
}

export const THEME_LABELS: Record<string, string> = {
    'interview-preparation': 'Interview Preparation',
    'salary-insights': 'Salary Insights',
    'resume-tips': 'Resume Tips',
    'career-growth': 'Career Growth',
    'job-market-trends': 'Job Market Trends',
};
