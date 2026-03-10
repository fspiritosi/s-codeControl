import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    const dailyReportsRaw = await prisma.dailyreport.findMany({
      where: { company_id: company_id || '' },
      select: {
        id: true,
        date: true,
        company_id: true,
        status: true,
        dailyreportrows: {
          select: {
            id: true,
            item: { select: { id: true, item_name: true } },
            customer: { select: { id: true, name: true } },
            service: { select: { id: true, service_name: true } },
            start_time: true,
            end_time: true,
            status: true,
            working_day: true,
            description: true,
            document_path: true,
            dailyreportemployeerelations: {
              select: {
                employee: { select: { id: true, firstname: true, lastname: true } },
              },
            },
            dailyreportequipmentrelations: {
              select: {
                vehicle: { select: { id: true, intern_number: true } },
              },
            },
          },
        },
      },
    });

    // Remap to match previous Supabase response shape
    const dailyReports = dailyReportsRaw.map((dr: any) => ({
      ...dr,
      dailyreportrows: dr.dailyreportrows.map((row: any) => ({
        ...row,
        item_id: row.item,
        customer_id: row.customer,
        service_id: row.service,
        dailyreportemployeerelations: row.dailyreportemployeerelations.map((er: any) => ({
          employee_id: er.employee,
        })),
        dailyreportequipmentrelations: row.dailyreportequipmentrelations.map((eqr: any) => ({
          equipment_id: eqr.vehicle,
        })),
      })),
    }));

    return apiSuccess({ dailyReports });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return apiError('Failed to fetch daily reports', 500);
  }
}
