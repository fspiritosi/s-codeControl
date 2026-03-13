import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.measure_units.findMany();

    return apiSuccess({ data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch measure units', 500);
  }
}
