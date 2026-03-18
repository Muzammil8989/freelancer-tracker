import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RecordPaymentDialog } from '@/components/invoices/record-payment-dialog'
import { PaymentHistory } from '@/components/invoices/payment-history'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default', draft: 'secondary', sent: 'outline', overdue: 'destructive', cancelled: 'secondary',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return null

  const { id } = await params

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabaseAdmin
      .from('invoices')
      .select('*, clients(*), invoice_items(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single(),
    supabaseAdmin
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .eq('user_id', userId)
      .order('payment_date', { ascending: false }),
  ])

  if (!invoice) notFound()

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoice.total - totalPaid

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
              <Badge variant={statusVariant[invoice.status] ?? 'secondary'}>{invoice.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {(invoice.clients as { name: string } | null)?.name ?? 'No client'}
            </p>
          </div>
        </div>
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <RecordPaymentDialog
            invoiceId={invoice.id}
            invoiceTotal={remaining > 0 ? remaining : invoice.total}
          />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground">Issue Date</p><p className="font-medium">{invoice.issue_date}</p></div>
          <div><p className="text-muted-foreground">Due Date</p><p className="font-medium">{invoice.due_date}</p></div>
          <div><p className="text-muted-foreground">Client</p><p className="font-medium">{(invoice.clients as { name: string } | null)?.name ?? '—'}</p></div>
          <div><p className="text-muted-foreground">Status</p><Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground mb-2 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Amount</span>
          </div>
          {invoice.invoice_items?.map((item: { id: string; description: string; quantity: number; unit_price: number; amount: number }) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 py-2 border-t text-sm">
              <span className="col-span-6">{item.description}</span>
              <span className="col-span-2 text-right">{item.quantity}</span>
              <span className="col-span-2 text-right">${item.unit_price.toFixed(2)}</span>
              <span className="col-span-2 text-right font-medium">${item.amount.toFixed(2)}</span>
            </div>
          ))}
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
            {invoice.tax_rate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span><span>${invoice.tax_amount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>${invoice.total.toFixed(2)}</span></div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>-${totalPaid.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>Remaining</span><span>${remaining.toFixed(2)}</span></div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{invoice.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          <PaymentHistory payments={payments ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
