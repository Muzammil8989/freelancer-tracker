'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CurrencyOption = {
  code: string
  name: string
  flag: string
}

const FALLBACK: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
]

let cachedCurrencies: CurrencyOption[] | null = null

interface CurrencySelectProps {
  name?: string
  id?: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function CurrencySelect({ name, id, defaultValue = 'USD', value, onValueChange }: CurrencySelectProps) {
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(cachedCurrencies ?? FALLBACK)
  const [selected, setSelected] = useState(value ?? defaultValue)

  useEffect(() => {
    if (cachedCurrencies) return
    fetch('https://restcountries.com/v3.1/all?fields=currencies,flag')
      .then(r => r.json())
      .then((countries: Array<{ currencies?: Record<string, { name: string }>; flag: string }>) => {
        const map = new Map<string, CurrencyOption>()
        for (const country of countries) {
          if (!country.currencies) continue
          for (const [code, info] of Object.entries(country.currencies)) {
            if (!map.has(code)) {
              map.set(code, { code, name: info.name, flag: country.flag })
            }
          }
        }
        const sorted = Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
        cachedCurrencies = sorted
        setCurrencies(sorted)
      })
      .catch(() => {})
  }, [])

  const handleChange = (val: string) => {
    setSelected(val)
    onValueChange?.(val)
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={selected} />}
      <Select value={selected} onValueChange={handleChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {currencies.map(c => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span className="text-base">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-muted-foreground text-xs truncate">{c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
