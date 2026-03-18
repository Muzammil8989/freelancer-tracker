'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SortHeader({
  label, col, sort, order, onSort,
}: {
  label: string
  col: string
  sort: string
  order: string
  onSort: (col: string) => void
}) {
  const active = sort === col
  const Icon = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort(col)}>
      {label}
      <Icon className={`ml-2 h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
    </Button>
  )
}
