import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  if (!company_id) {
    return Response.json({ error: 'company_id is required' });
  }
  try {
    const employees = await prisma.employees.findMany({
      where: { company_id },
    });
    return Response.json({ employees });
  } catch (error) {
    console.error(error);
    return Response.json({ error });
  }
}
