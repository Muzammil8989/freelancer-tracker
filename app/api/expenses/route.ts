import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { expenseSchema, parseBody } from '@/lib/schemas'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  const category = searchParams.get('category')

  let query = supabaseAdmin
    .from('expenses')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (project_id) query = query.eq('project_id', project_id)
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(expenseSchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { project_id, category, description, amount, currency, date, receipt_url } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({ user_id: userId, project_id, category, description, amount, currency, date, receipt_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
