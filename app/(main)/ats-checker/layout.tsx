import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker | AI Resume Score & Optimization Tool - ShortlistAI',
  description: 'Check your resume score against Applicant Tracking Systems (ATS) instantly.',
  alternates: {
    canonical: '/ats-checker',
  },
};

export default function AtsCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
