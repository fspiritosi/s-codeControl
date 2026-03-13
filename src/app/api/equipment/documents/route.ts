import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company_id = searchParams.get('actual');

  try {
    const documentsRaw = await prisma.documents_equipment.findMany({
      where: {
        vehicle: {
          is: { company_id: company_id || '', is_active: true },
        },
        document_type: {
          is: { is_active: true },
        },
      },
      include: {
        document_type: true,
        vehicle: {
          include: {
            type_rel: true,
            type_of_vehicle_rel: true,
            model_rel: true,
            brand_rel: true,
          },
        },
      },
    });

    // Remap to match previous response shape
    const documents = documentsRaw.map((d: any) => {
      const { vehicle, document_type, ...rest } = d;
      return {
        ...rest,
        document_types: document_type,
        applies: vehicle
          ? {
              ...vehicle,
              type: vehicle.type_rel,
              type_of_vehicle: vehicle.type_of_vehicle_rel,
              model: vehicle.model_rel,
              brand: vehicle.brand_rel,
            }
          : null,
      };
    });

    return apiSuccess({ equipmentDocuments: documents });
  } catch (error) {
    console.error(error);
    return apiError('Failed to fetch equipment documents', 500);
  }
}
