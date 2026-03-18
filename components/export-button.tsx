'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

type Row = Record<string, string | number | boolean | null | undefined>

interface ExportButtonProps {
  data: Row[]
  filename: string
  columns?: Record<string, string>
}

function applyColumns(data: Row[], columns?: Record<string, string>): Row[] {
  if (!columns) return data
  return data.map(row => {
    const mapped: Row = {}
    for (const [key, label] of Object.entries(columns)) {
      mapped[label] = row[key]
    }
    return mapped
  })
}

function toCSV(data: Row[]): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h]
      const str = val == null ? '' : String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export function ExportButton({ data, filename, columns }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  function downloadCSV() {
    const csv = toCSV(applyColumns(data, columns))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(applyColumns(data, columns))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31))
    XLSX.writeFile(wb, `${filename}.xlsx`)
    setOpen(false)
  }

  if (!data.length) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadCSV}>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadExcel}>
          Download Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
