'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SortHeader } from '@/components/ui/sort-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { EditProjectDialog } from '@/components/projects/edit-project-dialog'
import { DeleteButton } from '@/components/delete-button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

export type Project = {
  id: string
  name: string
  status: string
  type: string
  hourly_rate?: number | null
  fixed_amount?: number | null
  start_date?: string | null
  end_date?: string | null
  description?: string | null
  client_id?: string | null
  clients?: { name: string } | null
}

type Client = { id: string; name: string }


const statusColor: Record<string, string> = {
  active:    'bg-primary text-primary-foreground',
  completed: 'bg-muted text-muted-foreground',
  paused:    'bg-background text-foreground border',
  cancelled: 'bg-destructive text-destructive-foreground',
}

function StatusCell({ project }: { project: Project }) {
  const [status, setStatus] = useState(project.status)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: string) {
    setSaving(true)
    const prev = status
    setStatus(newStatus)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setStatus(prev)
        toast.error('Failed to update status')
      } else {
        toast.success('Status updated')
        router.refresh()
      }
    } catch {
      setStatus(prev)
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <Select value={status} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger className="h-7 w-[120px] text-xs font-medium border-none shadow-none focus:ring-0 px-2 py-0.5 rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(['active', 'completed', 'paused', 'cancelled'] as const).map(s => (
            <SelectItem key={s} value={s}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s]}`}>
                {s}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type SortParams = { sort: string; order: string; onSort: (col: string) => void; clients: Client[] }

export function makeColumns({ sort, order, onSort, clients }: SortParams): ColumnDef<Project>[] {
  return [
    {
      accessorKey: 'name',
      header: () => <SortHeader label="Name" col="name" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => {
        const p = row.original
        return (
          <Link href={`/projects/${p.id}`} className="flex items-center gap-3 hover:underline">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <p className="font-medium text-sm">{p.name}</p>
          </Link>
        )
      },
    },
    {
      id: 'client',
      header: () => <SortHeader label="Client" col="client_id" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => {
        const name = (row.original.clients as { name: string } | null)?.name
        return name
          ? <span className="text-sm text-muted-foreground">{name}</span>
          : <span className="text-muted-foreground text-sm">—</span>
      },
    },
    {
      accessorKey: 'status',
      header: () => <SortHeader label="Status" col="status" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => <StatusCell project={row.original} />,
    },
    {
      accessorKey: 'type',
      header: () => <SortHeader label="Type" col="type" sort={sort} order={order} onSort={onSort} />,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      id: 'rate',
      header: 'Rate / Amount',
      cell: ({ row }) => {
        const p = row.original
        return p.type === 'hourly'
          ? <span className="text-sm">${p.hourly_rate ?? '—'}/hr</span>
          : <span className="text-sm">${(p.fixed_amount ?? 0).toLocaleString()}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
            <Link href={`/projects/${row.original.id}`}>
              <Eye className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <EditProjectDialog project={row.original} clients={clients} />
          <DeleteButton id={row.original.id} resource="projects" />
        </div>
      ),
    },
  ]
}
