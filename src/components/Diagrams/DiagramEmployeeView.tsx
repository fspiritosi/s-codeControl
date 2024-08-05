"use client"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format } from "date-fns"
import { es } from 'date-fns/locale';
import { DateRange } from "react-day-picker"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"


import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu"


type Checked = DropdownMenuCheckboxItemProps["checked"]
type DiamgramParsed = {
  name: string,
  lastName: string,
  diagram_type: string,
  date: string
}

function DiagramEmployeeView({diagrams, activeEmployees,  className}:{diagrams:any, activeEmployees:any, className?:React.HTMLAttributes<HTMLDivElement>}) {

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  })
  const [showStatusBar, setShowStatusBar] = useState<Checked>(true)
  const [selectEmployees, setSelectEmployees] = useState<string[]>([]);

  const fechaInicio = date?.from;
  const fechaFin = date?.to;

  function generarDiasEntreFechas({fechaInicio, fechaFin}:{fechaInicio?:Date, fechaFin?:Date}) {
      const dias = [];
      let fechaActual = new Date(fechaInicio!);
    
      while (fechaActual <= new Date(fechaFin!)) {
        dias.push(new Date(fechaActual));
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    
      return dias;
  }
  
  function filtrarEmpleados (id:string) {
    if(selectEmployees.length === 0) {
      selectEmployees.push(id)
    }
    if(selectEmployees.includes(id)){
      setSelectEmployees(selectEmployees.filter(em => em != id))
    }else[
      selectEmployees.push(id)
    ]
  }



const mes = generarDiasEntreFechas({fechaInicio,fechaFin})

  return (
    <div>
      <div className="py-2 w-full flex justify-around">
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Selecciona empleados</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            <DropdownMenuLabel>Empleados</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeEmployees.map((e:any) => (
              <DropdownMenuCheckboxItem
              key={e.id}
              checked={showStatusBar}
              onCheckedChange={setShowStatusBar}  
            >
            {e.full_name}
            </DropdownMenuCheckboxItem>
            ))}
            
          </DropdownMenuContent>
        </DropdownMenu>
      </>
      <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyyy", { locale: es })} -{" "}
                  {format(date.to, "dd/MM/yyyyy", { locale: es })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyyy", { locale: es })
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      </div>
      </div>
      <Table>
        <TableHeader>
        <TableHead >Empleado</TableHead>
          {mes.map((d, index) => (<TableHead key={index} className="text-center">{(d.getDate()) + '/' + (d.getMonth() + 1) }</TableHead>))}
        </TableHeader>

        <TableBody>
          {diagrams.map((d:any, index:number) => (
            <TableRow key={index}>
              <TableCell>{d.employees.lastname}, {d.employees.firstname}</TableCell>
              {mes.map(day => {
                const diagram = diagrams.find((d:any )=> d.day === day.getDate() && d.month === (day.getMonth()+1) && d.year === day.getFullYear())  
                return <TableCell key={index} className='text-center border' style={{ backgroundColor: diagram?.diagram_type.color }}>{diagram?.diagram_type.short_description}</TableCell>
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
    </div>
  )
}

export default DiagramEmployeeView








