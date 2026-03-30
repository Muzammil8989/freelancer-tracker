'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

type Client = { id: string; name: string }
type Project = {
  id: string
  name: string
  client_id?: string | null
  description?: string | null
  type: string
  status: string
  hourly_rate?: number | null
  fixed_amount?: number | null
  start_date?: string | null
  end_date?: string | null
}

export function EditProjectDialog({ project, clients }: { project: Project; clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState(project.type)
  const [status, setStatus] = useState(project.status)
  const [clientId, setClientId] = useState(project.client_id ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          client_id: clientId || null,
          description: form.get('description') || null,
          type,
          status,
          hourly_rate: form.get('hourly_rate') ? Number(form.get('hourly_rate')) : null,
          fixed_amount: form.get('fixed_amount') ? Number(form.get('fixed_amount')) : null,
          start_date: form.get('start_date') || null,
          end_date: form.get('end_date') || null,
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
      toast.success('Project updated successfully')
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
          onClick={e => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ep-name">Name *</Label>
            <Input id="ep-name" name="name" defaultValue={project.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {type === 'hourly' ? (
            <div className="space-y-1.5">
              <Label htmlFor="ep-hourly-rate">Hourly Rate ($)</Label>
              <Input id="ep-hourly-rate" name="hourly_rate" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={project.hourly_rate ?? ''} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="ep-fixed-amount">Fixed Amount ($)</Label>
              <Input id="ep-fixed-amount" name="fixed_amount" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={project.fixed_amount ?? ''} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ep-start-date">Start Date</Label>
              <DatePicker id="ep-start-date" name="start_date" defaultValue={project.start_date ?? undefined} placeholder="Pick start date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-end-date">End Date</Label>
              <DatePicker id="ep-end-date" name="end_date" defaultValue={project.end_date ?? undefined} placeholder="Pick end date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-description">Description</Label>
            <Textarea id="ep-description" name="description" defaultValue={project.description ?? ''} rows={3} />
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
