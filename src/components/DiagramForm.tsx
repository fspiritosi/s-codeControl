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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"





const datosDumy = [

  {

    id: 'c47ebd53-8ad1-4234-9869-290d6abe7b45',
    created_at: '2024-08-05T00:36:12.855782+00:00',
    employee_id: '40ebb1da-d1cc-4627-a54d-be0d63e55cf1',
    diagram_type: {
      id: 'cc16fa52-f27d-4cdc-b247-4f58822ead18',
      name: 'Trabajando Diurno',
      color: '#d95a9a',
      company_id: '0dd82eb6-67f9-477e-ae57-774f23c64f8c',
      created_at: '2024-07-19T18:26:03.52746+00:00',
      short_description: 'TD'
    },
    day: 1,
    month: 8,
    year: 2024,
    employees: {
      id: '40ebb1da-d1cc-4627-a54d-be0d63e55cf1',
      city: 1628,
      cuil: '20306456661',
      file: '1',
      email: 'fspiritosi@gmail.com',
      guild: null,
      phone: '02995810476',
      gender: 'Masculino',
      status: 'No avalado',
      street: 'Los Alpatacos',
      picture: 
        'https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/employee_photos/30645666.jpg?timestamp=1716408995938',
      category: null,
      lastname: 'Spiritosi',
      province: 17,
      covenants: null,
      firstname: 'Fabricio Ariel',
      is_active: true,
      birthplace: '1f8368c4-6b0e-471f-8b04-01ee790df666',
      company_id: '0dd82eb6-67f9-477e-ae57-774f23c64f8c',
      created_at: '2024-05-22T20:16:34.330468+00:00',
      nationality: 'Argentina',
      postal_code: '8325',
      allocated_to: [
        '5fb4c23f-c734-492e-ad76-1b744c8c26e2', '46d8dfbb-964f-4684-9cae-bf1e0b4547a3'
      ],
      normal_hours: '8',
      document_type: 'DNI',
      street_number: '721',
      marital_status: 'Divorciado',
      document_number: '30645666',
      affiliate_status: null,
      company_position: 'CEO',
      termination_date: null,
      type_of_contract: 'A tiempo indeterminado',
      workflow_diagram: 'f5d3b5f4-98aa-4656-912e-e9a3bf6479ff',
      date_of_admission: '2024-05-22',
      level_of_education: 'Terciario',
      hierarchical_position: 'c2cd410d-915c-490a-87be-d7df43fe6f61',
      reason_for_termination: null
    }
  },

  {

    id: '525507b8-58db-4072-87f4-5371da4c8f2d',

    created_at: '2024-08-05T00:38:12.020096+00:00',

    employee_id: '10615c85-5997-4ac4-be93-dc8e6b4bd2c0',

    diagram_type: {

      id: 'f684dd71-6c6d-42f7-9f8d-89c8f042a6c0',

      name: 'Franco',

      color: '#E92B2B',

      company_id: '0dd82eb6-67f9-477e-ae57-774f23c64f8c',

      created_at: '2024-07-19T18:26:28.693205+00:00',

      short_description: 'F'

    },

    day: 1,

    month: 8,

    year: 2024,

    employees: {

      id: '10615c85-5997-4ac4-be93-dc8e6b4bd2c0',

      city: 229,

      cuil: '20946469492',

      file: '11',

      email: 'yordani12yorda@gmail.com',

      guild: null,

      phone: '1123807219',

      gender: 'Masculino',

      status: 'No avalado',

      street: 'Tucuman',

      picture: 

        'https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/employee_photos/94646949.jpg?timestamp=1716410834910',

      category: null,

      lastname: 'Jimenez Vasquez',

      province: 2,

      covenants: null,

      firstname: 'Jose Jordany',

      is_active: true,

      birthplace: '40891050-2e81-427f-9f21-f60da2f78009',

      company_id: '0dd82eb6-67f9-477e-ae57-774f23c64f8c',

      created_at: '2024-05-22T20:47:12.708873+00:00',

      nationality: 'Extranjero',

      postal_code: '1879',

      allocated_to: [ '39a3a494-828c-4b82-b9f4-1e5db61dad40' ],

      normal_hours: '11',

      document_type: 'DNI',

      street_number: '1315',

      marital_status: 'Soltero',

      document_number: '94646949',

      affiliate_status: null,

      company_position: 'Boss',

      termination_date: null,

      type_of_contract: 'Período de prueba',

      workflow_diagram: 'f5d3b5f4-98aa-4656-912e-e9a3bf6479ff',

      date_of_admission: '2024-05-22',

      level_of_education: 'Secundario',

      hierarchical_position: '63289c7c-7d40-44aa-a06e-7f07905d5349',

      reason_for_termination: null

    }

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

            let checkExist = datosDumy.find((d:any) => d.employee_id === element.employee && d.year === element.year && d.month === element.month && d.day === element.day)
            if(checkExist){
                const prevEventName:any = diagrams_types.find((d:any) => d.id  === checkExist.diagram_type.id)
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
            <ResizablePanel className="pl-6 min-w-[600px] flex flex-col gap-4" defaultSize={70}>
                {
                    errorsDiagrams.length > 0 && 
                    <Card  className="bg-red-50" >
                        <CardHeader>
                       <CardTitle>Diagramas duplicados</CardTitle>
                        </CardHeader>
                        
                        <CardContent>
                             <Table>
                                    <TableHeader>
                                        <TableHead>Nombre Empleado</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Novedad Actual</TableHead>
                                        <TableHead>Novedad Registrada</TableHead>
                                        <TableHead></TableHead>
                                    </TableHeader>
                                    {errorsDiagrams.map((d:ErrorToCreate, index: number) => (
                                        <TableBody key={index}>
                                            <TableRow >
                                                <TableCell>{d.employee_name}</TableCell>
                                                <TableCell>{d.day}/{d.month}/{d.year}</TableCell>
                                                <TableCell>{d.event_diagram_name}</TableCell>
                                                <TableCell>{d.prev_event}</TableCell>
                                                <TableCell className="flex gap-2 justify-around">
                                                    <Button variant={'default'} >Actualizar</Button>
                                                    <Button variant={'link'} className="font-bold text-red-600">Descartar</Button>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                     ))}
                            </Table>
                        </CardContent>
                        {
                            errorsDiagrams.length > 1 && 
                        <CardFooter className="flex justify-around">
                            <Button variant={"default"}>Actualizar Todos</Button>
                             <Button variant={'link'} className="font-bold text-red-600">Descartar Todos</Button>
                        </CardFooter>
                        }
                    </Card>
                }
                {
                    succesDiagrams.length > 0 && 
                    <Card className="">
                        <CardHeader>
                        <CardTitle>Diagramas correctos</CardTitle>

                        </CardHeader>
                        <CardContent>
                            <Table>
                                    <TableHeader>
                                        <TableHead>Nombre Empleado</TableHead>
                                        <TableHead>Novedad</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead></TableHead>
                                    </TableHeader>
                                    {succesDiagrams.map((d:DiagramaToCreate, index: number) => (
                                        <TableBody key={index}>
                                            <TableRow >
                                                <TableCell>{d.employee_name}</TableCell>
                                                <TableCell>{d.event_diagram_name}</TableCell>
                                                <TableCell>{d.day}/{d.month}/{d.year}</TableCell>
                                                <TableCell className="flex gap-2 justify-around">
                                                    <Button variant={'success'}>Crear</Button>
                                                    <Button variant={'link'} className="font-bold text-red-600">Descartar</Button>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                     ))}
                            </Table>
                        </CardContent>
                        {
                            succesDiagrams.length > 1 && 
                        <CardFooter className="flex justify-around">
                            <Button variant={"success"}>Crear Todos</Button>
                            <Button variant={'link'} className="font-bold text-red-600">Descartar Todos</Button>
                        </CardFooter>
                        }
                    </Card>

                }

            </ResizablePanel>
        </ResizablePanelGroup>

    )
}
