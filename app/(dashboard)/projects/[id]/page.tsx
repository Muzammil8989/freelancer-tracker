import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, Mail } from 'lucide-react'
import { ShareProjectDialog } from '@/components/projects/share-project-dialog'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

const invoiceStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default', draft: 'secondary', sent: 'outline', overdue: 'destructive', cancelled: 'secondary',
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const { id } = await params

  const [{ data: project }, { data: timeEntries }, { data: invoices }] = await Promise.all([
    supabaseAdmin.from('projects').select('*, clients(name, email)').eq('id', id).eq('user_id', userId).single(),
    supabaseAdmin.from('time_entries').select('*').eq('project_id', id).order('date', { ascending: false }),
    supabaseAdmin.from('invoices').select('id, invoice_number, status, total, due_date').eq('project_id', id).eq('user_id', userId).order('due_date', { ascending: false }),
  ])

  if (!project) notFound()

  const totalHours = timeEntries?.reduce((s, e) => s + e.hours, 0) ?? 0
  const billableHours = timeEntries?.filter(e => e.billable).reduce((s, e) => s + e.hours, 0) ?? 0
  const earned = project.type === 'hourly' ? billableHours * (project.hourly_rate ?? 0) : (project.fixed_amount ?? 0)
  const client = project.clients as { name: string; email?: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status] ?? ''}`}>
              {project.status}
            </span>
          </div>
          {client && <p className="text-muted-foreground text-sm">{client.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          <ShareProjectDialog projectId={id} />
          <Button asChild><Link href="/time">+ Log Time</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Hours</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Billable Hours</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{billableHours.toFixed(1)}h</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">
            {project.type === 'hourly' ? 'Earned (billable)' : 'Fixed Amount'}
          </CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">${earned.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
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
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{project.start_date}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{project.end_date}</span>
              </div>
            )}
            {client && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{client.name}</span>
              </div>
            )}
            {client?.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email}</span>
              </div>
            )}
            {project.description && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground mb-1">Description</p>
                <p>{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Invoices ({invoices?.length ?? 0})</CardTitle>
            <Button size="sm" asChild><Link href="/invoices/new">+ New Invoice</Link></Button>
          </CardHeader>
          <CardContent>
            {!invoices?.length ? (
              <p className="text-sm text-muted-foreground">No invoices for this project.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Due {inv.due_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">${inv.total.toLocaleString()}</span>
                        <Badge variant={invoiceStatusVariant[inv.status] ?? 'secondary'}>{inv.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Time Entries ({timeEntries?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {!timeEntries?.length ? (
            <p className="text-sm text-muted-foreground">No time logged yet.</p>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{entry.description || 'No description'}</p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={entry.billable ? 'default' : 'secondary'}>
                      {entry.billable ? 'Billable' : 'Non-billable'}
                    </Badge>
                    <span className="font-semibold text-sm">{entry.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
