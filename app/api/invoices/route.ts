import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { invoiceSchema, parseBody } from '@/lib/schemas'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('invoices')
    .select('*, clients(name), invoice_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(invoiceSchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { client_id, project_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes, items } = parsed.data

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .insert({ user_id: userId, client_id, project_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes })
    .select()
    .single()

  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

  if (items?.length) {
    const invoiceItems = items.map(item => ({ ...item, invoice_id: invoice.id }))
    const { error: itemsError } = await supabaseAdmin.from('invoice_items').insert(invoiceItems)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(invoice, { status: 201 })
}
