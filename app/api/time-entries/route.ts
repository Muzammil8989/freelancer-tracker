import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { timeEntrySchema, parseBody } from '@/lib/schemas'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  const date = searchParams.get('date')

  let query = supabaseAdmin
    .from('time_entries')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (project_id) query = query.eq('project_id', project_id)
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(timeEntrySchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { project_id, description, hours, date, billable } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('time_entries')
    .insert({ user_id: userId, project_id, description, hours, date, billable })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
