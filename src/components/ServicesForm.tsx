'use client'
import React, { useState } from 'react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {Input} from "@/components/ui/input";
import { toast } from 'sonner';
const ServiceSchema = z.object({
    customer_id: z.string().min(1, { message: "Debe seleccionar un cliente" }),
    service_name: z.string().min(1, { message: "Debe ingresar el nombre del servicio" }),
    service_price: z.preprocess((val) => Number(val), z.number().min(0, { message: "Debe ingresar un precio válido" })),
    service_start: z.date(),
    service_validity: z.date(),
});

type Service = z.infer<typeof ServiceSchema>;

export default function ServicesForm({ customers, company_id }: { customers: Service[], company_id: string }) {
    const form = useForm<Service>({
        resolver: zodResolver(ServiceSchema),
        defaultValues: {

            customer_id: '',
            service_name: '',
            service_price: 0,
            service_start: new Date(),
            service_validity: new Date(),
        },
    });
    const { reset} = form;
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [fromDate1, setFromDate1] = useState<Date | null>(null);

    const onSubmit = async (values: Service) => {
        
        const { customer_id } = values;

        const modified_company_id = company_id.replace(/"/g, '');

        const updatedValues = { ...values };
        const data = JSON.stringify(updatedValues);
        try {
            const response = await fetch(`/api/services?actual=${modified_company_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data,
            });
            if (!response.ok) {
                throw new Error('Error en la solicitud');
            }
            const result = await response.json();
        } catch (error) {
            console.error('Error al crear el servicio:', error);
            toast.error('Error al crear el servicio');
        }
        toast.success('Servicio creado correctamente');
        reset();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name='customer_id'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue=''>
                                <FormControl>
                                    <SelectTrigger className="w-[400px]">
                                        <SelectValue placeholder="Elegir cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customers.map((customer: any) => (
                                        <SelectItem value={customer.id} key={customer.id}>{customer.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='service_name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Servicio</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    {...field}
                                    className="input w-[400px]"
                                    placeholder="Nombre del servicio"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='service_price'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Precio del Servicio</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    className="input w-[400px]"
                                    placeholder="Precio del servicio"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='service_start'
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex gap-4 items-center w-[400px] justify-between">
                                <FormLabel>Inicio del Servicio</FormLabel>
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
                                                    setFromDate1(date || null);
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
                    name='service_validity'
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex gap-4 items-center w-[400px] justify-between">
                                <FormLabel>Validez del Servicio</FormLabel>
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
                                                    setFromDate(date || null);
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
                
                <Button className="mt-4" type="submit">Cargar Servicio</Button>
            </form>
        </Form>
    );
}