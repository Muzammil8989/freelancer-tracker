'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

type Client = { id: string; name: string }

export function AddProjectDialog({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('hourly')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        client_id: form.get('client_id') || null,
        description: form.get('description'),
        type: form.get('type'),
        hourly_rate: form.get('hourly_rate') ? Number(form.get('hourly_rate')) : null,
        fixed_amount: form.get('fixed_amount') ? Number(form.get('fixed_amount')) : null,
        currency: form.get('currency') || 'USD',
        start_date: form.get('start_date') || null,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      toast.success('Project created successfully')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Something went wrong')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name *</Label>
            <Input id="proj-name" name="name" placeholder="Project name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-client">Client</Label>
            <Select name="client_id">
              <SelectTrigger id="proj-client"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-type">Type</Label>
            <Select name="type" defaultValue="hourly" onValueChange={setType}>
              <SelectTrigger id="proj-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="fixed">Fixed Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === 'hourly' ? (
            <div className="space-y-1.5">
              <Label htmlFor="proj-hourly-rate">Hourly Rate ($)</Label>
              <Input id="proj-hourly-rate" name="hourly_rate" type="number" inputMode="decimal" step="0.01" placeholder="50.00" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="proj-fixed-amount">Fixed Amount ($)</Label>
              <Input id="proj-fixed-amount" name="fixed_amount" type="number" inputMode="decimal" step="0.01" placeholder="1000.00" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="proj-start-date">Start Date</Label>
            <DatePicker id="proj-start-date" name="start_date" placeholder="Pick start date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-description">Description</Label>
            <Textarea id="proj-description" name="description" placeholder="Brief description..." rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Project'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
