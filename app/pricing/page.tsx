import type { Metadata } from 'next';
import PricingView from '@/components/pricing/PricingView';

export const metadata: Metadata = {
  title: 'Pricing | CVNova',
  description:
    'Individual CV builder plans and company recruiter plans — live prices for CV writing, ATS templates, job posting and the company talent pool.',
};

/**
 * Public pricing page.
 *
 * Server wrapper for metadata/SEO; the stacked price sections ("For CV Maker
 * Users" then "For Company Prices") live in <PricingView />, which loads both
 * catalogues from /api/pricing.
 */
export default function PricingPage() {
  return <PricingView />;
}
