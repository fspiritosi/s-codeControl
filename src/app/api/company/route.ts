import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');
  try {
    const companies = await prisma.company.findMany({
      where: { id: company_id || '' },
      include: { city_rel: { select: { name: true } } },
    });

    // Map to match previous response shape: city_rel -> city(name)
    const data = companies.map((c: any) => {
      const { city_rel, ...rest } = c;
      return { ...rest, city: city_rel ? { name: city_rel.name } : null };
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch companies', 500);
  }
}
