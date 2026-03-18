import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NewInvoiceForm } from '@/components/invoices/new-invoice-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewInvoicePage() {
  const { userId } = await auth()
  if (!userId) return null

  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabaseAdmin.from('clients').select('id, name').eq('user_id', userId),
    supabaseAdmin.from('projects').select('id, name, hourly_rate, fixed_amount, type').eq('user_id', userId),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-2xl font-bold">New Invoice</h2>
      </div>
      <NewInvoiceForm clients={clients ?? []} projects={projects ?? []} />
    </div>
  )
}
