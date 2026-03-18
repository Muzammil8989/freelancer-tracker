'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const RANGES = [
  { label: 'Last 30 days',   value: '30d' },
  { label: 'Last 3 months',  value: '3m'  },
  { label: 'Last 6 months',  value: '6m'  },
  { label: 'This year',      value: 'year'},
  { label: 'All time',       value: 'all' },
]

export function DateRangeFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Select
      value={current}
      onValueChange={v => router.push(`${pathname}?range=${v}`)}
    >
      <SelectTrigger className="w-40 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGES.map(r => (
          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
