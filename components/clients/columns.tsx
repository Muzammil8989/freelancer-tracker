'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Eye, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SortHeader } from '@/components/ui/sort-header'
import { EditClientDialog } from '@/components/clients/edit-client-dialog'
import { DeleteButton } from '@/components/delete-button'
import Link from 'next/link'

export type Client = {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  currency: string
  address?: string | null
  projects?: { count: number }[]
}

type SortParams = { sort: string; order: string; onSort: (col: string) => void }

export function makeColumns({ sort, order, onSort }: SortParams): ColumnDef<Client>[] {
  return [
    {
      accessorKey: 'name',
      header: () => <SortHeader label="Name" col="name" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => {
        const client = row.original
        return (
          <Link href={`/clients/${client.id}`} className="flex items-center gap-3 hover:underline">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm leading-none">{client.name}</p>
              {client.company ? <p className="text-xs text-muted-foreground mt-0.5">{client.company}</p> : null}
            </div>
          </Link>
        )
      },
    },
    {
      accessorKey: 'email',
      header: () => <SortHeader label="Email" col="email" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) =>
        row.original.email ? (
          <a href={`mailto:${row.original.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {row.original.email}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {row.original.phone}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      accessorKey: 'currency',
      header: () => <SortHeader label="Currency" col="currency" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => <Badge variant="secondary">{row.original.currency}</Badge>,
    },
    {
      id: 'projects',
      header: 'Projects',
      cell: ({ row }) => {
        const count = (row.original.projects as { count: number }[] | undefined)?.[0]?.count ?? 0
        return <span className="text-sm text-muted-foreground">{count}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
            <Link href={`/clients/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <EditClientDialog client={row.original} />
          <DeleteButton id={row.original.id} resource="clients" />
        </div>
      ),
    },
  ]
}
