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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
import { custom, z } from 'zod';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
const ItemsSchema = z.object({
    customer_id: z.string().min(1, { message: "Debe seleccionar un cliente" }),
    customer_service_id: z.string().min(1, { message: "Debe seleccionar un servicio" }),
    item_name: z.string().min(1, { message: "Debe ingresar el nombre del servicio" }),
    item_description: z.string().min(1, { message: "Debe ingresar una descripción del servicio" }),
    item_price: z.preprocess((val) => Number(val), z.number().min(0, { message: "Debe ingresar un precio válido" })),
    item_measure_units: z.string().min(1, { message: "Debe seleccionar la unidad de medida" }),

});
type customer = {
    id: string;
    name: string;
}
interface measure_unit {
    id: number;
    unit: string;
    simbol: string;
    tipo: string;
}
type Service = z.infer<typeof ItemsSchema>;
export default function ServiceItemsForm({ measure_units, customers, services, company_id }: { measure_units: measure_unit[], customers: customer[], services: Service[], company_id: string }) {
    const form = useForm<Service>({
        resolver: zodResolver(ItemsSchema),
        defaultValues: {
            customer_id: '',
            customer_service_id: '',
            item_name: '',
            item_description: '',
            item_price: 0,
            item_measure_units: '',
        },
    });
    const { reset } = form;
    const [selectedClient, setSelectedClient] = useState('');

    const filteredServices = services.filter(service => service.customer_id === selectedClient);
    
    const onSubmit = async (values: Service) => {

        const { customer_id } = values;

        const modified_company_id = company_id.replace(/"/g, '');
        const modified_editing_service_id = values.customer_service_id.replace(/"/g, '');

        const updatedValues = { ...values, customer_service_id: modified_editing_service_id };
        const data = JSON.stringify(updatedValues);

        try {
            const response = await fetch(`/api/services/items?actual=${modified_company_id}`, {
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
            toast.success('Item creado correctamente');
        } catch (error) {
            console.error('Error al crear el item:', error);
            toast.error('Error al crear el item');
        }

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
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedClient(value);
                            }} value={field.value} defaultValue=''>
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
                    name='customer_service_id'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Servicio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue=''>
                                <FormControl>
                                    <SelectTrigger className="w-[400px]">
                                        <SelectValue placeholder="Elegir Servicio" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredServices.map((service: any) => (
                                        <SelectItem value={service.id} key={service.id}>{service.service_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='item_name'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Item</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    {...field}
                                    className="input w-[400px]"
                                    placeholder="Nombre del item"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='item_description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripcion del Item</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    {...field}
                                    className="input w-[400px]"
                                    placeholder="Descripcion del item"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='item_price'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Precio del Item</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    className="input w-[400px]"
                                    placeholder="Precio del item"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name='item_measure_units'
                    render={({ field }) => {
                        return (
                            <FormItem>
                                <FormLabel>Unidad de Medida</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value); // Actualiza el valor en el formulario
                                   
                                }} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-[400px]">
                                            <SelectValue placeholder="Elegir unidad de medida" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {measure_units.map((measure: measure_unit) => (
                                            <SelectItem value={measure.id.toString()} key={measure.id}>
                                                {measure.unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>


                                </Select>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />



                <Button className="mt-4" type="submit">Cargar Item</Button>
            </form>
        </Form>
    );
}