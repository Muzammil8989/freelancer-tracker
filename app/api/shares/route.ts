import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { shareSchema, parseBody } from '@/lib/schemas'
import { randomBytes } from 'crypto'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const project_id = searchParams.get('project_id')
  if (!project_id) return NextResponse.json({ error: 'project_id is required' }, { status: 400 })

  // Verify the project belongs to this user
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', userId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('project_shares')
    .select('id, label, token, created_at')
    .eq('project_id', project_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = parseBody(shareSchema, await req.json())
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const { project_id, label } = parsed.data

  // Verify the project belongs to this user
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', userId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const token = randomBytes(32).toString('hex')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const share_url = `${appUrl}/share/${token}`

  const { data, error } = await supabaseAdmin
    .from('project_shares')
    .insert({ project_id, user_id: userId, token, label: label ?? null })
    .select('id, token, label, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, share_url }, { status: 201 })
}
