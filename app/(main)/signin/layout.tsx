import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - ShortlistAI',
  description: 'Access your dashboard to manage resumes, job descriptions, and optimization tools.',
  alternates: {
    canonical: '/signin',
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
