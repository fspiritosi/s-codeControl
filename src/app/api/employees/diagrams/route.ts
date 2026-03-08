import { prisma } from '@/lib/prisma';
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

      return Response.json({ data });
    } catch (error) {
      console.log(error);
    }
  }

  try {
    const employees_diagram = await prisma.employees_diagram.findMany({
      include: {
        employee: true,
        diagram_type_rel: true,
      },
    });

    const data = employees_diagram.map((ed: any) => {
      const { diagram_type_rel, employee, ...rest } = ed;
      return { ...rest, employees: employee, diagram_type: diagram_type_rel };
    });

    return Response.json({ data });
  } catch (error) {
    console.log(error);
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

    return Response.json(data);
  } catch (error) {
    console.log(error, 'este es el error');
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

    return Response.json(data);
  } catch (error) {
    console.log(error, 'esto tambien es error');
  }
}
