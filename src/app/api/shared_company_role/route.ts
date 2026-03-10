import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('company_id');
  const profile_id = searchParams.get('profile_id');

  if (!company_id) {
    return apiError('Company not found', 400);
  }

  try {
    const shared_user = await prisma.share_company_users.findMany({
      where: {
        company_id: company_id || '',
        profile_id: profile_id || '',
      },
    });

    return apiSuccess({ shared_user });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return apiError('An error occurred while fetching shared company role', 500);
  }
}
