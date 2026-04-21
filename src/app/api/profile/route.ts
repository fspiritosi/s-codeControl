import { prisma } from '@/shared/lib/prisma';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user');

  try {
    // Verificar si el userId está presente en los parámetros de búsqueda
    if (!userId) {
      return apiError('User ID is required', 400);
    }

    // Obtener el perfil del usuario
    const ownerUser = await prisma.profile.findMany({
      where: { id: userId },
    });

    return apiSuccess({ data: ownerUser });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return apiError((error as any).message, 500);
  }
}
