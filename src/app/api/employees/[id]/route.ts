import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const employee = await prisma.employees.findMany({
      where: {
        company_id: company_id || '',
        id,
      },
      include: {
        guild_rel: { select: { id: true, name: true } },
        covenants_rel: { select: { id: true, name: true } },
        category_rel: { select: { id: true, name: true } },
        city_rel: { select: { name: true } },
        province_rel: { select: { name: true } },
        workflow_diagram_rel: { select: { name: true } },
        hierarchy_rel: { select: { name: true } },
        birthplace_rel: { select: { name: true } },
        contractor_employee: {
          include: {
            contractor: true,
          },
        },
      },
    });

    // Remap relation names to match previous Supabase response shape
    const mappedEmployee = employee.map((e: any) => {
      const {
        guild_rel,
        covenants_rel,
        category_rel,
        city_rel,
        province_rel,
        workflow_diagram_rel,
        hierarchy_rel,
        birthplace_rel,
        contractor_employee,
        ...rest
      } = e;
      return {
        ...rest,
        guild: guild_rel,
        covenant: covenants_rel,
        category: category_rel,
        city: city_rel,
        province: province_rel,
        workflow_diagram: workflow_diagram_rel,
        hierarchical_position: hierarchy_rel,
        birthplace: birthplace_rel,
        contractor_employee: contractor_employee.map((ce: any) => ({
          customers: ce.contractor,
        })),
      };
    });

    return Response.json({ employee: mappedEmployee });
  } catch (error) {
    console.log(error);
  }
}
