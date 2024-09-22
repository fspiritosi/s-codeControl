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
import { DatePicker } from '@/components/DailyReport/DatePicker'
import { FaAngleUp } from "react-icons/fa";
import { FaAngleDown } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { startOfMonth, endOfMonth } from 'date-fns';
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
  status: 'pendiente' | 'ejecutado' | 'cancelado' | 'reprogramado';
  description: string;
}

interface DailyReportData {
  id: string;
  date: string;
  status: boolean;
  dailyreportrows: DailyReportItem[];
}

export default function ViewDailysReports() {
  const [dailyReports, setDailyReports] = useState<DailyReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string, status: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'abierto' | 'cerrado' | 'todos'>('todos');

  useEffect(() => {
    const now = new Date();
    setStartDate(startOfMonth(now));
    setEndDate(endOfMonth(now));
  }, []);

  const handleSortChange = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };
  // const filteredReports = dailyReports.filter((report: any) => {
  //   const reportDate = new Date(report.date);
  //   return (!startDate || reportDate >= startDate) && (!endDate || reportDate <= endDate);
  // });
  const filteredReports = dailyReports.filter((report: any) => {
    console.log(report.status);
    const reportDate = new Date(report.date);
    const matchesDateRange = (!startDate || reportDate >= startDate) && (!endDate || reportDate <= endDate);
    const matchesStatus = statusFilter === 'todos' || (statusFilter === 'abierto' && report.status) || (statusFilter === 'cerrado' && !report.status);
    return matchesDateRange && matchesStatus;
  });

  const sortedReports = filteredReports.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page changes
  };
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
      status: report.status, // Asumiendo que todos los reportes están abiertos por defecto
      dailyreportrows: report.dailyreportrows.map((row: any) => ({
        id: row.id,
        date: report.date,
        customer: row.customer_id?.id,
        employees: row.dailyreportemployeerelations.map((rel: any) => rel.employee_id.id),
        equipment: row.dailyreportequipmentrelations.map((rel: any) => rel.equipment_id.id),
        services: row.service_id.id,
        item: row.item_id.id,
        start_time: row.start_time,
        end_time: row.end_time,
        status: row.status, // Asumiendo que todos los items están ejecutados por defecto
        description: row.description || '', // Asumiendo que no hay descripción disponible
      })),
    }));
  };
  const transformedReports = transformDailyReports(dailyReports);
  console.log(transformedReports);

  const handleStatusChangeWithWarning = (id: string, status: boolean) => {
    if (!status) { // Si el nuevo estado es 'cerrado' (false)
      setPendingStatusChange({ id, status });
      setWarningDialogOpen(true);
    } else {
      handleStatusChange(id, status);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      handleStatusChange(pendingStatusChange.id, pendingStatusChange.status);
      setPendingStatusChange(null);
    }
    setWarningDialogOpen(false);
  };
  const handleStatusChange = async (reportId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`${URL}/api/daily-report/?id=${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
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
  console.log(currentReports)
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todos los Partes Diarios</h1>
      <div className="mb-4 flex items-center gap-2">
        <span className="mr-4">Filtrar por estado:</span>
        <Select
          value={statusFilter}
          onValueChange={(value: 'abierto' | 'cerrado' | 'todos') => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue>{statusFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="abierto">Abierto</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <span className="mr-4">Filtrar por fecha:</span>
        <DatePicker date={startDate} setDate={setStartDate} label="Fecha de Inicio" />
        <DatePicker date={endDate} setDate={setEndDate} label="Fecha de Fin" />

        <span>Filas por página: </span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="Seleccionar cantidad" />
          </SelectTrigger>
          <SelectContent className="w-auto min-w-[70px] absolute">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="40">40</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="60">60</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center">Cargando...</div>
      ) : (
        <>
          <Table>
            <TableCaption>
              {/* Aquí puedes agregar un título o descripción para la tabla */}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={handleSortChange} className="flex items-center">
                    Fecha
                    {sortOrder === 'asc' ? <FaAngleUp /> : <FaAngleDown />}
                  </button>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    <Select
                      value={report.status ? 'true' : 'false'}
                      onValueChange={(value: 'true' | 'false') => handleStatusChangeWithWarning(report.id, value === 'true')}
                      disabled={report.status === false}
                    >
                      <SelectTrigger className="w-[200px]">
                      <SelectValue>{report.status ? 'abierto' : 'cerrado'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">abierto</SelectItem>
                        <SelectItem value="false">cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => handleViewReport(report)} disabled={isLoading}>
                      Ver Completo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalPages }, (_, index) => (
              <Button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                variant={currentPage === index + 1 ? 'default' : 'outline'}
                className="mx-1"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </>
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

      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advertencia</DialogTitle>
            <DialogDescription>
              Si cambias el estado a "cerrado", no podrás editar este reporte ni cambiar su estado nuevamente a "abierto". ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmStatusChange}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}