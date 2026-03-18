'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'

type Invoice = {
  id: string
  invoice_number: string
  status: string
  due_date: string
  total: number
  clients?: { name: string } | null
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default', draft: 'secondary', sent: 'outline', overdue: 'destructive', cancelled: 'secondary',
}

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']
const PAGE_SIZE = 10

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.clients as { name: string } | null)?.name.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
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
          No invoices match your filters
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold">{inv.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {(inv.clients as { name: string } | null)?.name ?? 'No client'} · Due {inv.due_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">${inv.total.toLocaleString()}</span>
                      <Badge variant={statusVariant[inv.status] ?? 'secondary'}>{inv.status}</Badge>
                      <DeleteButton id={inv.id} resource="invoices" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} invoices
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
