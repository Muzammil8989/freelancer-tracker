import { auth } from '@clerk/nextjs/server'
import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { ExportButton } from '@/components/export-button'
import { InvoicesDataTable } from '@/components/invoices/invoices-data-table'

const VALID_SORTS    = ['invoice_number', 'issue_date', 'due_date', 'total']
const VALID_ORDERS   = ['asc', 'desc']
const VALID_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) return null

  // Auto-mark overdue after response — non-blocking
  const today = new Date().toISOString().split('T')[0]
  after(async () => {
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lt('due_date', today)
  })

  const sp = await searchParams
  const search  = typeof sp.search   === 'string' ? sp.search.trim() : ''
  const page    = Math.max(1, parseInt(typeof sp.page     === 'string' ? sp.page     : '1',  10) || 1)
  const perPage = Math.min(100, Math.max(5, parseInt(typeof sp.per_page === 'string' ? sp.per_page : '10', 10) || 10))
  const sort    = VALID_SORTS.includes(sp.sort   as string) ? (sp.sort   as string) : 'issue_date'
  const order   = VALID_ORDERS.includes(sp.order as string) ? (sp.order  as string) : 'desc'
  const status  = VALID_STATUSES.includes(sp.status as string) ? (sp.status as string) : 'all'

  // Build filtered queries
  let countQ = supabaseAdmin.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  let dataQ  = supabaseAdmin.from('invoices').select('id, invoice_number, status, issue_date, due_date, total, clients(name)').eq('user_id', userId)

  if (search) {
    countQ = countQ.ilike('invoice_number', `%${search}%`)
    dataQ  = dataQ.ilike('invoice_number', `%${search}%`)
  }
  if (status !== 'all') {
    countQ = countQ.eq('status', status)
    dataQ  = dataQ.eq('status', status)
  }

  dataQ = dataQ.order(sort, { ascending: order === 'asc' }).range((page - 1) * perPage, page * perPage - 1)

  const [{ count }, { data: invoices }, { data: allInvoices }] = await Promise.all([
    countQ,
    dataQ,
    supabaseAdmin
      .from('invoices')
      .select('invoice_number, status, total, issue_date, due_date, subtotal, tax_amount, clients(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const totals = (allInvoices ?? []).reduce(
    (acc, i) => {
      if (i.status === 'paid') acc.paid += i.total
      else if (i.status === 'sent' || i.status === 'overdue') acc.pending += i.total
      return acc
    },
    { paid: 0, pending: 0 }
  )

  const exportData = (allInvoices ?? []).map(i => ({
    invoice_number: i.invoice_number,
    client:         (i.clients as unknown as { name: string } | null)?.name ?? '',
    status:         i.status,
    issue_date:     i.issue_date,
    due_date:       i.due_date ?? '',
    subtotal:       i.subtotal,
    tax_amount:     i.tax_amount,
    total:          i.total,
  }))

  const exportColumns = {
    invoice_number: 'Invoice #',
    client:         'Client',
    status:         'Status',
    issue_date:     'Issue Date',
    due_date:       'Due Date',
    subtotal:       'Subtotal',
    tax_amount:     'Tax',
    total:          'Total',
  }

  const isEmpty = !search && status === 'all' && (count ?? 0) === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            ${totals.paid.toLocaleString()} collected · ${totals.pending.toLocaleString()} pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="invoices" columns={exportColumns} />
          <Button asChild>
            <Link href="/invoices/new"><Plus className="h-4 w-4 mr-2" />New Invoice</Link>
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No invoices yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first invoice.</p>
            <Button asChild><Link href="/invoices/new"><Plus className="h-4 w-4 mr-2" />New Invoice</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <InvoicesDataTable
          data={invoices ?? []}
          totalCount={count ?? 0}
          page={page}
          perPage={perPage}
          search={search}
          sort={sort}
          order={order}
          status={status}
        />
      )}
    </div>
  )
}
