'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, Search } from 'lucide-react'
import { EditExpenseDialog } from '@/components/expenses/edit-expense-dialog'
import { DeleteButton } from '@/components/delete-button'

type Project = { id: string; name: string }
type Expense = {
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

const categoryColors: Record<string, string> = {
  software: 'bg-blue-100 text-blue-700',
  hardware: 'bg-purple-100 text-purple-700',
  travel: 'bg-green-100 text-green-700',
  marketing: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

const CATEGORIES = ['all', 'software', 'hardware', 'travel', 'marketing', 'other']
const PAGE_SIZE = 10

export function ExpensesList({ expenses, projects }: { expenses: Expense[]; projects: Project[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        e.description.toLowerCase().includes(q) ||
        (e.projects as { name: string } | null)?.name.toLowerCase().includes(q)
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [expenses, search, categoryFilter])

  useEffect(() => { setPage(1) }, [search, categoryFilter])

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} expenses · ${total.toLocaleString()} total
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No expenses match your filters
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-sm">{expense.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(expense.projects as { name: string } | null)?.name ?? 'No project'} · {expense.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {expense.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[expense.category] ?? categoryColors.other}`}>
                        {expense.category}
                      </span>
                    )}
                    {expense.receipt_url && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="View receipt"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <span className="font-bold">${expense.amount.toLocaleString()}</span>
                    <EditExpenseDialog expense={expense} projects={projects} />
                    <DeleteButton id={expense.id} resource="expenses" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} expenses
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
