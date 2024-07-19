"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label"
import { z } from "zod";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function DiagramForm({activeEmploees}:{activeEmploees:[]}) {
    const [fromDate, setFromDate] = React.useState<Date | undefined>()
    const [toDate, setToDate] = React.useState<Date | undefined>()
    const [duration, setDuration] = React.useState<number>(0);

    React.useEffect(() => {
        if (fromDate && toDate) {
            const diferenciaMilisegundos = toDate.getTime() - fromDate.getTime();
            const milisegundosPorDia = 1000 * 60 * 60 * 24;
            const diferenciaDias = diferenciaMilisegundos / milisegundosPorDia;    
            setDuration(Math.ceil(diferenciaDias) + 1);
        } else {
            setDuration(0);
        }
    }, [fromDate && toDate]);

    const novedades = [
        {   
            id:"1",
            nombre: "Trabajando de Dia",
        },
        {   
            id:"2",
            nombre: "Trabajando de Noche",
        },
        {   
            id:"3",
            nombre: "Franco",
        },
        {   
            id:"4",
            nombre: "Licencia x maternidad",
            cantidad_de_dias: 90
        }
    ]

    const Diagram = z.object({
        employee: z.string(),
        event_diagram: z.string(),
        initial_date: z.date(),
        finaly_date: z.date(),
    })

    type Diagram = z.infer<typeof Diagram>;

    const form = useForm<Diagram>({
        resolver: zodResolver(Diagram),
        defaultValues:{
            employee:'',
            event_diagram: '',
            initial_date: new Date(),
            finaly_date: new Date()
        }
    })

    function onSubmit(values: Diagram){
        console.log(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField 
                    control={form.control}
                    name='employee'
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Empleado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-[400px]">
                                        <SelectValue placeholder="Elegir empleado" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {activeEmploees.map((e) => (
                                        <SelectItem value={e.id} key={e.id}>{e.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name='event_diagram'
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Novedad</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-[400px]">
                                        <SelectValue placeholder="Elegir novedad" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {novedades.map((n) => (
                                        <SelectItem value={n.id} key={n.id}>{n.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name='initial_date'
                    render={({field}) => (
                        <FormItem >
                            <div className="flex gap-4 items-center w-[400px] justify-between">
                                <FormLabel>Fecha de inicio</FormLabel>
                                <FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-[240px] pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? format(field.value, "PPP") : "Elegir fecha"}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date);
                                                    setFromDate(date);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>

                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField  
                    control={form.control}
                    name='finaly_date'
                    render={({field}) => (
                        <FormItem >
                            <div className="flex gap-4 items-center w-[400px] justify-between">
                            <FormLabel className="mr-4">Fecha de fin</FormLabel>
                            <FormControl className="w-[400px]">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? format(field.value, "PPP") : "Elegir fecha"}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setToDate(date);
                                            }}
                                            disabled={(date) =>
                                                date < fromDate!
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>

                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {
                    duration === 0  
                    ? <></> 
                    : duration === 1 
                    ? <div>
                        <Label>La novedad dura: {duration} día</Label>
                      </div>
                    : <div>
                        <Label>La novedad dura: {duration} días</Label>
                      </div>
                }
                <Button className="mt-4" type="submit">Cargar novedad</Button>
            </form>
        </Form>
    )
}
