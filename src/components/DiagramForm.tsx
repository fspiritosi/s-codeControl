"use client"




import {useEffect, useState} from "react"
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

import { Label } from "./ui/label"
import { z } from "zod";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { POST } from "@/app/api/send/route"

export function DiagramForm({activeEmploees, diagrams_types}:{activeEmploees:[], diagrams_types:[]}) {
    const [fromDate, setFromDate] = useState<Date | undefined>()
    const [toDate, setToDate] = useState<Date | undefined>()
    const [duration, setDuration] = useState<number>(0);
    const URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
        if (fromDate && toDate) {
            const diferenciaMilisegundos = toDate.getTime() - fromDate.getTime();
            const milisegundosPorDia = 1000 * 60 * 60 * 24;
            const diferenciaDias = diferenciaMilisegundos / milisegundosPorDia;    
            setDuration(Math.ceil(diferenciaDias) + 1);
        } else {
            setDuration(0);
        }
    }, [fromDate && toDate]);


    const Diagram = z.object({
        employee: z.string().min(1,{message: "Debe selecciónar un empleado"}),
        event_diagram: z.string().min(1,{message: "Debe selecciónar un tipo de novedad"}),
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

    async function onSubmit(values: Diagram){
        const data = values;
        const valueToSend = JSON.stringify(values)
        const response = await fetch(`${URL}/api/employees/diagrams`, {method: 'POST', body:valueToSend})
        return response
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
                                    {activeEmploees.map((e:any) => (
                                        <SelectItem value={e.id} key={e.id}>{e.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage/>
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
                                    {diagrams_types?.map((n:any) => (
                                        <SelectItem value={n.id} key={n.id}>{n.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage/>
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
                                                {field.value ? field.value.toLocaleDateString() : "Elegir fecha"}
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
                                            {field.value ? field.value.toLocaleDateString() : "Elegir fecha"}
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
