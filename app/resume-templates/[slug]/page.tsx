import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import JobRole, { IJobRole } from '@/models/JobRole';
import TemplatePage from '@/app/resume-templates/[slug]/TemplatePage';

type Props = { params: { slug: string } };

// For SSG: pre-generate known paths
export async function generateStaticParams() {
    await connectDB();
    const roles = await JobRole.find({}, 'slug').lean();

    return roles.map((role: any) => ({
        slug: role.slug,
    }));
}

// Revalidate every 24 hours
export const revalidate = 86400;

// Dynamic metadata for each role
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    await connectDB();
    const role = await JobRole.findOne({ slug: params.slug }).lean<IJobRole | null>();

    if (!role) {
        return {
            title: 'Resume Template Not Found | ShortlistAI',
        };
    }

    const title =
        role.metaTitle ||
        `${role.jobTitle} Resume Template (Free Download) | 2025`;
    const description =
        role.metaDescription ||
        `Download a free ${role.jobTitle} resume template with ATS keywords. ${role.averageSalary ? `Avg salary: ${role.averageSalary}.` : ''} Includes ${role.topSkills?.slice(0, 3).join(', ') || 'top skills'} and expert tips.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://shortlistai.cv/resume-templates/${role.slug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://shortlistai.cv/resume-templates/${role.slug}`,
            siteName: 'ShortlistAI',
            type: 'article',
            images: role.sampleImageUrl ? [{ url: role.sampleImageUrl }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

// Page Component
export default async function Page({ params }: Props) {
    await connectDB();
    const role = await JobRole.findOne({ slug: params.slug }).lean<IJobRole | null>();

    if (!role) {
        notFound();
    }

    // Fetch all existing slugs for dead link protection in Related Templates
    const allRoles = await JobRole.find({}, 'slug').lean();
    const existingSlugs = allRoles.map((r: any) => r.slug);

    // Deep serialize MongoDB types for client component (handles nested _id fields in arrays)
    const serializableRole = JSON.parse(JSON.stringify(role));

    return <TemplatePage role={serializableRole} existingSlugs={existingSlugs} />;
}
