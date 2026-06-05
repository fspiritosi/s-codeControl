import { prisma } from '@/shared/lib/prisma';
import { COSTOS_MODULE_NAME } from '@/modules/costos/shared/constants';

export class ModuloNoHabilitadoError extends Error {
  constructor(companyId: string) {
    super(`El módulo '${COSTOS_MODULE_NAME}' no está habilitado para la empresa ${companyId}`);
    this.name = 'ModuloNoHabilitadoError';
  }
}

/**
 * Verifica que la empresa tenga el módulo 'costos' contratado.
 * Lanza ModuloNoHabilitadoError si no lo tiene.
 */
export async function assertModuloHabilitado(companyId: string): Promise<void> {
  const row = await prisma.hired_modules.findFirst({
    where: {
      company_id: companyId,
      module: { name: COSTOS_MODULE_NAME },
    },
    select: { id: true },
  });

  if (!row) {
    throw new ModuloNoHabilitadoError(companyId);
  }
}
