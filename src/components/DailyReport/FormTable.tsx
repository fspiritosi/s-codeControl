import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FormRow from './FormRow';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
interface FormTableProps {

    selectedDate: Date | null;

}
const FormTable: React.FC<FormTableProps> = ({ selectedDate }) => {
    const [rows, setRows] = useState<number[]>([1]);

    const addRow = () => {
        setRows([...rows, rows.length + 1]);
    };

    const deleteRow = (id: number) => {
        setRows(rows.filter(row => row !== id));
    };

    return (
        <div className=' align-middle'>
            <div className="flex justify-center">
                <h1>Parte diario</h1>
            </div>
            <div>
                <Table className='w-full border'>
                    <TableHead>
                        <TableRow className='w-full border-collapse border '>
                            <TableCell className="border text-center min-w-[150px]">Fecha</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Cliente</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Servicio</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Item</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Empleados</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Equipos</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Hora Inicio</TableCell>
                            <TableCell className="border text-left min-w-[150px]">Hora de Fin</TableCell>
                            {/* <TableCell className="border border-gray-300 text-center min-w-[150px]">Acciones</TableCell> */}
                        </TableRow>
                        </TableHead>
                    <TableBody className='w-full border-collapse border'>
                        {rows.map(id => (
                                <FormRow key={id} id={id} onDelete={deleteRow} selectedDate={selectedDate} />
                        ))}
                    </TableBody>
                </Table>
                <div className="w-full mt-4 flex justify-center">
                    <Button variant="default" onClick={addRow}>+</Button>
                </div>

            </div>
        </div>
    );
};

export default FormTable;