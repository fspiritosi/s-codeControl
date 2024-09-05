'use client';
import React, { useState, useEffect } from 'react';
import cookies from 'js-cookie';
import EditModal from '../EditModal';
import { Button } from '@/components/ui/button';
import DynamicTableWithForm from './Daily';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function ViewDailysReports() {
  const [dailyReports, setDailyReports] = React.useState<{ dailyreportrows: any[] }[]>([]);

  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = cookies.get("actualComp");
  console.log(company_id);

  async function fetchReports() {
    const response = await fetch(`${URL}/api/daily-report/table?actual=${company_id}`);
    const data = await response.json();
    setDailyReports(data.dailyReports);
    console.log(data);
  }

  useEffect(() => {
    fetchReports();
  }, [company_id]);

  console.log(dailyReports);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [openModal1, setOpenModal1] = useState<boolean>(false);

  const handleStatusChange = (reportId: string, newStatus: string) => {
    // Aquí puedes agregar la lógica para actualizar el estado del reporte en tu backend
    console.log(`Report ID: ${reportId}, New Status: ${newStatus}`);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setOpenModal1(true);
  };

  return (
    <div>
      <h1>Aqui va la tabla con todos los partes diarios</h1>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {dailyReports?.map((report: any) => (
            <tr key={report.id}>
              <td>{new Date(report.date).toLocaleDateString()}</td>
              <td>
                <Select
                  value={report.status}
                  onValueChange={(value:any) => handleStatusChange(report.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td>
                <Button variant={'link'}  onClick={() => handleViewReport(report)}>
                  Ver Completo
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openModal1 && selectedReport && (
        <EditModal isOpen={openModal1} onClose={() => setOpenModal1(false)}>
          <div className='relative w-full max-w-[95vw] h-auto max-h-[87vh]'>
            <button
              className='absolute top-0 right-0 text-gray-500 hover:text-gray-700'
              onClick={() => setOpenModal1(false)}
            >
              &times;
            </button>
            <div className='w-full h-auto max-h-[87vh] overflow-y-auto'>
              <DynamicTableWithForm selectedDate={new Date(selectedReport.date)} reportData={selectedReport.dailyreportrows} />                            
              <p>Estado: {selectedReport.status}</p>            
            </div>
          </div>
          <div className='flex justify-end'>
            <Button variant='default' onClick={() => setOpenModal1(false)}>Cerrar</Button>
          </div>
        </EditModal>
      )}
    </div>
  );
};