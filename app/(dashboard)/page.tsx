import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, FolderKanban, FileText, Receipt, TrendingUp, Users, Clock, ArrowUpRight, Plus, Zap } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { after } from 'next/server'
import Link from 'next/link'

type Invoice = {
  id: string
  invoice_number: string
  status: string
  total: number
  issue_date: string
  due_date: string | null
  clients: { name: string } | null
}

type TimeEntry = {
  id: string
  hours: number
  billable: boolean
  date: string
  description: string | null
  projects: { name: string } | null
}

type Expense = {
  id: string
  amount: number
  description: string | null
  category: string | null
  date: string
}

async function getDashboardData(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  after(async () => {
    await supabaseAdmin
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('user_id', userId)
      .eq('status', 'sent')
      .lt('due_date', today)
  })

  const [
    { data: invoices },
    { data: projects },
    { data: allExpenses },
    { data: clients },
    { data: recentTimeEntries },
  ] = await Promise.all([
    supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, status, total, issue_date, due_date, clients(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('projects').select('status').eq('user_id', userId),
    supabaseAdmin
      .from('expenses')
      .select('id, amount, description, category, date')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabaseAdmin.from('clients').select('id').eq('user_id', userId),
    supabaseAdmin
      .from('time_entries')
      .select('id, hours, billable, date, description, projects(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5),
  ])

  const typedInvoices = (invoices ?? []) as unknown as Invoice[]
  const typedExpenses = (allExpenses ?? []) as Expense[]
  const typedTime = (recentTimeEntries ?? []) as unknown as TimeEntry[]

  const { paidTotal, unpaidTotal, unpaidCount } = typedInvoices.reduce(
    (acc, i) => {
      if (i.status === 'paid') acc.paidTotal += i.total
      else if (i.status === 'sent' || i.status === 'overdue') {
        acc.unpaidTotal += i.total
        acc.unpaidCount++
      }
      return acc
    },
    { paidTotal: 0, unpaidTotal: 0, unpaidCount: 0 }
  )
  const totalExpenses = typedExpenses.reduce((s, e) => s + e.amount, 0)

  return {
    totalEarned: paidTotal,
    unpaidTotal,
    unpaidCount,
    activeProjects: projects?.filter(p => p.status === 'active').length ?? 0,
    totalProjects: projects?.length ?? 0,
    totalExpenses,
    netProfit: paidTotal - totalExpenses,
    totalClients: clients?.length ?? 0,
    recentInvoices: typedInvoices.slice(0, 6),
    recentExpenses: typedExpenses.slice(0, 5),
    recentTimeEntries: typedTime,
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const statusStyles: Record<string, string> = {
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  sent:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  draft:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  const data = await getDashboardData(userId)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const stats = [
    {
      title: 'Total Earned',
      value: '$' + data.totalEarned.toLocaleString(),
      icon: DollarSign,
      desc: 'From paid invoices',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Net Profit',
      value: '$' + data.netProfit.toLocaleString(),
      icon: TrendingUp,
      desc: 'After all expenses',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      valueColor: data.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-destructive',
    },
    {
      title: 'Outstanding',
      value: '$' + data.unpaidTotal.toLocaleString(),
      icon: FileText,
      desc: data.unpaidCount + ' unpaid invoice' + (data.unpaidCount !== 1 ? 's' : ''),
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
      badge: data.unpaidCount,
    },
    {
      title: 'Active Projects',
      value: String(data.activeProjects),
      icon: FolderKanban,
      desc: 'of ' + data.totalProjects + ' total',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      valueColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-0.5">{today}</p>
          <h2 className="text-2xl font-bold tracking-tight">{getGreeting()}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your freelance business at a glance.</p>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients"><Users className="h-3.5 w-3.5 mr-1.5" />Add Client</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/invoices/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Invoice</Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={'text-2xl font-bold ' + stat.valueColor}>{stat.value}</span>
                    {stat.badge != null && stat.badge > 0 ? (
                      <span className="text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                        {stat.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                </div>
                <div className={'p-2.5 rounded-xl ' + stat.iconBg}>
                  <stat.icon className={'h-4 w-4 ' + stat.iconColor} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content + sidebar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Invoices (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
              <Link href="/invoices">View all <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link href="/invoices/new">Create your first invoice</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {data.recentInvoices.map(inv => (
                  <Link key={inv.id} href={'/invoices/' + inv.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{inv.clients?.name ?? 'Unknown'}</span>
                        <span className={'text-xs px-2 py-0.5 rounded-full font-medium capitalize ' + (statusStyles[inv.status] ?? statusStyles.draft)}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{inv.invoice_number} · {formatDate(inv.issue_date)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm font-semibold">${inv.total.toLocaleString()}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'New Invoice', href: '/invoices/new', icon: FileText },
                { label: 'Log Time', href: '/time', icon: Clock },
                { label: 'Add Expense', href: '/expenses', icon: Receipt },
                { label: 'Add Client', href: '/clients', icon: Users },
              ].map(action => (
                <Link key={action.label} href={action.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground group">
                  <action.icon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                  {action.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Total Clients', value: data.totalClients, color: '' },
                { label: 'Total Expenses', value: '$' + data.totalExpenses.toLocaleString(), color: 'text-red-500' },
                { label: 'Unpaid Invoices', value: data.unpaidCount, color: data.unpaidCount > 0 ? 'text-amber-500' : '' },
                { label: 'Net Earnings', value: '$' + data.netProfit.toLocaleString(), color: data.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={'font-semibold ' + row.color}>{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Recent Time
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
              <Link href="/time">View all <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentTimeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No time entries yet</p>
            ) : (
              <div className="divide-y">
                {data.recentTimeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{entry.description ?? 'No description'}</p>
                      <p className="text-xs text-muted-foreground">{entry.projects?.name ?? 'No project'} · {formatDate(entry.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className={'text-xs px-1.5 py-0.5 rounded-full font-medium ' +
                        (entry.billable
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400')}>
                        {entry.billable ? 'Billable' : 'Non-bill.'}
                      </span>
                      <span className="text-sm font-bold w-8 text-right">{entry.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" /> Recent Expenses
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
              <Link href="/expenses">View all <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No expenses yet</p>
            ) : (
              <div className="divide-y">
                {data.recentExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{exp.description ?? 'Expense'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{exp.category ?? 'other'} · {formatDate(exp.date)}</p>
                    </div>
                    <span className="text-sm font-bold text-red-500 ml-3 shrink-0">${exp.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
