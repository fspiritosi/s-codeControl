import { prisma } from '@/shared/lib/prisma';
import { ordenTopologicoConceptos, type ConceptoEquipoCalc } from './calcular-conceptos-equipo';

/**
 * Red de seguridad de las lecturas. Un perfil mal armado —un concepto porcentual asociado sin
 * el concepto que le sirve de base— hace que el motor lance al resolverlo. Si eso pasa durante
 * una lectura, ese tipo se degrada a "sin conceptos" y el resto de la pantalla sigue andando,
 * en vez de tumbar el listado de equipos, el detalle o la composición entera.
 *
 * La validación de verdad vive al asociar (ver `tipos-equipo/actions.server.ts`): esto es sólo
 * para perfiles que ya hayan quedado mal por datos viejos o por un borrado.
 */
export function conceptosResolublesODegradar(
  typeId: string,
  conceptos: ConceptoEquipoCalc[]
): ConceptoEquipoCalc[] {
  try {
    ordenTopologicoConceptos(conceptos);
    return conceptos;
  } catch (error) {
    console.error(
      `[costos] El perfil del tipo ${typeId} no resuelve; se ignoran sus conceptos.`,
      error
    );
    return [];
  }
}

/**
 * Mapea las asociaciones de un perfil a la forma que consume el motor.
 *
 * Los conceptos inactivos se incluyen con `is_active: false` en vez de descartarse: el motor
 * los toma como existentes pero de valor 0, así que desactivar un concepto que otro usa de base
 * no rompe la resolución. Filtrarlos acá los volvería una referencia colgada.
 */
function aConceptosCalc(
  asociaciones: {
    concepto: {
      codigo: string;
      clase: 'ACCESORIO' | 'MANTENIMIENTO';
      clase_calculo: ConceptoEquipoCalc['clase_calculo'];
      parametros: unknown;
      is_active: boolean;
    };
  }[]
): ConceptoEquipoCalc[] {
  return asociaciones.map((a) => ({
    codigo: a.concepto.codigo,
    clase: a.concepto.clase,
    clase_calculo: a.concepto.clase_calculo,
    parametros: (a.concepto.parametros ?? {}) as Record<string, unknown>,
    is_active: a.concepto.is_active,
  }));
}

/**
 * Conceptos por tipo de equipo de una empresa, en UNA sola query, resueltos en un `Map` por
 * `type_id`. Es lo que evita el N+1 en las lecturas que costean varios equipos.
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
    perfiles.map((p) => [p.type_id, conceptosResolublesODegradar(p.type_id, aConceptosCalc(p.conceptos))])
  );
}

/**
 * Conceptos del perfil de un solo tipo, con el nombre de cada uno: el desglose de la pantalla
 * del equipo los muestra por nombre y el motor sólo trabaja con códigos.
 */
export async function conceptosDeUnTipo(
  companyId: string,
  typeId: string
): Promise<{ conceptos: ConceptoEquipoCalc[]; nombrePorCodigo: Map<string, string> }> {
  const perfil = await prisma.costo_tipo_equipo.findUnique({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    include: {
      conceptos: {
        where: { is_active: true },
        orderBy: { orden: 'asc' },
        include: { concepto: true },
      },
    },
  });
  const asociaciones = perfil?.conceptos ?? [];

  return {
    conceptos: conceptosResolublesODegradar(typeId, aConceptosCalc(asociaciones)),
    nombrePorCodigo: new Map(asociaciones.map((a) => [a.concepto.codigo, a.concepto.nombre])),
  };
}
