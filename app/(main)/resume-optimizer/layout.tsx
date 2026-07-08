import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Resume Optimizer | Boost Your Resume Score Instantly - ShortlistAI',
  description: 'Optimize your resume keywords and formatting to rank higher for specific job descriptions.',
  alternates: {
    canonical: '/resume-optimizer',
  },
};

export default function ResumeOptimizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
