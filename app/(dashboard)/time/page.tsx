import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { LogTimeDialog } from '@/components/time/log-time-dialog'
import { TimeList } from '@/components/time/time-list'
import { ExportButton } from '@/components/export-button'

export default async function TimePage() {
  const { userId } = await auth()
  if (!userId) return null

  const [{ data: entries }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from('time_entries')
      .select('*, projects(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50),
    supabaseAdmin.from('projects').select('id, name').eq('user_id', userId).eq('status', 'active'),
  ])

  const totalHours = entries?.reduce((s, e) => s + e.hours, 0) ?? 0
  const billableHours = entries?.filter(e => e.billable).reduce((s, e) => s + e.hours, 0) ?? 0

  const exportData = (entries ?? []).map(e => ({
    Date: e.date,
    Project: (e.projects as { name: string } | null)?.name ?? '',
    Description: e.description ?? '',
    Hours: e.hours,
    Billable: e.billable ? 'Yes' : 'No',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Tracking</h2>
          <p className="text-muted-foreground">{totalHours.toFixed(1)}h total · {billableHours.toFixed(1)}h billable</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="time-entries" />
          <LogTimeDialog projects={projects ?? []} />
        </div>
      </div>

      {!entries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No time logged yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Start tracking your work hours.</p>
            <LogTimeDialog projects={projects ?? []} />
          </CardContent>
        </Card>
      ) : (
        <TimeList entries={entries} projects={projects ?? []} />
      )}
    </div>
  )
}
