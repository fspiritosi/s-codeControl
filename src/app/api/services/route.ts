import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const services = await prisma.customer_services.findMany({
      where: { company_id: company_id || '' },
    });

    return apiSuccess({ services });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch services', 500);
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let company_id = searchParams.get('actual');
  const body = await request.json();
  const { service_name, service_start, service_validity, customer_id } = body;
  company_id = company_id ? company_id.replace(/['"]/g, '') : null;
  const date = new Date(service_validity);
  const date1 = new Date(service_start);
  const year1 = date1.getFullYear();
  const month1 = String(date1.getMonth() + 1).padStart(2, '0');
  const day1 = String(date1.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate1 = `${year1}/${month1}/${day1}`;
  const formattedDate = `${year}/${month}/${day}`;

  try {
    const services = await prisma.customer_services.create({
      data: {
        company_id: company_id,
        customer_id: customer_id,
        service_name: service_name,
        service_start: formattedDate1,
        service_validity: formattedDate,
      },
    });

    return apiSuccess({ services }, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create service', 500);
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const body = await request.json();
  const { service_name, customer_id, service_start, service_validity, is_active } = body;

  try {
    const services = await prisma.customer_services.update({
      where: { id: id || '' },
      data: {
        customer_id: customer_id,
        service_name: service_name,
        service_start: service_start,
        service_validity: service_validity,
        is_active: is_active,
      },
    });

    return apiSuccess({ services });
  } catch (error) {
    console.error(error);
    return apiError('Failed to update service', 500);
  }
}
