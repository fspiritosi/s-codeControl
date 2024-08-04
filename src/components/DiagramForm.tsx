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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"


import { Label } from "./ui/label"
import { z } from "zod";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Card, CardContent, CardTitle } from "./ui/card"





const datosDumy = [
    {
        employee: '40ebb1da-d1cc-4627-a54d-be0d63e55cf1',
        event_diagram: '8f33d1ff-e337-4472-b9c5-0404550c07f9',
        day: 1,
        month: 8,
        year: 2024

    },
    {
        employee: '40ebb1da-d1cc-4627-a54d-be0d63e55cf1',
        event_diagram: '8f33d1ff-e337-4472-b9c5-0404550c07f9',
        day: 6,
        month: 8,
        year: 2024

    }
]



export function DiagramForm({activeEmploees, diagrams_types}:{activeEmploees:[], diagrams_types:[]}) {
    const [fromDate, setFromDate] = useState<Date | undefined>()
    const [toDate, setToDate] = useState<Date | undefined>()
    const [duration, setDuration] = useState<number>(0);
    const [succesDiagrams, setSuccesDiagrams] = useState<DiagramaToCreate[]>([])
    const [errorsDiagrams, setErrorsDiagrams] = useState<ErrorToCreate[]>([])
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

    type DiagramaToCreate = {
            employee:string,
            employee_name:string,
            event_diagram: string,
            event_diagram_name:string,
            day: number,
            month: number,
            year: number

    }
     type ErrorToCreate = {
            employee:string,
             employee_name:string,
            event_diagram: string,
            event_diagram_name:string,
            day: number,
            month: number,
            year: number,
            prev_event?: string
    }

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
        const tipoDeDiagrama:any = diagrams_types.find((d:any) => d.id  === data.event_diagram)
        const employee:any = activeEmploees.find((e:any) => e.id === data.employee)

       toast.promise(async () => {
        const valueToSend = JSON.stringify(values)
        const response = await fetch(`${URL}/api/employees/diagrams`, {method: 'POST', body:valueToSend})
        return response
        }, {
            loading: "Cargando...",
            success: `Se creo la novedad de ${tipoDeDiagrama?.name} para el empleado ${employee.full_name}`,
            error: "No se pudo crear la novedad"
        })
    }

        async function onSubmit2(values: Diagram){
        const data = values;
        const tipoDeDiagrama:any = diagrams_types.find((d:any) => d.id  === data.event_diagram)
        const employee:any = activeEmploees.find((e:any) => e.id === data.employee)

           const diagramasToCreate: DiagramaToCreate[] = []
            const errorToCreate: ErrorToCreate[] = []
    

            //función para armar dia por día.

        for(let i = values.initial_date; i <= values.finaly_date; i.setDate(i.getDate()+1)){
            let element = {
                 employee: values.employee,
                 employee_name: employee.full_name,
                 event_diagram:values.event_diagram,
                 event_diagram_name:tipoDeDiagrama.name,
                 day: i.getDate(),
                 month: i.getMonth() + 1,
                 year: i.getFullYear()
            }

            let checkExist = datosDumy.find((d:any) => d.employee === element.employee && d.year === element.year && d.month === element.month && d.day === element.day)
            if(checkExist){
                const prevEventName:any = diagrams_types.find((d:any) => d.id  === checkExist.event_diagram)
                let errorElement = {
                    ...element,
                     prev_event: prevEventName.name
                }
                errorToCreate.push(errorElement)
            }else{
                diagramasToCreate.push(element)
            }
            
        }


        console.log('success',diagramasToCreate)
        console.log('error',errorToCreate)
        setSuccesDiagrams(diagramasToCreate)
        setErrorsDiagrams(errorToCreate)
    //    toast.promise(async () => {
    //     const valueToSend = JSON.stringify(values)
    //     const response = await fetch(`${URL}/api/employees/diagrams`, {method: 'POST', body:valueToSend})
    //     return response
    //     }, {
    //         loading: "Cargando...",
    //         success: `Se creo la novedad de ${tipoDeDiagrama?.name} para el empleado ${employee.full_name}`,
    //         error: "No se pudo crear la novedad"
    //     })
    }

    return (
         <ResizablePanelGroup direction="horizontal" className="pt-6">
            <ResizablePanel>       
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit2)} className="space-y-8">
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
                        <Button className="mt-4" type="submit">Comprobar novedades</Button>
                    </form>
                </Form>
                </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="pl-6 min-w-[600px]" defaultSize={70}>
                {
                    succesDiagrams.length > 0 && 
                    <Card className="bg-green-100">
                        <CardTitle>Diagramas correctos</CardTitle>
                        <CardContent>
                            {succesDiagrams.map((d:DiagramaToCreate, index: number) => (
                                <div key={index} className="flex gap-4">
                                    <div>{d.employee_name}</div>
                                    <div>{d.event_diagram_name}</div>
                                    <div>{d.day}/{d.month}/{d.year}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                }
                {
                    errorsDiagrams.length > 0 && 
                    <Card className="bg-red-100">
                        <CardTitle>Diagramas duplicados</CardTitle>
                        <CardContent>
                            {errorsDiagrams.map((d:ErrorToCreate, index: number) => (
                                <div key={index} className="flex gap-4">
                                    <div>{d.employee_name}</div>
                                    <div>{d.day}/{d.month}/{d.year}</div>
                                    <div>nuevo</div>
                                    <div>{d.event_diagram_name}</div>
                                    <div>anterior</div>
                                    <div>{d.prev_event}</div>
                                    
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                }
            </ResizablePanel>
    </ResizablePanelGroup>

    )
}
