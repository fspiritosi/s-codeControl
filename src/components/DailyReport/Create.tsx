"use client";
import React from 'react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CalendarIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from "@/lib/utils"
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form'
import { format } from 'date-fns'
import { toast } from '@/components/ui/use-toast'
import cookies from 'js-cookie'
import DailyReport from './DailyReport';

interface FormData {
    date: string;
}




export default function Create() {
    const company_id = cookies.get('actualComp')
    const [openModal, setOpenModal] = useState(false);
    const [openModal1, setOpenModal1]= useState(false)
    const [date, setDate] = useState<Date | null>(null);
    const [existingReportId, setExistingReportId] = useState<string | null>(null)
    const formMethods = useForm<FormData>();
    const { handleSubmit, control, setValue, watch, reset } = formMethods
    const handleOpenModal = () => {
        setOpenModal(true);
    }
    const handleOpenModal1= () =>{
        setOpenModal1(true)
    }

    const handleCloseModal = () => {
        setOpenModal(false);
    }
    
    const handleCloseModal1=() =>{
        setOpenModal1(false)
    }
    const  saveDate = async (date: string) => {
        
        const existingReportResponse = await fetch(`/api/daily-report/check-date/?date=${date}&company_id=${company_id}`);
            const existingReportData = await existingReportResponse.json();

            if (existingReportData.exists) {
                toast({
                    title: "Error",
                    description: "Ya existe un parte diario para esta fecha.",
                    variant: "destructive",
                });
                return; // Exit the function if a report already exists
            }

            // Create a new daily report if it doesn't exist
            const dailyReportResponse = await fetch('/api/daily-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: date,
                    company_id: company_id,
                    status: true,
                }),
            });

            if (!dailyReportResponse.ok) {
                const errorText = await dailyReportResponse.text();
                throw new Error(`Error al crear el parte diario: ${errorText}`);
            }
            const { data: newDailyReport } = await dailyReportResponse.json();
            
            const dailyReportId = newDailyReport; // Asegúrate de que esto sea correcto
            console.log(dailyReportId[0].id);
            setExistingReportId(dailyReportId);

            setOpenModal(false);
            handleOpenModal1();
    }
    const onSubmit: SubmitHandler<FormData> = (data) => {
        saveDate(data.date);
    }
    console.log(date);
    return (
        <div>
            <Button onClick={handleOpenModal}>Crear Parte Diario</Button>
            {openModal && <div>
                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogContent className="max-w-[30vw] h-[40vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Parte Diario</DialogTitle>
                            <DialogDescription>
                                Seleccione la Fecha del nuevo parte diario
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-auto">
                            <Form {...formMethods}>
                                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">

                                    <FormField
                                        control={control}
                                        name='date'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}

                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !date && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {date ? format(date, "dd/MM/yyyy") : <span>Seleccione una fecha</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={date || undefined}
                                                            onSelect={(newDate) => {
                                                                if (newDate) {
                                                                    const formattedDate = format(newDate, "yyyy-MM-dd");
                                                                    setDate(newDate);
                                                                    field.onChange(formattedDate);
                                                                }
                                                            }}
                                                            initialFocus

                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseModal}>Cerrar</Button>
                            <Button disabled={!date} onClick={handleSubmit(onSubmit as any)}>
                                Crear
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>}
            {openModal1 && <div>
                <Dialog open={openModal1} onOpenChange={setOpenModal1}>
                    <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Parte Diario</DialogTitle>
                            <DialogDescription>
                               fecha: {date ? format(date, "dd/MM/yyyy") : ""}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-auto">
                            <DailyReport reportData={existingReportId as any}/>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseModal1}>Cerrar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>}
        </div>
    )
}
