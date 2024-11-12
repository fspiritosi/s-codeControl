import React from 'react'
import { DetailTable } from '@/components/DailyReport/tables/Data-table-DetailDailyReport';
import { detailColumns } from '@/components/DailyReport/tables/DetailReportColumms';
import {cookies} from 'next/headers';
import { error } from 'console';

export default async function DailyReportDetail() {
  
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const coockiesStore = cookies();
  const company_id = coockiesStore.get("actualComp");
  console.log(company_id?.value);
  const response = await fetch(`${URL}/api/daily-report/daily-report-row/detail?actual=${company_id?.value}`, );
const data = await response.json();
console.log(data.dailyreportrows); // Imprime la respuesta completa

const formattedData = data.dailyreportrows?.map((row: any) => ({
  date: row.daily_report_id?.date,
  customer_name: row.customer_id.name,
  service_name: row.service_id.service_name,
  working_day: row.working_day,
  item_name: row.item_id.item_name,
  start_time: row.start_time,
  end_time: row.end_time,
  description: row.description,
  status: row.status,

}));
console.log(formattedData); // Imprime la respuesta formateada
  return (
    <div>
        
        <div>
        <DetailTable  columns={detailColumns} data={formattedData || ''} 
        // customers={[]} services={[]} items={[]} employees={[]} equipment={[]} companyName='' 
        />
        </div>
    </div>
  )
}
