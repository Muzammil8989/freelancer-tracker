import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from 'lucide-react'

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default', completed: 'secondary', paused: 'outline', cancelled: 'destructive',
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const { id } = await params
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('*, projects(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!client) notFound()

  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, status, total, issue_date')
    .eq('client_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          {client.company && <p className="text-muted-foreground">{client.company}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{client.email}</div>}
            {client.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.phone}</div>}
            {client.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{client.address}</div>}
            {client.company && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{client.company}</div>}
            <div className="pt-2 border-t"><span className="text-muted-foreground">Currency: </span><Badge variant="outline">{client.currency}</Badge></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Projects ({client.projects?.length ?? 0})</CardTitle>
            <Button size="sm" asChild><Link href="/projects">+ Add Project</Link></Button>
          </CardHeader>
          <CardContent>
            {!client.projects?.length ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="space-y-2">
                {client.projects.map((p: { id: string; name: string; status: string; type: string; hourly_rate?: number; fixed_amount?: number }) => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                      <span className="font-medium text-sm">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {p.type === 'hourly' ? `$${p.hourly_rate}/hr` : `$${p.fixed_amount}`}
                        </span>
                        <Badge variant={statusColors[p.status] ?? 'secondary'}>{p.status}</Badge>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Invoices ({invoices?.length ?? 0})</CardTitle>
          <Button size="sm" asChild><Link href="/invoices/new">+ New Invoice</Link></Button>
        </CardHeader>
        <CardContent>
          {!invoices?.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div>
                      <span className="font-medium text-sm">{inv.invoice_number}</span>
                      <span className="text-xs text-muted-foreground ml-2">{inv.issue_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">${inv.total.toLocaleString()}</span>
                      <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
