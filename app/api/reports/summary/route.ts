import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: invoices },
    { data: projects },
    { data: expenses },
    { data: clients },
  ] = await Promise.all([
    supabaseAdmin.from('invoices').select('status, total').eq('user_id', userId),
    supabaseAdmin.from('projects').select('status').eq('user_id', userId),
    supabaseAdmin.from('expenses').select('amount').eq('user_id', userId),
    supabaseAdmin.from('clients').select('id').eq('user_id', userId),
  ])

  const totalEarned = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0) ?? 0
  const unpaidTotal = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.total, 0) ?? 0
  const unpaidCount = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').length ?? 0
  const activeProjects = projects?.filter(p => p.status === 'active').length ?? 0
  const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const totalClients = clients?.length ?? 0

  return NextResponse.json({
    totalEarned,
    unpaidTotal,
    unpaidCount,
    activeProjects,
    totalExpenses,
    totalClients,
  })
}
