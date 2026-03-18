import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { paymentSchema, parseBody } from '@/lib/schemas'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const invoice_id = searchParams.get('invoice_id')

  let query = supabaseAdmin
    .from('payments')
    .select('*, invoices(invoice_number, total)')
    .eq('user_id', userId)
    .order('payment_date', { ascending: false })

  if (invoice_id) query = query.eq('invoice_id', invoice_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(paymentSchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { invoice_id, amount, payment_date, payment_method, notes } = parsed.data

  // Verify the invoice belongs to this user before writing the payment
  if (invoice_id) {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('id', invoice_id)
      .eq('user_id', userId)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert({ user_id: userId, invoice_id, amount, payment_date, payment_method, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })

  // Mark invoice as paid only when total payments cover the invoice total
  if (invoice_id) {
    const [{ data: invoiceData }, { data: allPayments }] = await Promise.all([
      supabaseAdmin
        .from('invoices')
        .select('total')
        .eq('id', invoice_id)
        .eq('user_id', userId)
        .single(),
      supabaseAdmin
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoice_id),
    ])

    if (invoiceData && allPayments) {
      const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0)
      if (totalPaid >= invoiceData.total) {
        await supabaseAdmin
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoice_id)
          .eq('user_id', userId)
      }
    }
  }

  return NextResponse.json(data, { status: 201 })
}
