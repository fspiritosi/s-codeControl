"use client"

import * as React from "react"
import { format, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerProps {
  date?: Date
  setDate?: (date: Date | undefined) => void
}

export function EnhancedDatePicker({ date, setDate }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [isOpen, setIsOpen] = React.useState(false)

  const years = Array.from({ length: 10 }, (_, i) => (selectedDate?.getFullYear() || new Date().getFullYear()) - 5 + i)
  const months = Array.from({ length: 12 }, (_, i) => i)

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    if (setDate) {
      setDate(newDate)
    }
  }

  const handleYearChange = (year: string) => {
    if (selectedDate) {
      handleDateChange(setYear(selectedDate, parseInt(year)))
    } else {
      handleDateChange(setYear(new Date(), parseInt(year)))
    }
  }

  const handleMonthChange = (month: string) => {
    if (selectedDate) {
      handleDateChange(setMonth(selectedDate, parseInt(month)))
    } else {
      handleDateChange(setMonth(new Date(), parseInt(month)))
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            " justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          onClick={() => setIsOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="grid grid-cols-2 gap-2 p-2 border-b">
          <Select
            value={selectedDate?.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedDate?.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {format(setMonth(new Date(), month), "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(newDate) => {
            handleDateChange(newDate)
            setIsOpen(false)
          }}
          month={selectedDate || undefined}
          onMonthChange={handleDateChange}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}