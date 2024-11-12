'use client';

import React, { useState, useEffect } from 'react';
import { DetailTable } from '@/components/DailyReport/tables/Data-table-DetailDailyReport';
import { detailColumns } from '@/components/DailyReport/tables/DetailReportColumms';
import { DatePicker } from '@/components/DailyReport/DatePicker';
// import { cookies } from 'next/headers';
import  cookies  from 'js-cookie';
import moment from 'moment';

export default function DailyReportDetail() {
  // Estado para las fechas con posibilidad de `undefined`
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Estado para los datos de la API
  const [formattedData, setFormattedData] = useState<any[]>([]);

  // Traer el company_id de las cookies
  
  const company_id = cookies.get("actualComp");

  // Función para obtener los datos desde la API
  const fetchData = async () => {
    if (!company_id) return;
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
    try {
      const response = await fetch(`${URL}/api/daily-report/daily-report-row/detail?actual=${company_id}`);
      const data = await response.json();

      const formattedData = data.dailyreportrows?.map((row: any) => ({
        date: moment(row.daily_report_id?.date).toDate(),
        customer_name: row.customer_id.name,
        service_name: row.service_id.service_name,
        working_day: row.working_day,
        item_name: row.item_id.item_name,
        start_time: row.start_time,
        end_time: row.end_time,
        description: row.description,
        status: row.status,
      }));

      setFormattedData(formattedData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch the data when the component mounts
  useEffect(() => {
    fetchData();
  }, [company_id]);

  // Filtrado de datos según las fechas seleccionadas
  const filteredData = formattedData.filter((row: any) => {
    const reportDate = row.date;
    return (
      (!startDate || reportDate >= startDate) &&
      (!endDate || reportDate <= endDate)
    );
  });

  return (
    // <div>
    //   <div className="flex">
    //     <div>
    //       <DatePicker date={startDate} setDate={setStartDate} label="Seleccionar fecha de inicio" />
    //     </div>
    //     <div>
    //       <DatePicker date={endDate} setDate={setEndDate} label="Seleccionar fecha de fin" />
    //     </div>
    //   </div>
      <div>
        <DetailTable columns={detailColumns} data={filteredData || []} />
      </div>
    // </div>
  );
}

