import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const documents = await prisma.documents_employees.findMany({
      where: {
        id,
        employee: {
          is: { company_id: company_id || '', is_active: true },
        },
        document_type: {
          is: { is_active: true },
        },
      },
      include: {
        employee: {
          include: {
            contractor_employee: {
              include: {
                contractor: true,
              },
            },
          },
        },
        document_type: true,
      },
    });

    // Remap to match previous response shape
    const data = documents.map((d: any) => {
      const { employee, document_type, ...rest } = d;
      return {
        ...rest,
        employees: employee
          ? {
              ...employee,
              contractor_employee: employee.contractor_employee.map((ce: any) => ({
                customers: ce.contractor,
              })),
            }
          : null,
        document_types: document_type,
      };
    });

    return apiSuccess({ data });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch employee document', 500);
  }
}
