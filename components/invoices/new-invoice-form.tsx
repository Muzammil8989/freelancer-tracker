'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'

type Client = { id: string; name: string }
type Project = { id: string; name: string }

type LineItem = { description: string; quantity: number; unit_price: number }

export function NewInvoiceForm({ clients, projects }: { clients: Client[]; projects: Project[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [taxRate, setTaxRate] = useState(0)

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const invoiceItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
    }))

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.get('client_id') || null,
          project_id: form.get('project_id') || null,
          invoice_number: form.get('invoice_number'),
          issue_date: form.get('issue_date'),
          due_date: form.get('due_date'),
          notes: form.get('notes'),
          status: 'draft',
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          items: invoiceItems,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Failed to create invoice')
        return
      }

      toast.success('Invoice created')
      router.push('/invoices')
      router.refresh()
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Invoice Number *</Label>
            <Input name="invoice_number" placeholder="INV-001" defaultValue={`INV-${Date.now().toString().slice(-4)}`} required />
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select name="client_id">
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Issue Date *</Label>
            <Input name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="space-y-1.5">
            <Label>Due Date *</Label>
            <Input name="due_date" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select name="project_id">
              <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
            <span className="col-span-5">Description</span>
            <span className="col-span-2">Qty</span>
            <span className="col-span-3">Price</span>
            <span className="col-span-2 text-right">Amount</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input className="col-span-5" placeholder="Description" value={item.description}
                onChange={e => updateItem(i, 'description', e.target.value)} required />
              <Input className="col-span-2" type="number" min="0.01" step="0.01" value={item.quantity}
                onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
              <Input className="col-span-3" type="number" min="0" step="0.01" placeholder="0.00" value={item.unit_price}
                onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} />
              <div className="col-span-2 flex items-center justify-end gap-1">
                <span className="text-sm font-medium">${(item.quantity * item.unit_price).toFixed(2)}</span>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Tax (%)</span>
              <Input className="w-24 h-7 text-right" type="number" min="0" max="100" step="0.1"
                value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea name="notes" placeholder="Payment terms, thank you note, etc." rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Invoice'}</Button>
      </div>
    </form>
  )
}
