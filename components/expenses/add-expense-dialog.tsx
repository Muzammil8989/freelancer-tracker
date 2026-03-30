'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Paperclip, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/date-picker'

type Project = { id: string; name: string }

export function AddExpenseDialog({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetReceipt() {
    setReceiptFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    let receipt_url: string | null = null
    if (receiptFile) {
      const uploadForm = new FormData()
      uploadForm.append('file', receiptFile)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        toast.error(err.error ?? 'Receipt upload failed')
        setLoading(false)
        return
      }
      receipt_url = (await uploadRes.json()).url
    }

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.get('description'),
        amount: Number(form.get('amount')),
        date: form.get('date'),
        category: form.get('category'),
        project_id: form.get('project_id') || null,
        currency: form.get('currency') || 'USD',
        receipt_url,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      resetReceipt()
      toast.success('Expense added successfully')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Something went wrong')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetReceipt() }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description *</Label>
            <Input id="exp-description" name="description" placeholder="What was this expense for?" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount *</Label>
              <Input id="exp-amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder="0.00" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date *</Label>
              <DatePicker id="exp-date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-currency">Currency</Label>
            <CurrencySelect id="exp-currency" name="currency" defaultValue="USD" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Category</Label>
            <Select name="category" defaultValue="other">
              <SelectTrigger id="exp-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Project (optional)</Label>
            <Select name="project_id">
              <SelectTrigger><SelectValue placeholder="Link to project" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Receipt (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
            />
            {receiptFile ? (
              <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{receiptFile.name}</span>
                <button type="button" onClick={resetReceipt} aria-label="Remove receipt">
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />Attach receipt
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Expense'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
