'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkPaid() {
    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Invoice marked as paid')
      router.refresh()
    } else {
      toast.error('Failed to update invoice')
    }
  }

  return (
    <Button onClick={handleMarkPaid} disabled={loading} variant="default">
      <CheckCircle className="h-4 w-4 mr-2" />
      {loading ? 'Updating...' : 'Mark as Paid'}
    </Button>
  )
}
