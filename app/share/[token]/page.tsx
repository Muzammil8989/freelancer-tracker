import { supabaseAdmin } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, LinkIcon } from 'lucide-react'
import type { Metadata } from 'next'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const metadata: Metadata = {
  title: 'Shared Project — FreelanceTrack',
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data: share } = await supabaseAdmin
    .from('project_shares')
    .select('project_id')
    .eq('token', token)
    .single()

  if (!share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-sm px-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold">Link not found</h1>
          <p className="text-sm text-muted-foreground">
            This share link is invalid or has been revoked.
          </p>
        </div>
      </div>
    )
  }

  const [{ data: project }, { data: timeEntries }] = await Promise.all([
    supabaseAdmin
      .from('projects')
      .select('id, name, description, status, type, hourly_rate, fixed_amount, currency, start_date, end_date, clients(name)')
      .eq('id', share.project_id)
      .single(),
    supabaseAdmin
      .from('time_entries')
      .select('hours, billable')
      .eq('project_id', share.project_id),
  ])

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Project data unavailable.</p>
      </div>
    )
  }

  const totalHours = timeEntries?.reduce((s, e) => s + e.hours, 0) ?? 0
  const billableHours = timeEntries?.filter(e => e.billable).reduce((s, e) => s + e.hours, 0) ?? 0
  const earned =
    project.type === 'hourly'
      ? billableHours * (project.hourly_rate ?? 0)
      : (project.fixed_amount ?? 0)
  const client = project.clients as { name: string } | null

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm">FreelanceTrack</span>
          <Badge variant="secondary">Shared Project</Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] ?? ''}`}>
              {project.status}
            </span>
          </div>
          {client && <p className="text-muted-foreground text-sm mt-1">{client.name}</p>}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Billable Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{billableHours.toFixed(1)}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {project.type === 'hourly' ? 'Earned (billable)' : 'Fixed Amount'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${earned.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Project details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline">{project.type}</Badge>
            </div>
            {project.type === 'hourly' && project.hourly_rate != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">${project.hourly_rate}/hr</span>
              </div>
            )}
            {project.type === 'fixed' && project.fixed_amount != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fixed Amount</span>
                <span className="font-medium">${project.fixed_amount.toLocaleString()}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />{project.start_date}
                </span>
              </div>
            )}
            {project.end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />{project.end_date}
                </span>
              </div>
            )}
            {client && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{client.name}</span>
              </div>
            )}
            {project.description && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p>{project.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <p className="text-xs text-muted-foreground">Powered by FreelanceTrack</p>
        </div>
      </footer>
    </div>
  )
}
