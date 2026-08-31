/**
 * Lectura y validación de los conceptos asociados al perfil de un tipo de equipo.
 *
 * Las dos caras del mismo problema viven acá a propósito: el motor resuelve el SUBCONJUNTO
 * asociado a un tipo, no el catálogo de la empresa, así que un perfil puede quedar irresoluble
 * aunque el catálogo entero cierre. `assertPerfilResoluble` lo impide al escribir y
 * `conceptosResolublesODegradar` acota el daño si algo ya quedó mal.
 *
 * No es un archivo de server actions a propósito: exporta helpers sincrónicos y un `Map`, que no
 * sobreviven la serialización server→client. Sólo tiene sentido consumirlo desde el servidor.
 */
import { prisma } from '@/shared/lib/prisma';
import {
  ordenTopologicoConceptos,
  CicloConceptosEquipoError,
  ReferenciaConceptoEquipoInvalidaError,
  type ClaseCalculoConceptoEquipo,
  type ConceptoEquipoCalc,
} from './calcular-conceptos-equipo';

/** Concepto con cambios todavía no escritos, que reemplaza al de la base durante la validación. */
export type CambioDeConcepto = {
  id: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  clase_calculo: ClaseCalculoConceptoEquipo;
  parametros: Record<string, unknown>;
  is_active: boolean;
};

/**
 * Red de seguridad de las lecturas. Si un perfil ya quedó mal armado —por datos viejos o por un
 * borrado— se degrada ese tipo a "sin conceptos" en vez de tumbar el listado de equipos, el
 * detalle o la composición entera.
 *
 * Sólo se degradan los dos errores de resolubilidad. Cualquier otro (por ejemplo un `TypeError`
 * por parámetros guardados con una forma imposible) se propaga: en un módulo de costos, fallar
 * es mejor que mostrar cero en silencio.
 */
export function conceptosResolublesODegradar(
  typeId: string,
  conceptos: ConceptoEquipoCalc[]
): ConceptoEquipoCalc[] {
  try {
    ordenTopologicoConceptos(conceptos);
    return conceptos;
  } catch (error) {
    if (
      !(error instanceof ReferenciaConceptoEquipoInvalidaError) &&
      !(error instanceof CicloConceptosEquipoError)
    ) {
      throw error;
    }
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
      clase_calculo: ClaseCalculoConceptoEquipo;
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
      conceptosResolublesODegradar(p.type_id, aConceptosCalc(p.conceptos)),
    ])
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

/**
 * Valida que el conjunto de conceptos que quedaría asociado a un perfil siga resolviendo, y
 * traduce el error del motor a nombres: los códigos no le dicen nada a quien usa la pantalla.
 *
 * `cambio` permite validar contra un concepto que todavía no se escribió (el caso de
 * `updateConcepto`, donde el conjunto no cambia pero sí lo que hace uno de sus miembros).
 * `tipoNombre` cambia la redacción cuando el perfil afectado no es el que se está tocando, y
 * `verbo` la ajusta a la operación que la disparó.
 */
export async function assertPerfilResoluble(
  companyId: string,
  conceptoIds: string[],
  opciones?: { tipoNombre?: string; cambio?: CambioDeConcepto; verbo?: 'asociar' | 'desasociar' }
) {
  if (conceptoIds.length === 0) return;

  const [delPerfil, catalogo] = await Promise.all([
    prisma.concepto_equipo.findMany({
      where: { id: { in: conceptoIds }, company_id: companyId },
      select: {
        id: true,
        codigo: true,
        clase: true,
        clase_calculo: true,
        parametros: true,
        is_active: true,
      },
    }),
    prisma.concepto_equipo.findMany({
      where: { company_id: companyId },
      select: { codigo: true, nombre: true },
    }),
  ]);

  const nombrePorCodigo = new Map(catalogo.map((c) => [c.codigo, c.nombre]));
  const nombre = (codigo: string) => nombrePorCodigo.get(codigo) ?? codigo;
  const cambio = opciones?.cambio;

  const conceptos: ConceptoEquipoCalc[] = delPerfil.map((c) =>
    cambio && cambio.id === c.id
      ? {
          codigo: c.codigo,
          clase: cambio.clase,
          clase_calculo: cambio.clase_calculo,
          parametros: cambio.parametros,
          is_active: cambio.is_active,
        }
      : {
          codigo: c.codigo,
          clase: c.clase,
          clase_calculo: c.clase_calculo,
          parametros: (c.parametros ?? {}) as Record<string, unknown>,
          is_active: c.is_active,
        }
  );

  try {
    ordenTopologicoConceptos(conceptos);
  } catch (error) {
    const tipo = opciones?.tipoNombre;
    const verbo = opciones?.verbo ?? 'asociar';
    if (error instanceof ReferenciaConceptoEquipoInvalidaError) {
      const origen = nombre(error.origen);
      const base = nombre(error.referenciado);
      throw new Error(
        tipo
          ? `El tipo «${tipo}» quedaría inconsistente: «${origen}» depende de «${base}», ` +
            'que no está asociado a ese tipo'
          : verbo === 'desasociar'
            ? `No se puede desasociar: «${origen}» depende de «${base}», que quedaría fuera ` +
              'de este tipo'
            : `No se puede asociar «${origen}»: depende de «${base}», que no está asociado a ` +
              'este tipo'
      );
    }
    if (error instanceof CicloConceptosEquipoError) {
      const ciclo = error.ciclo.map(nombre).join(' → ');
      throw new Error(
        tipo
          ? `El tipo «${tipo}» quedaría inconsistente: los conceptos forman un ciclo (${ciclo})`
          : `No se puede ${verbo}: los conceptos forman un ciclo (${ciclo})`
      );
    }
    throw error;
  }
}

/**
 * Valida que TODOS los perfiles que ya usan un concepto sigan resolviendo con el cambio que está
 * por escribirse. Es la contracara de `assertPerfilResoluble`: allá cambia el conjunto y el
 * concepto sale de la base; acá el conjunto no se mueve y el que cambia es el concepto.
 *
 * Sin esto, convertir un FIJO ya asociado en un PCT_CONCEPTO cuya base no está asociada a esos
 * tipos pasa la validación del catálogo y deja esos perfiles resolviendo en cero.
 */
export async function assertPerfilesQueUsanElConcepto(
  companyId: string,
  conceptoId: string,
  cambio: Omit<CambioDeConcepto, 'id'>
) {
  const perfiles = await prisma.costo_tipo_equipo.findMany({
    where: { company_id: companyId, conceptos: { some: { concepto_equipo_id: conceptoId } } },
    select: {
      tipo: { select: { name: true } },
      conceptos: { select: { concepto_equipo_id: true } },
    },
  });

  for (const p of perfiles) {
    await assertPerfilResoluble(
      companyId,
      p.conceptos.map((c) => c.concepto_equipo_id),
      { tipoNombre: p.tipo.name, cambio: { id: conceptoId, ...cambio } }
    );
  }
}
