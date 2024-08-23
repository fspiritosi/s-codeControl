import React from 'react';
import { Button } from '@/components/ui/button';
import DailyReportForm from './DailyReportForm';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { date } from 'zod';

interface FormRowProps {
    id: number;
    onDelete: (id: number) => void;
    selectedDate: Date | null;
}

const FormRow: React.FC<FormRowProps> = ({ id, onDelete, selectedDate }) => {
    return (
        <TableRow className='w-full border-collapse border'>
                <DailyReportForm selectedDate={selectedDate} />
            <TableCell className="border text-center">
                <Button variant="default" onClick={() => onDelete(id)}>X</Button>
            </TableCell>
        </TableRow>
    );
};

export default FormRow;