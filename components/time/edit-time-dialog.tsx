'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

type Project = { id: string; name: string }
type TimeEntry = {
  id: string
  project_id?: string | null
  description?: string | null
  hours: number
  date: string
  billable: boolean
}

export function EditTimeDialog({ entry, projects }: { entry: TimeEntry; projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState(entry.project_id ?? '')
  const [billable, setBillable] = useState(String(entry.billable))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/time-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId || null,
          description: form.get('description') || null,
          hours: Number(form.get('hours')),
          date: form.get('date'),
          billable: billable === 'true',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        const msg = data.error ?? 'Something went wrong'
        setError(msg)
        toast.error(msg)
        return
      }
      setOpen(false)
      toast.success('Time entry updated successfully')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null) }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Time Entry</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="et-hours">Hours *</Label>
              <Input id="et-hours" name="hours" type="number" inputMode="decimal" step="0.25" min="0.25" defaultValue={entry.hours} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-date">Date *</Label>
              <DatePicker id="et-date" name="date" defaultValue={entry.date} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="et-description">Description</Label>
            <Input id="et-description" name="description" defaultValue={entry.description ?? ''} placeholder="What did you work on?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="et-billable">Billable</Label>
            <Select value={billable} onValueChange={setBillable}>
              <SelectTrigger id="et-billable"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
