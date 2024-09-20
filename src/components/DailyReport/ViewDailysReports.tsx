'use client';

import React, { useState, useEffect } from 'react';
import cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DailyReport from './DailyReport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { format, formatDate, parse } from "date-fns"

interface DailyReportItem {
  id: string;
  date: string;
  customer: string | undefined;
  employees: string[];
  equipment: string[];
  services: string;
  item: string;
  start_time: string;
  end_time: string;
  status: 'pendiente'|'ejecutado' | 'cancelado' | 'reprogramado';
  description: string;
}

interface DailyReportData {
  id: string;
  date: string;
  status: 'abierto' | 'cerrado';
  dailyreportrows: DailyReportItem[];
}

export default function ViewDailysReports() {
  const [dailyReports, setDailyReports] = useState<DailyReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const company_id = cookies.get("actualComp");

  async function fetchReports() {
    setIsLoading(true);
    try {
      const response = await fetch(`${URL}/api/daily-report/table?actual=${company_id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data)
      setDailyReports(data.dailyReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes diarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [company_id]);
console.log(dailyReports);
  const transformDailyReports = (reports: any[]): DailyReportData[] => {
    return reports.map(report => ({
      id: report.id,
      date: report.date,
      status: 'abierto', // Asumiendo que todos los reportes están abiertos por defecto
      dailyreportrows: report.dailyreportrows.map((row:any) => ({
        id: row.id,
        date: report.date,
        customer: row.customer_id?.id,
        employees: row.dailyreportemployeerelations.map((rel:any) => rel.employee_id.id),
        equipment: row.dailyreportequipmentrelations.map((rel:any) => rel.equipment_id.id),
        services: row.service_id.id,
        item: row.item_id.id,
        start_time: row.start_time,
        end_time: row.end_time,
        status: 'pendiente', // Asumiendo que todos los items están ejecutados por defecto
        description: '', // Asumiendo que no hay descripción disponible
      })),
    }));
  };
  const transformedReports = transformDailyReports(dailyReports);
console.log(transformedReports);

const handleStatusChange = async (reportId: string, newStatus: 'abierto' | 'cerrado') => {
  try {
    const statusPayload = newStatus === 'cerrado' ? false : newStatus;

    const response = await fetch(`${URL}/api/daily-report/?id=${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: statusPayload }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setDailyReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId ? { ...report, status: newStatus } : report
      )
    );

    toast({
      title: "Éxito",
      description: "El estado del reporte se ha actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    toast({
      title: "Error",
      description: "No se pudo actualizar el estado del reporte.",
      variant: "destructive",
    });
  }
};

  // const handleViewReport = async (report: DailyReportData) => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(`${URL}/api/daily-report/${report.id}?actual=${company_id}`);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
  //     const fullReportData = await response.json();
  //     console.log("Fetched report data:", fullReportData);
  //     setSelectedReport(fullReportData);
  //     setOpenModal(true);
  //   } catch (error) {
  //     console.error("Error fetching report details:", error);
  //     toast({
  //       title: "Error",
  //       description: "No se pudieron cargar los detalles del reporte.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleViewReport = (report: DailyReportData) => {
    setIsLoading(true);
    try {
      const fullReportData = transformedReports.find(r => r.id === report.id);
      if (!fullReportData) {
        throw new Error("Report not found in the array");
      }
      console.log("Fetched report data:", fullReportData);
      setSelectedReport(fullReportData);
      setOpenModal(true);
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del reporte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
 console.log(selectedReport);

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedReport(null);
  };

  const handleSaveReport = async (updatedReport: DailyReportData) => {
    try {
      const response = await fetch(`${URL}/api/daily-report/${updatedReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedReport),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setDailyReports(prevReports =>
        prevReports.map(report =>
          report.id === updatedReport.id ? updatedReport : report
        )
      );

      handleCloseModal();
      toast({
        title: "Éxito",
        description: "El reporte se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el reporte.",
        variant: "destructive",
      });
    }
  };
  console.log(dailyReports);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todos los Partes Diarios</h1>
      {isLoading ? (
        <div className="text-center">Cargando...</div>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Fecha</th>
              <th className="border border-gray-300 p-2">Estado</th>
              <th className="border border-gray-300 p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dailyReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{report.date}</td>
                <td className="border border-gray-300 p-2">
                  <Select
                    value={report.status}
                    onValueChange={(value: 'abierto' | 'cerrado') => handleStatusChange(report.id, value)}
                    disabled={report.status === 'cerrado'}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abierto">Abierto</SelectItem>
                      <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="border border-gray-300 p-2">
                  <Button variant="outline" onClick={() => handleViewReport(report)} disabled={isLoading}>
                    Ver Completo
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Reporte Diario</DialogTitle>
            <DialogDescription>
              Fecha: {selectedReport?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            {selectedReport ? (
              <DailyReport reportData={selectedReport} />
            ) : (
              <div className="text-center">Cargando detalles del reporte...</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cerrar</Button>
            {/* <Button onClick={() => selectedReport && handleSaveReport(selectedReport)}>Guardar Cambios</Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}