'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { EditTimeDialog } from '@/components/time/edit-time-dialog'
import { DeleteButton } from '@/components/delete-button'

type Project = { id: string; name: string }
type TimeEntry = {
  id: string
  description?: string | null
  hours: number
  date: string
  billable: boolean
  project_id?: string | null
  projects?: { name: string } | null
}

const BILLABLE_OPTIONS = ['all', 'billable', 'non-billable']

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end   = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `Week of ${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`
}

function WeekGroup({ weekKey, entries, projects }: { weekKey: string; entries: TimeEntry[]; projects: Project[] }) {
  const [open, setOpen] = useState(true)
  const totalHours  = entries.reduce((s, e) => s + e.hours, 0)
  const billableHrs = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0)

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{formatWeekLabel(weekKey)}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{billableHrs.toFixed(1)}h billable</span>
          <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h total</span>
        </div>
      </button>

      {open ? (
        <div className="divide-y">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{entry.description || 'No description'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(entry.projects as { name: string } | null)?.name ?? 'No project'}
                  {' · '}
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <Badge variant={entry.billable ? 'default' : 'secondary'} className="text-xs">
                  {entry.billable ? 'Billable' : 'Non-billable'}
                </Badge>
                <span className="font-bold text-base w-10 text-right">{entry.hours}h</span>
                <EditTimeDialog entry={entry} projects={projects} />
                <DeleteButton id={entry.id} resource="time-entries" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TimeList({ entries, projects }: { entries: TimeEntry[]; projects: Project[] }) {
  const [search, setSearch] = useState('')
  const [billableFilter, setBillableFilter] = useState('all')

  const filtered = useMemo(() => entries.filter(e => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      e.description?.toLowerCase().includes(q) ||
      (e.projects as { name: string } | null)?.name.toLowerCase().includes(q)
    const matchesBillable =
      billableFilter === 'all' ||
      (billableFilter === 'billable' && e.billable) ||
      (billableFilter === 'non-billable' && !e.billable)
    return matchesSearch && matchesBillable
  }), [entries, search, billableFilter])

  const grouped = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {}
    filtered.forEach(e => {
      const wk = getWeekKey(e.date)
      if (!map[wk]) map[wk] = []
      map[wk].push(e)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const totalHours = filtered.reduce((s, e) => s + e.hours, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description or project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {BILLABLE_OPTIONS.map(opt => (
            <Button key={opt} size="sm" variant={billableFilter === opt ? 'default' : 'outline'}
              onClick={() => setBillableFilter(opt)} className="capitalize">
              {opt}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {filtered.length} entries · {totalHours.toFixed(1)}h total
        </p>
      ) : null}

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No time entries match your filters</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([weekKey, weekEntries]) => (
            <WeekGroup key={weekKey} weekKey={weekKey} entries={weekEntries} projects={projects} />
          ))}
        </div>
      )}
    </div>
  )
}
