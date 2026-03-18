'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SortHeader } from '@/components/ui/sort-header'
import { DeleteButton } from '@/components/delete-button'
import Link from 'next/link'

export type Invoice = {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string | null
  total: number
  clients?: { name: string } | null
}

const statusStyles: Record<string, string> = {
  paid:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  sent:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  draft:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

type SortParams = { sort: string; order: string; onSort: (col: string) => void }

export function makeColumns({ sort, order, onSort }: SortParams): ColumnDef<Invoice>[] {
  return [
    {
      accessorKey: 'invoice_number',
      header: () => <SortHeader label="Invoice #" col="invoice_number" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <Link href={`/invoices/${row.original.id}`} className="font-mono font-semibold text-sm hover:underline text-primary">
          {row.original.invoice_number}
        </Link>
      ),
    },
    {
      id: 'client',
      header: () => <SortHeader label="Client" col="client" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {(row.original.clients as { name: string } | null)?.name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[row.original.status] ?? statusStyles.draft}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'issue_date',
      header: () => <SortHeader label="Issued" col="issue_date" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(row.original.issue_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      accessorKey: 'due_date',
      header: () => <SortHeader label="Due" col="due_date" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => {
        const due = row.original.due_date
        if (!due) return <span className="text-muted-foreground text-sm">—</span>
        const isOverdue = row.original.status === 'overdue'
        return (
          <span className={`text-sm tabular-nums ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {new Date(due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )
      },
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-right"><SortHeader label="Total" col="total" sort={sort} order={order} onSort={onSort} /></div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-sm tabular-nums">
          ${row.original.total.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
            <Link href={`/invoices/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <DeleteButton id={row.original.id} resource="invoices" />
        </div>
      ),
    },
  ]
}
