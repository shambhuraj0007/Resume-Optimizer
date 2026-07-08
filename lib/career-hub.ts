import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { PostData, THEME_LABELS } from './career-hub-shared';

const contentDir = path.join(process.cwd(), 'career-hub', 'content');

export { THEME_LABELS };
export type { PostData };

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise a single JSON item into a flat object with `slug` and `title`.
 *
 * Handles two shapes:
 *   1. **Wrapped**  `{ meta: { slug, ... }, content: { ... } }`
 *   2. **Flat**     `{ slug, title, sections, ... }`
 */
/** Generate a URL-safe slug from a string */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function normaliseItem(raw: any): Record<string, any> | null {
    if (raw.meta && raw.content) {
        // Wrapped format (interview-prep, salary, resume)
        const metaSlug: string = raw.meta.slug ?? '';
        const slug = metaSlug.split('/').filter(Boolean).pop() ?? '';
        if (!slug) return null;

        return {
            slug,
            title: raw.meta.topic ?? raw.content.h1 ?? slug,
            description: raw.meta.seo_description ?? '',
            seo_title: raw.meta.seo_title,
            seo_description: raw.meta.seo_description,
            primary_keyword: raw.meta.primary_keyword,
            secondary_keywords: raw.meta.secondary_keywords,
            author: raw.meta.author,
            audience: raw.meta.audience,
            ...raw.content,
        };
    }

    // Flat format (career-growth, job-market-trends, etc.)
    if (raw.slug) {
        // slug may be a full path like "/career-hub/career-growth/some-slug"
        const slug = raw.slug.includes('/')
            ? raw.slug.split('/').filter(Boolean).pop()!
            : raw.slug;
        return { ...raw, slug };
    }

    // No slug — auto-generate from title or primary_keyword
    if (raw.title) {
        const slug = slugify(raw.primary_keyword ?? raw.title);
        return { ...raw, slug };
    }

    return raw;
}

/**
 * Read a single JSON file and return an array of normalised items.
 * Handles both single-object and array JSON files.
 */
function readJsonFile(filePath: string): Record<string, any>[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const items = Array.isArray(parsed) ? parsed : [parsed];
        return items.map(normaliseItem).filter(Boolean) as Record<string, any>[];
    } catch (e) {
        console.error(`Error parsing JSON ${filePath}:`, e);
        return [];
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAllThemes(): string[] {
    if (!fs.existsSync(contentDir)) return [];
    return fs
        .readdirSync(contentDir)
        .filter((f) => fs.statSync(path.join(contentDir, f)).isDirectory());
}

export function getAllPosts(theme: string): Omit<PostData, 'contentHtml'>[] {
    const themeDir = path.join(contentDir, theme);
    if (!fs.existsSync(themeDir)) return [];

    const files = fs.readdirSync(themeDir);
    const posts: Omit<PostData, 'contentHtml'>[] = [];
    const seenSlugs = new Set<string>();

    for (const file of files) {
        if (file.startsWith('_')) continue;

        const filePath = path.join(themeDir, file);

        if (file.endsWith('.json')) {
            const items = readJsonFile(filePath);
            for (const item of items) {
                const slug = item.slug as string;
                if (!slug || seenSlugs.has(slug)) continue;
                seenSlugs.add(slug);

                // Map content.sections → growth_sections to avoid collision with ResumeSection[]
                if (theme !== 'resume-tips' && item.sections && Array.isArray(item.sections) && item.sections[0]?.heading) {
                    item.growth_sections = item.sections;
                    delete item.sections;
                }

                posts.push({ theme, ...item } as any);
            }
        } else if (file.endsWith('.md')) {
            const slug = file.replace(/\.md$/, '');
            if (seenSlugs.has(slug)) continue;
            seenSlugs.add(slug);

            try {
                const { data } = matter(fs.readFileSync(filePath, 'utf8'));
                posts.push({ theme, slug, ...data } as any);
            } catch (e) {
                console.error(`Error parsing MD for ${slug}:`, e);
            }
        }
    }

    return posts;
}

export async function getPost(theme: string, slug: string): Promise<PostData | null> {
    const themeDir = path.join(contentDir, theme);
    if (!fs.existsSync(themeDir)) return null;

    // 1. Check for a dedicated slug.json file first
    const dedicatedJsonPath = path.join(themeDir, `${slug}.json`);
    if (fs.existsSync(dedicatedJsonPath)) {
        const items = readJsonFile(dedicatedJsonPath);
        // If it's a single-item file whose slug matches
        if (items.length === 1 || items.some((i) => i.slug === slug)) {
            const data = items.find((i) => i.slug === slug) ?? items[0];
            return finalisePost(theme, slug, data);
        }
    }

    // 2. Scan all JSON files for an array item matching slug
    const files = fs.readdirSync(themeDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
    for (const file of files) {
        const items = readJsonFile(path.join(themeDir, file));
        const match = items.find((i) => i.slug === slug);
        if (match) {
            return finalisePost(theme, slug, match);
        }
    }

    // 3. Fallback to markdown
    const mdPath = path.join(themeDir, `${slug}.md`);
    if (fs.existsSync(mdPath)) {
        try {
            const raw = fs.readFileSync(mdPath, 'utf8');
            const { data, content } = matter(raw);
            const processed = await remark().use(html, { sanitize: false }).process(content);
            return { slug, theme, contentHtml: processed.toString(), ...data } as PostData;
        } catch (e) {
            console.error(`Error parsing MD for ${slug}:`, e);
        }
    }

    return null;
}

/** Apply final transformations and build the PostData object */
async function finalisePost(theme: string, slug: string, data: Record<string, any>): Promise<PostData> {
    // Process markdown body if present
    const body = data.body ?? '';
    const processed = await remark().use(html, { sanitize: false }).process(body);

    // Map content.sections → growth_sections to avoid collision with ResumeSection[]
    if (theme !== 'resume-tips' && data.sections && Array.isArray(data.sections) && data.sections[0]?.heading) {
        data.growth_sections = data.sections;
        delete data.sections;
    }

    return {
        slug,
        theme,
        contentHtml: processed.toString(),
        ...data,
    } as PostData;
}
