"use client";
import React from 'react'
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import EditModal from '../EditModal';
import { z } from 'zod';
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import DynamicTableWithForm from './Daily';

const dateSchema = z.date().nullable().refine(date => date !== null, {
    message: "Debe ingresar una fecha",
});

import DailyReportForm from './DailyReportForm';
import FormTable from './FormTable';

interface DynamicTableWithFormProps {

    selectedDate: Date | null;
  
  }

export default function CreateDailyReport(selectedDate: DynamicTableWithFormProps) {1
    const [openModal, setOpenModal] = useState(false)
    const [openModal1, setOpenModal1] = useState(false)
    const [date, setDate] = useState<Date | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    // const [selectedDate, setSelectedDate] = useState<Date | null>(null)


    const handleOpenModal = () => {
        setOpenModal(true)
    }

    const handleOpenModal1 = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const result = dateSchema.safeParse(date);
        if (!result.success) {
            setErrorMessage(result.error.errors[0].message);
            return;
        }
        
            setErrorMessage(null);
            setOpenModal1(true);
            setOpenModal(false);
        
        
    };

    const handleCancel = () => {
        setOpenModal(false);
        setErrorMessage(null);
        setDate(null);
    };
    return (
        <div>
            <Button variant='default' onClick={handleOpenModal}>Crear parte Diario</Button>
            {openModal && (
                <EditModal isOpen={openModal} onClose={() => setOpenModal(false)}>
                    <div className='w-full'>
                        <h1 className='mb-4'>Crear parte diario</h1>
                        <form>
                            <div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] justify-start text-left font-normal",
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
                                            selected={date ?? undefined}
                                            onSelect={(day) => setDate(day ?? null)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errorMessage && <span style={{ color: 'red', display: 'block', marginTop: '8px' }}>{errorMessage}</span>}
                            </div>
                            <Button variant='default' onClick={handleOpenModal1} className='mt-4 mr-2'>Crear</Button>
                            <Button variant='default' onClick={handleCancel} className='mt-4 ml-2'>Cancelar</Button>
                        </form>
                    </div>
                </EditModal>)}
            {openModal1 && (

                <EditModal isOpen={openModal1} onClose={() => setOpenModal1(false)}>
                    <div className='relative w-full max-w-[95vw] h-auto max-h-[87vh]'>
                        <button
                            className='absolute top-0 right-0 text-gray-500 hover:text-gray-700'
                            onClick={() => setOpenModal1(false)}
                        >
                            &times;
                        </button>
                        <div className='w-full h-auto max-h-[87vh] overflow-y-auto'>
                        
                        <DynamicTableWithForm selectedDate={date || null} />
                        </div>
                    </div>
                    <div className='flex justify-end'>
                        <Button variant='default' onClick={() => (setDate(null), setOpenModal1(false))}>Cancelar</Button>
                    </div>
                </EditModal>

            )}
        </div>
    )
}
