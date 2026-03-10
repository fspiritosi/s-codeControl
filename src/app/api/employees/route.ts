import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  if (!company_id) {
    return apiError('company_id is required', 400);
  }
  try {
    const employees = await prisma.employees.findMany({
      where: { company_id },
    });
    return apiSuccess({ employees });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch employees', 500);
  }
}
