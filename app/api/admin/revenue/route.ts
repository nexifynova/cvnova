import { NextResponse } from 'next/server';
import { createAdminClient, isAdminCookie } from '@/lib/supabase-admin';

/**
 * Phase 5 - company slip revenue for /admin/revenue.
 *
 * Individual client payments are read straight from `payments` by the admin
 * browser session, but `company_payments` stays closed to every browser role
 * (RLS on, zero policies, no anon/authenticated grants), so the approved
 * company slips are handed over here with the service role.
 *
 * Rows are shaped like a `payments` row so the revenue page can merge both
 * streams into one calendar, one month-wise record and one total.
 */

type PaymentShape = {
  id: string;
  user_id: string;
  user_email: string;
  company_name: string | null;
  package_type: string;
  amount: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  transaction_id: string | null;
  payment_method: string | null;
  slip_url: string | null;
};

export async function GET(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('company_payments')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(2000);

    if (error) throw error;

    const payments: PaymentShape[] = (data || []).map((row: any) => {
      const approvedAt = row?.approved_at ? String(row.approved_at) : null;
      const createdAt = row?.created_at ? String(row.created_at) : '';
      return {
        id: String(row?.id || ''),
        user_id: String(row?.company_id || ''),
        user_email: String(row?.company_email || ''),
        company_name: row?.company_name ? String(row.company_name) : null,
        package_type: String(row?.package_name || row?.package_code || 'Company plan'),
        amount: Math.max(0, Number(row?.amount) || 0),
        status: 'approved',
        created_at: createdAt || approvedAt || '',
        approved_at: approvedAt || createdAt || null,
        transaction_id: row?.transaction_id ? String(row.transaction_id) : null,
        payment_method: row?.payment_method ? String(row.payment_method) : null,
        slip_url: row?.slip_url ? String(row.slip_url) : null,
      };
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'company_revenue_load_failed' },
      { status: 500 },
    );
  }
}
