import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - ShortlistAI',
  description: 'Simple, transparent pricing for ATS resume analysis and AI optimization tools.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
