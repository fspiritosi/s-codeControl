import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const customers = await prisma.customers.findMany({
      where: { company_id: company_id || '' },
    });

    return apiSuccess({ customers });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch customers', 500);
  }
}
