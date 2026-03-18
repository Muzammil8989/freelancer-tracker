export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export type Client = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  address: string | null
  currency: string
  created_at: string
}

export type Project = {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string | null
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  type: 'hourly' | 'fixed'
  hourly_rate: number | null
  fixed_amount: number | null
  currency: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

export type TimeEntry = {
  id: string
  user_id: string
  project_id: string
  description: string | null
  hours: number
  date: string
  billable: boolean
  created_at: string
}

export type Invoice = {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes: string | null
  created_at: string
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export type Payment = {
  id: string
  user_id: string
  invoice_id: string | null
  amount: number
  payment_date: string
  payment_method: string | null
  notes: string | null
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  project_id: string | null
  category: string | null
  description: string
  amount: number
  currency: string
  date: string
  receipt_url: string | null
  created_at: string
}
