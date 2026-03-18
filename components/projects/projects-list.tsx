'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { EditProjectDialog } from '@/components/projects/edit-project-dialog'
import { DeleteButton } from '@/components/delete-button'

type Client = { id: string; name: string }
type Project = {
  id: string
  name: string
  description?: string | null
  status: string
  type: string
  hourly_rate?: number | null
  fixed_amount?: number | null
  client_id?: string | null
  start_date?: string | null
  end_date?: string | null
  clients?: { name: string } | null
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUSES = ['all', 'active', 'paused', 'completed', 'cancelled']
const PAGE_SIZE = 9

export function ProjectsList({ projects, clients }: { projects: Project[]; clients: Client[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.clients as { name: string } | null)?.name.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No projects match your filters
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold leading-tight">{project.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
                          {project.status}
                        </span>
                        <EditProjectDialog project={project} clients={clients} />
                        <DeleteButton id={project.id} resource="projects" />
                      </div>
                    </div>
                    {project.clients && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {(project.clients as { name: string }).name}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{project.type}</Badge>
                      <span className="font-semibold text-primary">
                        {project.type === 'hourly' ? `$${project.hourly_rate}/hr` : `$${project.fixed_amount?.toLocaleString()}`}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} projects
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
