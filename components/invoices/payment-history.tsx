'use client'

import { DeleteButton } from '@/components/delete-button'
import { Badge } from '@/components/ui/badge'

const methodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  paypal: 'PayPal',
  stripe: 'Stripe',
  other: 'Other',
}

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_method: string | null
  notes: string | null
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium">${p.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{p.payment_date}</p>
            </div>
            {p.payment_method && (
              <Badge variant="secondary" className="text-xs">
                {methodLabels[p.payment_method] ?? p.payment_method}
              </Badge>
            )}
            {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
          </div>
          <DeleteButton id={p.id} resource="payments" />
        </div>
      ))}
    </div>
  )
}
