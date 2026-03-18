'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const segmentLabels: Record<string, string> = {
  clients: 'Clients',
  projects: 'Projects',
  time: 'Time Tracking',
  invoices: 'Invoices',
  expenses: 'Expenses',
  reports: 'Reports',
  new: 'New',
}

function isId(segment: string) {
  return /^[0-9a-f-]{8,}$/i.test(segment) || /^\d+$/.test(segment)
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const items = [
    { label: 'Dashboard', href: '/' },
    ...segments.map((seg, i) => ({
      label: segmentLabels[seg] ?? (isId(seg) ? 'Details' : seg),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {!isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
