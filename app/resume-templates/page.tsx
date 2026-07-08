import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import JobRole, { IJobRole } from '@/models/JobRole';
import TemplatesHubClient from './TemplatesHubClient';

export const metadata: Metadata = {
    title: 'Free ATS-Optimized Resume Templates by Job Role | ShortlistAI',
    description: 'Browse our collection of ATS-optimized resume templates for every job role. Get industry-specific tips, skills, and examples to create a resume that passes ATS screening.',
    alternates: {
        canonical: 'https://shortlistai.cv/resume-templates',
    },
    openGraph: {
        title: 'Free ATS-Optimized Resume Templates | ShortlistAI',
        description: 'Browse our collection of ATS-optimized resume templates for every job role.',
        url: 'https://shortlistai.cv/resume-templates',
    },
};

export const revalidate = 3600; // Revalidate every hour

export default async function ResumeTemplatesPage() {
    await connectDB();
    const roles = await JobRole.find({})
        .select('slug jobTitle industry demandLevel topSkills averageSalary topCompanies updatedAt')
        .sort({ updatedAt: -1 })
        .lean<IJobRole[]>();

    // Serialize for client component
    const serializableRoles = JSON.parse(JSON.stringify(roles));

    return <TemplatesHubClient roles={serializableRoles} />;
}
