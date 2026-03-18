'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Search } from 'lucide-react'
import { makeColumns, type Project } from './columns'

type Client = { id: string; name: string }

interface ProjectsDataTableProps {
  data: Project[]
  clients: Client[]
  totalCount: number
  page: number
  perPage: number
  search: string
  sort: string
  order: string
  status: string
}

export function ProjectsDataTable({
  data, clients, totalCount, page, perPage, search, sort, order, status,
}: ProjectsDataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(search)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (page !== 1) params.set('page', String(page))
      params.set('per_page', String(perPage))
      if (sort) params.set('sort', sort)
      if (order) params.set('order', order)
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || (value === 1 && key === 'page')) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }
      const qs = params.toString()
      startTransition(() => router.push(`${pathname}${qs ? `?${qs}` : ''}`))
    },
    [search, status, page, perPage, sort, order, pathname, router]
  )

  const handleSort = useCallback(
    (col: string) => {
      const newOrder = sort === col && order === 'asc' ? 'desc' : 'asc'
      updateParams({ sort: col, order: newOrder, page: 1 })
    },
    [sort, order, updateParams]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        updateParams({ search: value || undefined, page: 1 })
      }, 400)
    },
    [updateParams]
  )

  const columns = useMemo(
    () => makeColumns({ sort, order, onSort: handleSort, clients }),
    [sort, order, handleSort, clients]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: totalCount,
  })

  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, totalCount)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={status || 'all'}
          onValueChange={v => updateParams({ status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
          <Select value={String(perPage)} onValueChange={v => updateParams({ per_page: v, page: 1 })}>
            <SelectTrigger className="w-24 h-8 text-sm mr-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-md border transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? 'No results'
            : `Showing ${from}–${to} of ${totalCount.toLocaleString()} project${totalCount !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: 1 })} disabled={page <= 1 || isPending} title="First page">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: page - 1 })} disabled={page <= 1 || isPending} title="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3 tabular-nums">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: page + 1 })} disabled={page >= totalPages || isPending} title="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: totalPages })} disabled={page >= totalPages || isPending} title="Last page">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
