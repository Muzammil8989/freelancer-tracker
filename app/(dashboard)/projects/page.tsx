import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { FolderKanban } from 'lucide-react'
import { AddProjectDialog } from '@/components/projects/add-project-dialog'
import { ProjectsDataTable } from '@/components/projects/projects-data-table'
import { ExportButton } from '@/components/export-button'

const VALID_SORT_COLS = ['name', 'status', 'type', 'client_id', 'created_at'] as const
type SortCol = typeof VALID_SORT_COLS[number]

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) return null

  const VALID_STATUSES = ['active', 'completed', 'paused', 'cancelled']

  const sp = await searchParams
  const page    = Math.max(1, Number(sp.page)     || 1)
  const perPage = Math.min(100, Math.max(1, Number(sp.per_page) || 10))
  const search  = typeof sp.search === 'string' ? sp.search.trim() : ''
  const sort    = (VALID_SORT_COLS as readonly string[]).includes(sp.sort as string)
                    ? (sp.sort as SortCol)
                    : 'created_at'
  const order   = sp.order === 'asc' ? 'asc' : 'desc'
  const status  = VALID_STATUSES.includes(sp.status as string) ? (sp.status as string) : ''

  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  // ── Paginated query ───────────────────────────────────────────────────────
  let tableQuery = supabaseAdmin
    .from('projects')
    .select('*, clients(name)', { count: 'exact' })
    .eq('user_id', userId)

  if (search) {
    tableQuery = tableQuery.ilike('name', `%${search}%`)
  }
  if (status) {
    tableQuery = tableQuery.eq('status', status)
  }

  const { data: projects, count: totalCount } = await tableQuery
    .order(sort, { ascending: order === 'asc' })
    .range(from, to)

  // ── Clients for edit dialog ───────────────────────────────────────────────
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)

  // ── Full query for CSV export ─────────────────────────────────────────────
  const { data: allProjects } = await supabaseAdmin
    .from('projects')
    .select('name, status, type, hourly_rate, fixed_amount, start_date, end_date, clients(name)')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  const exportData = (allProjects ?? []).map(p => ({
    name:         p.name,
    client:       (p.clients as unknown as { name: string } | null)?.name ?? '',
    status:       p.status,
    type:         p.type,
    hourly_rate:  p.hourly_rate ?? '',
    fixed_amount: p.fixed_amount ?? '',
    start_date:   p.start_date ?? '',
    end_date:     p.end_date ?? '',
  }))

  const exportColumns = {
    name:         'Name',
    client:       'Client',
    status:       'Status',
    type:         'Type',
    hourly_rate:  'Hourly Rate',
    fixed_amount: 'Fixed Amount',
    start_date:   'Start Date',
    end_date:     'End Date',
  }

  const total = totalCount ?? 0

  if (total === 0 && !search && !status) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
            <p className="text-muted-foreground">0 total projects</p>
          </div>
          <AddProjectDialog clients={clients ?? []} />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first project to start tracking work.</p>
            <AddProjectDialog clients={clients ?? []} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">{total.toLocaleString()} total project{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="projects" columns={exportColumns} />
          <AddProjectDialog clients={clients ?? []} />
        </div>
      </div>

      <ProjectsDataTable
        data={projects ?? []}
        clients={clients ?? []}
        totalCount={total}
        page={page}
        perPage={perPage}
        search={search}
        sort={sort}
        order={order}
        status={status}
      />
    </div>
  )
}
