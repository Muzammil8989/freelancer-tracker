'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  currency: string
}

export function EditClientDialog({ client }: { client: Client }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email') || null,
          phone: form.get('phone') || null,
          company: form.get('company') || null,
          address: form.get('address') || null,
          currency: form.get('currency') || client.currency,
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
      toast.success('Client updated successfully')
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
        <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">Name *</Label>
            <Input id="ec-name" name="name" defaultValue={client.name} required autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-company">Company</Label>
            <Input id="ec-company" name="company" defaultValue={client.company ?? ''} autoComplete="organization" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-email">Email</Label>
            <Input id="ec-email" name="email" type="email" defaultValue={client.email ?? ''} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-phone">Phone</Label>
            <Input id="ec-phone" name="phone" type="tel" defaultValue={client.phone ?? ''} autoComplete="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-address">Address</Label>
            <Input id="ec-address" name="address" defaultValue={client.address ?? ''} placeholder="123 Main St, City, Country" autoComplete="street-address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-currency">Currency</Label>
            <CurrencySelect id="ec-currency" name="currency" defaultValue={client.currency} />
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
