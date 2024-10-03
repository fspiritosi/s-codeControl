// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import FormRow from './FormRow';
// import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
// interface FormTableProps {

//     selectedDate: Date | null;

// }
// interface RowData {
//     id: number;
//     fecha: string;
//     cliente: string;
//     servicio: string;
//     item: string;
//     empleados: string;
//     equipos: string;
//     horaInicio: string;
//     horaFin: string;
// }
// const FormTable: React.FC<FormTableProps> = ({ selectedDate }) => {
//     const [rows, setRows] = useState<RowData[]>([]);
//     const [savedData, setSavedData] = useState<RowData[]>([]); // Estado para almacenar los datos guardados

//     const addRow = () => {
//         const newRow: RowData = {
//             id: rows.length + 1,
//             fecha: '',
//             cliente: '',
//             servicio: '',
//             item: '',
//             empleados: '',
//             equipos: '',
//             horaInicio: '',
//             horaFin: ''
//         };
//         setRows([...rows, newRow]);
//     };

//     const deleteRow = (id: number) => {
//         setRows(rows.filter(row => row.id !== id));
//     };

//     const updateRow = (id: number, updatedRow: RowData) => {
//         setRows(rows.map(row => (row.id === id ? updatedRow : row)));
//     };

//     const handleSave = () => {
//         setSavedData(rows); // 
//         console.log('Datos guardados:', rows);
//       //aqui va ña lógica para guardar los datos
//     };


//     console.log(savedData);

//     return (
//         <div className=' align-middle'>
//             <div className="flex justify-center">
//                 <h1>Parte diario</h1>
//             </div>
//             <div>
//                 <Table className='w-full border'>
//                     <TableHead>
//                         <TableRow className='w-full border-collapse border '>
//                             <TableCell className="border text-center min-w-[150px]">Fecha</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Cliente</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Servicio</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Item</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Empleados</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Equipos</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Hora Inicio</TableCell>
//                             <TableCell className="border text-left min-w-[150px]">Hora de Fin</TableCell>
//                             {/* <TableCell className="border border-gray-300 text-center min-w-[150px]">Acciones</TableCell> */}
//                         </TableRow>
//                         </TableHead>
//                     <TableBody className='w-full border-collapse border'>
//                         {rows.map(row => (
//                                 <FormRow key={row.id} row={row} onDelete={deleteRow} onUpdate={updateRow} selectedDate={selectedDate} />
//                         ))}
//                     </TableBody>
//                 </Table>
//                 <div className="w-full mt-4 flex justify-center">
//                     <Button variant="default" onClick={addRow}>+</Button>
//                 </div>
//                 <div className="w-full mt-4 flex justify-center">
//                     <Button variant="default" onClick={handleSave}>Guardar</Button>
//                 </div>

//             </div>
//         </div>
//     );
// };

// export default FormTable;