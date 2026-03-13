import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

type response = {
  document: any | null;
  resourceType: string | null;
  resource: string | null;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const resource = searchParams.get('resource');

  let response: response = {
    document: null,
    resourceType: null,
    resource: null,
  };

  try {
    if (resource === 'Persona') {
      const employeeDocument = await getEmployeeDocument(documentId);
      response = {
        document: employeeDocument as any,
        resourceType: 'documentos-empleados',
        resource: 'employee',
      };
    }

    if (resource === 'Equipos') {
      const equipmentDocument = await getEquipmentDocument(documentId);
      response = {
        document: equipmentDocument as any,
        resourceType: 'documentos-equipos',
        resource: 'vehicle',
      };
    }

    if (resource === 'Empresa') {
      const companyDocument = await getCompanyDocument(documentId);
      response = {
        document: companyDocument as any,
        resourceType: 'documentos-company',
        resource: 'company',
      };
    }

    return apiSuccess({ response });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch document', 500);
  }
}

const getEmployeeDocument = async (documentId: string) => {
  try {
    const doc = await prisma.documents_employees.findUnique({
      where: { id: documentId },
      include: {
        document_type: true,
        employee: {
          include: {
            city_rel: { select: { name: true } },
            province_rel: { select: { name: true } },
            contractor_employee: {
              include: {
                contractor: true,
              },
            },
            company: {
              include: {
                province_rel: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!doc) return null;

    // Remap to match previous response shape
    const { employee, document_type, ...rest } = doc;
    return {
      ...rest,
      document_types: document_type,
      applies: employee
        ? {
            ...employee,
            city: employee.city_rel,
            province: employee.province_rel,
            contractor_employee: employee.contractor_employee.map((ce: any) => ({
              customers: ce.contractor,
            })),
            company_id: employee.company
              ? {
                  ...employee.company,
                  province_id: employee.company.province_rel,
                }
              : null,
          }
        : null,
    };
  } catch (error) {
    return error;
  }
};

const getEquipmentDocument = async (documentId: string) => {
  try {
    const doc = await prisma.documents_equipment.findUnique({
      where: { id: documentId },
      include: {
        document_type: true,
        vehicle: {
          include: {
            brand_rel: { select: { name: true } },
            model_rel: { select: { name: true } },
            type_of_vehicle_rel: { select: { name: true } },
            company: {
              include: {
                province_rel: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!doc) return null;

    const { vehicle, document_type, ...rest } = doc;
    return {
      ...rest,
      document_types: document_type,
      applies: vehicle
        ? {
            ...vehicle,
            brand: vehicle.brand_rel,
            model: vehicle.model_rel,
            type_of_vehicle: vehicle.type_of_vehicle_rel,
            company_id: vehicle.company
              ? {
                  ...vehicle.company,
                  province_id: vehicle.company.province_rel,
                }
              : null,
          }
        : null,
    };
  } catch (error) {
    return error;
  }
};

const getCompanyDocument = async (documentId: string) => {
  try {
    const doc = await prisma.documents_company.findUnique({
      where: { id: documentId },
      include: {
        document_type: true,
      },
    });

    if (!doc) return null;

    const { document_type, ...rest } = doc;
    return {
      ...rest,
      document_types: document_type,
    };
  } catch (error) {
    return error;
  }
};
