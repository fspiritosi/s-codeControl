import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const service = await prisma.service_items.findMany({
      where: {
        company_id: company_id || '',
        id,
      },
    });

    return apiSuccess({ service });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch service', 500);
  }
}
