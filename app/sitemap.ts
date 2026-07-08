import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import JobRole from '@/models/JobRole';
import { getAllThemes, getAllPosts } from '@/lib/career-hub';

const baseUrl = 'https://shortlistai.cv';

async function getStaticPages(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/ats-checker`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/resume-optimizer`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/resume-templates`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ];
}

async function getResumeTemplatePages(): Promise<MetadataRoute.Sitemap> {
  const roles = await JobRole.find({}, 'slug updatedAt').lean();
  return roles.map((role: any) => ({
    url: `${baseUrl}/resume-templates/${encodeURIComponent(role.slug)}`,
    lastModified: role.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}

function getCareerHubPages(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/career-hub`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
  ];

  for (const theme of getAllThemes()) {
    // Theme listing page
    entries.push({
      url: `${baseUrl}/career-hub/${theme}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Individual posts within the theme
    for (const post of getAllPosts(theme)) {
      entries.push({
        url: `${baseUrl}/career-hub/${theme}/${post.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ensure DB connection before running queries
  await connectDB();

  // Fetch data concurrently
  const [staticPages, resumeTemplates] = await Promise.all([
    getStaticPages(),
    getResumeTemplatePages(),
  ]);

  const careerHubPages = getCareerHubPages();

  return [...staticPages, ...resumeTemplates, ...careerHubPages];
}