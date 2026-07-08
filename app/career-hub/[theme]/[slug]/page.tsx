import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllThemes, getAllPosts, getPost } from '@/lib/career-hub';
import InterviewPage from '@/components/career-hub/InterviewPage';
import SalaryPage from '@/components/career-hub/SalaryPage';
import ResumePage from '@/components/career-hub/ResumePage';
import GrowthPage from '@/components/career-hub/GrowthPage';
import TrendsPage from '@/components/career-hub/TrendsPage';

interface Props {
    params: { theme: string; slug: string };
}

export async function generateStaticParams() {
    const paths: { theme: string; slug: string }[] = [];
    getAllThemes().forEach((theme) => {
        getAllPosts(theme).forEach((post) => {
            paths.push({ theme, slug: post.slug });
        });
    });
    return paths;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await getPost(params.theme, params.slug);
    if (!post) return {};
    return {
        title: `${post.title} | ShortlistAI Career Hub`,
        description: post.description,
        alternates: {
            canonical: `https://shortlistai.cv/career-hub/${params.theme}/${params.slug}/`,
        },
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
        },
    };
}

export default async function CareerHubPost({ params }: Props) {
    const { theme, slug } = params;
    const post = await getPost(theme, slug);
    if (!post) notFound();

    switch (theme) {
        case 'interview-preparation': return <InterviewPage post={post} />;
        case 'salary-insights': return <SalaryPage post={post} />;
        case 'resume-tips': return <ResumePage post={post} />;
        case 'career-growth': return <GrowthPage post={post} />;
        case 'job-market-trends': return <TrendsPage post={post} />;
        default: notFound();
    }
}
