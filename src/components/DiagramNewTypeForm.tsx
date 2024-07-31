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
import { Input } from "./ui/input"

export function DiagramNewTypeForm() {

 

    const NewDiagramType = z.object({
        name: z.string().min(1,{message: "El nombre de la novedad no puede estar vacío"}),
        short_description: z.string().min(1,{message: "La descripción dorta no puede estar vacía"}),
        color: z.string().min(1,{message: "Por favor selecciona un color para la novedad"}),
       
    })

    type NewDiagramType = z.infer<typeof NewDiagramType>;

    const form = useForm<NewDiagramType>({
        resolver: zodResolver(NewDiagramType),
        defaultValues:{
            name:'',
            short_description:"",
            color:""
        }
    })

    async function onSubmit(values: NewDiagramType){
        
        const data = JSON.stringify(values);
        
        const response = await fetch(`http://localhost:3000/api/employees/diagrams/tipos`, {method: 'POST', body: data})
        return response
        
    }

    return (
        <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-[400px]">
                <FormField 
                    control={form.control}
                    name='name'
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Nombre de la novedad</FormLabel>
                            <Input  placeholder="Ingresa un nombre para la novedad"  {...field}/>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name='short_description'
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Descripción corta</FormLabel>
                            <Input  placeholder="Ingresa una descripción corta, ej: TD"  {...field}/>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name='color'
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Color</FormLabel>
                            <Input className=" max-w-20" placeholder="Elige un color"  type="color" {...field} />
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <Button className="mt-4" type="submit">Cargar novedad</Button>
            </form>
        </Form>
    )
}
