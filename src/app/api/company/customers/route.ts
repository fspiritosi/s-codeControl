import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const customers = await prisma.customers.findMany({
      where: { company_id: company_id || '' },
    });

    return Response.json({ customers });
  } catch (error) {
    console.error(error);
  }
}
