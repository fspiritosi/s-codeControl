import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const data = await prisma.measure_units.findMany();

    return Response.json({ data });
  } catch (error) {
    console.error(error);
  }
}
