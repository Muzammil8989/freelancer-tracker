'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

type Project = { id: string; name: string }

export function LogTimeDialog({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/time-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: form.get('project_id'),
        description: form.get('description'),
        hours: Number(form.get('hours')),
        date: form.get('date'),
        billable: form.get('billable') === 'true',
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      toast.success('Time logged successfully')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Something went wrong')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Log Time</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="time-project">Project *</Label>
            <Select name="project_id" required>
              <SelectTrigger id="time-project"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="time-hours">Hours *</Label>
              <Input id="time-hours" name="hours" type="number" inputMode="decimal" step="0.25" min="0.25" placeholder="2.5" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time-date">Date *</Label>
              <DatePicker id="time-date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-description">Description</Label>
            <Input id="time-description" name="description" placeholder="What did you work on?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-billable">Billable</Label>
            <Select name="billable" defaultValue="true">
              <SelectTrigger id="time-billable"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Log Time'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
