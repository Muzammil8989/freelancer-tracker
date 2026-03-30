"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  name?: string
  id?: string
  defaultValue?: string // ISO date YYYY-MM-DD
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  name,
  id,
  defaultValue,
  placeholder = "Pick a date",
  disabled,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? parseISO(defaultValue) : undefined
  )
  const [open, setOpen] = useState(false)

  const isoValue = date ? format(date, "yyyy-MM-dd") : ""

  return (
    <>
      {name && <input type="hidden" name={name} value={isoValue} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
            {date ? format(date, "MMM d, yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
