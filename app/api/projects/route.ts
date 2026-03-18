import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { projectSchema, parseBody } from '@/lib/schemas'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('projects')
    .select('*, clients(name)')
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

  const parsed = parseBody(projectSchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { name, client_id, description, status, type, hourly_rate, fixed_amount, currency, start_date, end_date } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ user_id: userId, name, client_id, description, status, type, hourly_rate, fixed_amount, currency, start_date, end_date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
