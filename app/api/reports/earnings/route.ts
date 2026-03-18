import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select('total, issue_date, status, client_id, project_id, clients(name)')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('issue_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Earnings by month (last 12 months)
  const byMonth: Record<string, number> = {}
  invoices?.forEach(inv => {
    const month = inv.issue_date.slice(0, 7) // YYYY-MM
    byMonth[month] = (byMonth[month] ?? 0) + inv.total
  })

  // Earnings by client
  const byClient: Record<string, number> = {}
  invoices?.forEach(inv => {
    const name = (inv.clients as unknown as { name: string } | null)?.name ?? 'Unknown'
    byClient[name] = (byClient[name] ?? 0) + inv.total
  })

  return NextResponse.json({ byMonth, byClient })
}
