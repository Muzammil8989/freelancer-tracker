import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { AddClientDialog } from '@/components/clients/add-client-dialog'
import { ClientsDataTable } from '@/components/clients/clients-data-table'
import { ExportButton } from '@/components/export-button'

const VALID_SORT_COLS = ['name', 'company', 'email', 'currency', 'created_at'] as const
type SortCol = typeof VALID_SORT_COLS[number]

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) return null

  const sp = await searchParams
  const page    = Math.max(1, Number(sp.page)     || 1)
  const perPage = Math.min(100, Math.max(1, Number(sp.per_page) || 10))
  const search  = typeof sp.search === 'string' ? sp.search.trim() : ''
  const sort    = (VALID_SORT_COLS as readonly string[]).includes(sp.sort as string)
                    ? (sp.sort as SortCol)
                    : 'created_at'
  const order   = sp.order === 'asc' ? 'asc' : 'desc'

  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  // ── Paginated query (table display) ──────────────────────────────────────
  let tableQuery = supabaseAdmin
    .from('clients')
    .select('*, projects(count)', { count: 'exact' })
    .eq('user_id', userId)

  if (search) {
    tableQuery = tableQuery.or(
      `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data: clients, count: totalCount } = await tableQuery
    .order(sort, { ascending: order === 'asc' })
    .range(from, to)

  // ── Full query for CSV export (no range) ──────────────────────────────────
  const { data: allClients } = await supabaseAdmin
    .from('clients')
    .select('name, company, email, phone, currency, address, created_at')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  const exportColumns = {
    name:       'Name',
    company:    'Company',
    email:      'Email',
    phone:      'Phone',
    currency:   'Currency',
    address:    'Address',
    created_at: 'Created At',
  }

  const total = totalCount ?? 0

  if (total === 0 && !search) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">0 total clients</p>
          </div>
          <AddClientDialog />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No clients yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Add your first client to get started.</p>
            <AddClientDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">{total.toLocaleString()} total client{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={allClients ?? []} filename="clients" columns={exportColumns} />
          <AddClientDialog />
        </div>
      </div>

      <ClientsDataTable
        data={clients ?? []}
        totalCount={total}
        page={page}
        perPage={perPage}
        search={search}
        sort={sort}
        order={order}
      />
    </div>
  )
}
