import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.union([z.email('Invalid email'), z.literal(''), z.null()]).optional().transform(v => v || null),
  phone: z.string().max(30).optional().nullable().transform(v => v || null),
  company: z.string().max(100).optional().nullable().transform(v => v || null),
  address: z.string().max(300).optional().nullable().transform(v => v || null),
  currency: z.string().length(3).default('USD'),
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
  type: z.enum(['hourly', 'fixed']).default('hourly'),
  hourly_rate: z.number().positive().optional().nullable(),
  fixed_amount: z.number().positive().optional().nullable(),
  currency: z.string().length(3).default('USD'),
  client_id: z.union([z.string(), z.null()]).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  category: z.enum(['software', 'hardware', 'travel', 'marketing', 'other']).default('other'),
  currency: z.string().length(3).default('USD'),
  project_id: z.string().optional().nullable(),
  receipt_url: z.string().optional().nullable(),
})

export const timeEntrySchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  description: z.string().max(200).optional().nullable(),
  hours: z.number().positive('Hours must be positive').max(24, 'Cannot log more than 24 hours'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  billable: z.boolean().default(true),
})

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  client_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(500).optional().nullable(),
  subtotal: z.number().nonnegative().optional(),
  tax_rate: z.number().nonnegative().optional().nullable(),
  tax_amount: z.number().nonnegative().optional().nullable(),
  total: z.number().nonnegative(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    amount: z.number().positive(),
  })).min(1, 'At least one item is required'),
})

export const shareSchema = z.object({
  project_id: z.string().min(1, 'Project ID is required'),
  label: z.string().max(100).optional(),
})

export const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Amount must be positive'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  payment_method: z.enum(['bank_transfer', 'cash', 'check', 'credit_card', 'paypal', 'stripe', 'other']).default('bank_transfer'),
  notes: z.string().max(200).optional().nullable(),
})

// Partial schemas for PATCH (update) operations — all fields optional
export const clientPatchSchema = clientSchema.partial()
export const projectPatchSchema = projectSchema.partial()
export const expensePatchSchema = expenseSchema.partial()
export const timeEntryPatchSchema = timeEntrySchema.partial()
export const invoicePatchSchema = invoiceSchema.omit({ items: true }).partial()
export const paymentPatchSchema = paymentSchema.partial()

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { data: T } | { error: string; status: 400 } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const msg = result.error.issues.map((e: { message: string }) => e.message).join(', ')
    return { error: msg, status: 400 }
  }
  return { data: result.data }
}
