import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EarningsBarChart, ClientBarChart, ExpensesPieChart, TimePieChart } from '@/components/reports/charts'
import { DateRangeFilter } from '@/components/reports/date-range-filter'

function getRangeStart(range: string): string | null {
  const now = new Date()
  if (range === '30d') { now.setDate(now.getDate() - 30); return now.toISOString().split('T')[0] }
  if (range === '3m')  { now.setMonth(now.getMonth() - 3); return now.toISOString().split('T')[0] }
  if (range === '6m')  { now.setMonth(now.getMonth() - 6); return now.toISOString().split('T')[0] }
  if (range === 'year') { return `${now.getFullYear()}-01-01` }
  return null
}

const VALID_RANGES = ['30d', '3m', '6m', 'year', 'all']

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { userId } = await auth()
  if (!userId) return null

  const sp = await searchParams
  const range = VALID_RANGES.includes(sp.range as string) ? (sp.range as string) : '6m'
  const rangeStart = getRangeStart(range)

  let invoiceQ = supabaseAdmin.from('invoices').select('total, status, issue_date, clients(name)').eq('user_id', userId)
  let expenseQ  = supabaseAdmin.from('expenses').select('amount, category, date').eq('user_id', userId)
  let timeQ     = supabaseAdmin.from('time_entries').select('hours, billable, date').eq('user_id', userId)

  if (rangeStart) {
    invoiceQ = invoiceQ.gte('issue_date', rangeStart)
    expenseQ = expenseQ.gte('date', rangeStart)
    timeQ    = timeQ.gte('date', rangeStart)
  }

  const [{ data: invoices }, { data: expenses }, { data: timeEntries }] = await Promise.all([
    invoiceQ, expenseQ, timeQ,
  ])

  const byMonth: Record<string, number> = {}
  invoices?.filter(i => i.status === 'paid').forEach(inv => {
    const month = inv.issue_date.slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + inv.total
  })

  const byClient: Record<string, number> = {}
  invoices?.filter(i => i.status === 'paid').forEach(inv => {
    const name = (inv.clients as unknown as { name: string } | null)?.name ?? 'Unknown'
    byClient[name] = (byClient[name] ?? 0) + inv.total
  })

  const byCategory: Record<string, number> = {}
  expenses?.forEach(exp => {
    const cat = exp.category ?? 'other'
    byCategory[cat] = (byCategory[cat] ?? 0) + exp.amount
  })

  const totalEarned   = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0) ?? 0
  const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0
  const totalHours    = timeEntries?.reduce((s, e) => s + e.hours, 0) ?? 0
  const billableHours = timeEntries?.filter(e => e.billable).reduce((s, e) => s + e.hours, 0) ?? 0
  const netProfit     = totalEarned - totalExpenses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Financial overview of your freelance business</p>
        </div>
        <DateRangeFilter current={range} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Earned',   value: `$${totalEarned.toLocaleString()}`,  color: 'text-green-600' },
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, color: 'text-red-500'   },
          { label: 'Net Profit',     value: `$${netProfit.toLocaleString()}`,     color: netProfit >= 0 ? 'text-blue-600' : 'text-destructive' },
          { label: 'Total Hours',    value: `${totalHours.toFixed(1)}h`,          color: '' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Earnings by Month</CardTitle></CardHeader>
          <CardContent>
            <EarningsBarChart data={Object.entries(byMonth).sort().map(([month, amount]) => ({ month, amount }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Earnings by Client</CardTitle></CardHeader>
          <CardContent>
            <ClientBarChart data={Object.entries(byClient).sort((a, b) => b[1] - a[1]).map(([client, amount]) => ({ client, amount }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            <ExpensesPieChart data={Object.entries(byCategory).map(([category, amount]) => ({ category, amount }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Time Breakdown</CardTitle></CardHeader>
          <CardContent>
            <TimePieChart data={{ billable: billableHours, nonBillable: totalHours - billableHours }} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
