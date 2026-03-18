'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ExternalLink } from 'lucide-react'
import { SortHeader } from '@/components/ui/sort-header'
import { EditExpenseDialog } from '@/components/expenses/edit-expense-dialog'
import { DeleteButton } from '@/components/delete-button'

export type Expense = {
  id: string
  description: string
  amount: number
  currency: string
  date: string
  category?: string | null
  project_id?: string | null
  receipt_url?: string | null
  projects?: { name: string } | null
}

type Project = { id: string; name: string }

const categoryColors: Record<string, string> = {
  software:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  hardware:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  travel:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  marketing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  other:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}


type SortParams = { sort: string; order: string; onSort: (col: string) => void; projects: Project[] }

export function makeColumns({ sort, order, onSort, projects }: SortParams): ColumnDef<Expense>[] {
  return [
    {
      accessorKey: 'description',
      header: () => <SortHeader label="Description" col="description" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <p className="font-medium text-sm max-w-[220px] truncate">{row.original.description}</p>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const cat = row.original.category ?? 'other'
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${categoryColors[cat] ?? categoryColors.other}`}>
            {cat}
          </span>
        )
      },
    },
    {
      id: 'project',
      header: 'Project',
      cell: ({ row }) => {
        const name = (row.original.projects as { name: string } | null)?.name
        return <span className="text-sm text-muted-foreground">{name ?? '—'}</span>
      },
    },
    {
      accessorKey: 'date',
      header: () => <SortHeader label="Date" col="date" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {new Date(row.original.date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right"><SortHeader label="Amount" col="amount" sort={sort} order={order} onSort={onSort} /></div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-sm tabular-nums">
          ${row.original.amount.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          {row.original.receipt_url ? (
            <a
              href={row.original.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="View receipt"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <EditExpenseDialog expense={row.original} projects={projects} />
          <DeleteButton id={row.original.id} resource="expenses" />
        </div>
      ),
    },
  ]
}
