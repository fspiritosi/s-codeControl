import React from 'react';
import { Button } from '@/components/ui/button';
import DailyReportForm from './DailyReportForm';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { date } from 'zod';

// interface FormRowProps {
//     id: number;
//     onDelete: (id: number) => void;
//     selectedDate: Date | null;
// }

interface FormRowProps {
    row: {
        id: number;
        fecha: string;
        cliente: string;
        servicio: string;
        item: string;
        empleados: string;
        equipos: string;
        horaInicio: string;
        horaFin: string;
    };
    onDelete: (id: number) => void;
    onUpdate: (id: number, updatedRow: any) => void;
    selectedDate: Date | null;
}

const FormRow: React.FC<FormRowProps> = ({ row, onDelete, onUpdate, selectedDate }) => { // Add 'onUpdate' to the destructured props
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onUpdate(row.id, { ...row, [name]: value });
    };

    return (
        <TableRow className='w-full border-collapse border'>
            <DailyReportForm selectedDate={selectedDate} row={row} onChange={handleChange} />
            <TableCell className="border text-center">
                <Button variant="default" onClick={() => onDelete(row.id)}>X</Button>
            </TableCell>
        </TableRow>
    );
};

export default FormRow;