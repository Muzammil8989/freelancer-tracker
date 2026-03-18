import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Receipt } from 'lucide-react'
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog'
import { ExpensesDataTable } from '@/components/expenses/expenses-data-table'
import { ExportButton } from '@/components/export-button'

const VALID_SORTS = ['description', 'date', 'amount']
const VALID_ORDERS = ['asc', 'desc']
const VALID_CATEGORIES = ['software', 'hardware', 'travel', 'marketing', 'other']

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) return null

  const sp = await searchParams
  const search   = typeof sp.search   === 'string' ? sp.search.trim() : ''
  const page     = Math.max(1, parseInt(typeof sp.page     === 'string' ? sp.page     : '1',  10) || 1)
  const perPage  = Math.min(100, Math.max(5, parseInt(typeof sp.per_page === 'string' ? sp.per_page : '10', 10) || 10))
  const sort     = VALID_SORTS.includes(sp.sort as string)     ? (sp.sort     as string) : 'date'
  const order    = VALID_ORDERS.includes(sp.order as string)   ? (sp.order    as string) : 'desc'
  const category = VALID_CATEGORIES.includes(sp.category as string) ? (sp.category as string) : 'all'

  // Build filtered queries
  let countQ = supabaseAdmin.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  let dataQ  = supabaseAdmin.from('expenses').select('*, projects(name)').eq('user_id', userId)

  if (search)          { countQ = countQ.ilike('description', `%${search}%`); dataQ = dataQ.ilike('description', `%${search}%`) }
  if (category !== 'all') { countQ = countQ.eq('category', category);         dataQ = dataQ.eq('category', category) }

  const orderCol = sort === 'amount' ? 'amount' : sort === 'description' ? 'description' : 'date'
  dataQ = dataQ.order(orderCol, { ascending: order === 'asc' }).range((page - 1) * perPage, page * perPage - 1)

  const [{ count }, { data: expenses }, { data: projects }, { data: allExpenses }] = await Promise.all([
    countQ,
    dataQ,
    supabaseAdmin.from('projects').select('id, name').eq('user_id', userId),
    supabaseAdmin.from('expenses').select('amount, description, category, date, currency, projects(name)').eq('user_id', userId).order('date', { ascending: false }),
  ])

  const total = allExpenses?.reduce((s, e) => s + e.amount, 0) ?? 0

  const exportData = (allExpenses ?? []).map(e => ({
    description: e.description,
    category:    e.category ?? '',
    amount:      e.amount,
    currency:    e.currency,
    date:        e.date,
    project:     (e.projects as unknown as { name: string } | null)?.name ?? '',
  }))

  const exportColumns = {
    description: 'Description',
    category:    'Category',
    amount:      'Amount',
    currency:    'Currency',
    date:        'Date',
    project:     'Project',
  }

  const isEmpty = !search && category === 'all' && (count ?? 0) === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">${total.toLocaleString()} total spent</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} filename="expenses" columns={exportColumns} />
          <AddExpenseDialog projects={projects ?? []} />
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No expenses yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Track your business expenses.</p>
            <AddExpenseDialog projects={projects ?? []} />
          </CardContent>
        </Card>
      ) : (
        <ExpensesDataTable
          data={expenses ?? []}
          totalCount={count ?? 0}
          page={page}
          perPage={perPage}
          search={search}
          sort={sort}
          order={order}
          category={category}
          projects={projects ?? []}
        />
      )}
    </div>
  )
}
