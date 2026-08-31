import { prisma } from '@/shared/lib/prisma';
import type { ConceptoEquipoCalc } from './calcular-conceptos-equipo';

/**
 * Conceptos activos por tipo de equipo de una empresa, en UNA sola query, resueltos en un
 * `Map` por `type_id`. Es lo que evita el N+1 en las lecturas que costean varios equipos.
 *
 * No es una server action a propósito: devuelve un `Map`, que no sobrevive la
 * serialización server→client, así que sólo tiene sentido consumirla desde el servidor.
 */
export async function conceptosPorTipoDeEmpresa(
  companyId: string
): Promise<Map<string, ConceptoEquipoCalc[]>> {
  const perfiles = await prisma.costo_tipo_equipo.findMany({
    where: { company_id: companyId },
    include: { conceptos: { where: { is_active: true }, include: { concepto: true } } },
  });
  return new Map(
    perfiles.map((p) => [
      p.type_id,
      p.conceptos
        .filter((a) => a.concepto.is_active)
        .map((a) => ({
          codigo: a.concepto.codigo,
          clase: a.concepto.clase,
          clase_calculo: a.concepto.clase_calculo,
          parametros: (a.concepto.parametros ?? {}) as Record<string, unknown>,
        })),
    ])
  );
}
