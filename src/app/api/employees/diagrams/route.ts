import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { serializeBigInt } from '@/shared/lib/utils';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employee_id = searchParams.get('employee_id');
  if (employee_id) {
    try {
      const employees_diagram = await prisma.employees_diagram.findMany({
        where: { employee_id },
        include: { diagram_type_rel: true },
      });

      const data = employees_diagram.map((ed: any) => {
        const { diagram_type_rel, ...rest } = ed;
        return { ...rest, diagram_type: diagram_type_rel };
      });

      return apiSuccess({ data: serializeBigInt(data) });
    } catch (error) {
      console.error(error);
      return apiError('Failed to fetch employee diagrams', 500);
    }
  }

  // Sin employee_id: filtrar por la empresa actual de la cookie.
  // Antes traía diagramas de TODAS las empresas (bug + egress masivo).
  const cookiesStore = await cookies();
  const company_id = searchParams.get('actual') ?? cookiesStore.get('actualComp')?.value;
  if (!company_id) return apiSuccess({ data: [] });

  try {
    const employees_diagram = await prisma.employees_diagram.findMany({
      where: { employee: { company_id } },
      include: {
        employee: { select: { id: true, firstname: true, lastname: true, company_id: true } },
        diagram_type_rel: true,
      },
    });

    const data = employees_diagram.map((ed: any) => {
      const { diagram_type_rel, employee, ...rest } = ed;
      return { ...rest, employees: employee, diagram_type: diagram_type_rel };
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch diagrams', 500);
  }
}

export async function POST(request: NextRequest) {
  const bodyData = await request.json();

  try {
    const data = await prisma.employees_diagram.create({
      data: {
        employee_id: bodyData.employee,
        diagram_type: bodyData.event_diagram,
        day: bodyData.day,
        month: bodyData.month,
        year: bodyData.year,
      },
    });

    return apiSuccess(data, 201);
  } catch (error) {
    console.error(error);
    return apiError('Failed to create diagram', 500);
  }
}

export async function PUT(request: NextRequest) {
  const bodyData = await request.json();
  try {
    const data = await prisma.employees_diagram.update({
      where: { id: bodyData.id },
      data: {
        employee_id: bodyData.employee,
        diagram_type: bodyData.event_diagram,
        day: bodyData.day,
        month: bodyData.month,
        year: bodyData.year,
      },
    });

    return apiSuccess(data);
  } catch (error) {
    console.error(error);
    return apiError('Failed to update diagram', 500);
  }
}
