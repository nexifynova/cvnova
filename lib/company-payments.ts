/**
 * Phase 5 - company plan payments.
 *
 * A company uploads a bank/rail slip from /company/checkout; the row lands in
 * `company_payments` as `pending` and the admin approves it from
 * /admin/company-payments, which is what actually writes `package_type`,
 * `package_expiry` and `grace_expiry` on the company row.
 *
 * Pure helpers only: this module is imported by client components, so never add
 * Node-only dependencies here.
 */

export type CompanyPaymentStatus = 'pending' | 'approved' | 'rejected';

export type CompanyPayment = {
  id: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  packageCode: string;
  packageName: string;
  durationDays: number;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  slipUrl: string;
  status: CompanyPaymentStatus;
  adminNotes: string;
  appliedExpiry: string | null;
  approvedAt: string | null;
  createdAt: string;
};

/** Wording requested by the product owner. Keep the three states distinct. */
export const COMPANY_PAYMENT_STATUS_META: Record<
  CompanyPaymentStatus,
  { label: string; badge: string; hint: string }
> = {
  pending: {
    label: 'In Checking',
    badge: 'bg-amber-100 text-amber-700',
    hint: 'The admin is verifying this payment slip.',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-100 text-emerald-700',
    hint: 'Payment received - the plan is active.',
  },
  rejected: {
    label: 'Disapproved',
    badge: 'bg-red-100 text-red-700',
    hint: 'Payment could not be verified. Upload a new slip or contact support.',
  },
};

/** Shown on the checkout success screen and in the company portal. */
export const PAYMENT_SUBMITTED_MESSAGE =
  'Payment submitted. Admin will verify your payment shortly.';

export function normalizeCompanyPaymentStatus(value: unknown): CompanyPaymentStatus {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'disapproved') return 'rejected';
  return 'pending';
}

export function companyPaymentStatusMeta(value: unknown) {
  return COMPANY_PAYMENT_STATUS_META[normalizeCompanyPaymentStatus(value)];
}

const toText = (value: unknown): string => String(value ?? '').trim();

export function mapCompanyPayment(row: any): CompanyPayment {
  return {
    id: String(row?.id || ''),
    companyId: String(row?.company_id || ''),
    companyName: toText(row?.company_name) || 'Company',
    companyEmail: toText(row?.company_email),
    packageCode: toText(row?.package_code),
    packageName: toText(row?.package_name) || toText(row?.package_code),
    durationDays: Math.max(0, Math.round(Number(row?.duration_days) || 0)),
    amount: Math.max(0, Number(row?.amount) || 0),
    paymentMethod: toText(row?.payment_method) || 'Manual',
    transactionId: toText(row?.transaction_id),
    slipUrl: toText(row?.slip_url),
    status: normalizeCompanyPaymentStatus(row?.status),
    adminNotes: toText(row?.admin_notes),
    appliedExpiry: row?.applied_expiry ? String(row.applied_expiry) : null,
    approvedAt: row?.approved_at ? String(row.approved_at) : null,
    createdAt: row?.created_at ? String(row.created_at) : '',
  };
}

export const usdAmount = (value: number): string =>
  `$${(Math.round(Number(value || 0) * 100) / 100).toFixed(2)}`;

/** "2026-12-26T10:00:00Z" -> "26 Dec 2026" (date only, stable). */
export function paymentDateLabel(value: string | null | undefined): string {
  const raw = toText(value);
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
