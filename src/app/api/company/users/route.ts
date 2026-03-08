import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const company_users = await prisma.share_company_users.findMany({
      where: { company_id: company_id || '' },
      include: { profile: true },
    });

    return Response.json({ company_users });
  } catch (error) {
    console.error(error);
  }
}
