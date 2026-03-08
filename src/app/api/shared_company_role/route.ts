import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('company_id');
  const profile_id = searchParams.get('profile_id');

  if (!company_id) {
    return NextResponse.json({ error: ['Company not found'] });
  }

  try {
    const shared_user = await prisma.share_company_users.findMany({
      where: {
        company_id: company_id || '',
        profile_id: profile_id || '',
      },
    });

    return NextResponse.json({ shared_user });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: ['An error occurred while fetching equipments'] });
  }
}
