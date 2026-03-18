'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencySelect } from '@/components/ui/currency-select'
import { ExternalLink, Paperclip, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

type Project = { id: string; name: string }
type Expense = {
  id: string
  description: string
  amount: number
  date: string
  category?: string | null
  project_id?: string | null
  receipt_url?: string | null
  currency: string
}

export function EditExpenseDialog({ expense, projects }: { expense: Expense; projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState(expense.category ?? 'other')
  const [projectId, setProjectId] = useState(expense.project_id ?? '')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetReceipt() {
    setReceiptFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    let receipt_url = expense.receipt_url ?? null
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

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.get('description'),
          amount: Number(form.get('amount')),
          date: form.get('date'),
          category,
          project_id: projectId || null,
          currency: form.get('currency') || expense.currency,
          receipt_url,
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
      resetReceipt()
      toast.success('Expense updated successfully')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setError(null); resetReceipt() } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input name="description" defaultValue={expense.description} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={expense.amount} required />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input name="date" type="date" defaultValue={expense.date} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <CurrencySelect name="currency" defaultValue={expense.currency} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <div className="space-y-1.5">
            <Label>Receipt</Label>
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
                <button type="button" onClick={resetReceipt}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : expense.receipt_url ? (
              <div className="flex items-center gap-2">
                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" />View current receipt
                </a>
                <span className="text-muted-foreground text-xs">·</span>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />Replace
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />Attach receipt
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
