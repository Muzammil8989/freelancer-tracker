'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'

// ── Earnings by Month ──────────────────────────────────────────────────────

type MonthData = { month: string; amount: number }

export function EarningsBarChart({ data }: { data: MonthData[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No paid invoices yet.</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `$${Number(v).toLocaleString()}`} width={72} />
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Earnings']} />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Earnings by Client ─────────────────────────────────────────────────────

type ClientData = { client: string; amount: number }

export function ClientBarChart({ data }: { data: ClientData[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No paid invoices yet.</p>
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={v => `$${Number(v).toLocaleString()}`} />
        <YAxis type="category" dataKey="client" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={100} />
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Earnings']} />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Expenses by Category ───────────────────────────────────────────────────

const EXPENSE_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f97316', '#64748b']

type CategoryData = { category: string; amount: number }

function renderCategoryLabel({ name, percent }: PieLabelRenderProps) {
  if (percent == null) return null
  return `${name} ${(percent * 100).toFixed(0)}%`
}

export function ExpensesPieChart({ data }: { data: CategoryData[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
  const chartData = data.map(d => ({ name: d.category, amount: d.amount }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={renderCategoryLabel}
          labelLine={false}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Amount']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Time Breakdown ─────────────────────────────────────────────────────────

const TIME_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))']

type TimeData = { billable: number; nonBillable: number }

function renderTimeLabel({ name, percent }: PieLabelRenderProps) {
  if (percent == null) return null
  return `${name} ${(percent * 100).toFixed(0)}%`
}

export function TimePieChart({ data }: { data: TimeData }) {
  const pieData = [
    { name: 'Billable', value: data.billable },
    { name: 'Non-billable', value: data.nonBillable },
  ].filter(d => d.value > 0)

  if (!pieData.length) return <p className="text-sm text-muted-foreground">No time logged yet.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={renderTimeLabel}
          labelLine={false}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={TIME_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, '']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
