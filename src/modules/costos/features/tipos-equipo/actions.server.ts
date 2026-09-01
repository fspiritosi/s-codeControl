'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal } from '@/modules/costos/shared/utils/decimal';
import { describirCalculo } from '@/modules/costos/shared/validators/concepto-equipo';
import { assertPerfilResoluble } from '@/modules/costos/shared/utils/conceptos-por-tipo';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  ConceptoAsociadoClient,
  CostoTipoEquipoDetalle,
  TipoCosteadoResumen,
} from '@/modules/costos/shared/types/concepto.types';

const TIPOS_PATH = '/dashboard/costos/tipos-equipo';
// El costo mensual del listado de equipos se calcula con los conceptos del tipo, así que
// toda mutación de asociaciones acá invalida también esa pantalla.
const EQUIPOS_PATH = '/dashboard/costos/equipos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertPerfilPertenece(perfilId: string, companyId: string) {
  const perfil = await prisma.costo_tipo_equipo.findFirst({
    where: { id: perfilId, company_id: companyId },
    select: { id: true },
  });
  if (!perfil) throw new Error('Perfil de costo no encontrado o sin acceso');
}

/**
 * Suma el valor de los conceptos FIJO de una clase: cantidad × precio_unitario, todo en
 * Decimal. Los porcentuales y los POR_KM no entran acá: dependen de cada unidad.
 */
function sumarFijos(
  conceptos: {
    clase: 'ACCESORIO' | 'MANTENIMIENTO';
    clase_calculo: string;
    parametros: unknown;
  }[],
  clase: 'ACCESORIO' | 'MANTENIMIENTO'
): Decimal {
  return conceptos
    .filter((c) => c.clase_calculo === 'FIJO' && c.clase === clase)
    .reduce((acc, c) => {
      const par = (c.parametros ?? {}) as Record<string, unknown>;
      return acc.add(
        new Decimal(String(par.cantidad ?? 0)).mul(new Decimal(String(par.precio_unitario ?? 0)))
      );
    }, new Decimal(0));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Sólo los tipos que la empresa decidió costear. */
export async function listTiposCosteados(): Promise<TipoCosteadoResumen[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [perfiles, conteos] = await Promise.all([
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      include: {
        tipo: { select: { id: true, name: true } },
        conceptos: { where: { is_active: true }, include: { concepto: true } },
      },
    }),
    prisma.vehicles.groupBy({
      by: ['type'],
      where: { company_id: companyId },
      _count: { _all: true },
    }),
  ]);
  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));

  return perfiles
    .map((p) => {
      const activos = p.conceptos.map((a) => a.concepto).filter((c) => c.is_active);

      return {
        type_id: p.type_id,
        perfil_id: p.id,
        nombre: p.tipo.name,
        equipos_count: equiposPorTipo.get(p.type_id) ?? 0,
        accesorios_count: activos.filter((c) => c.clase === 'ACCESORIO').length,
        mantenimiento_count: activos.filter((c) => c.clase === 'MANTENIMIENTO').length,
        total_fijo_accesorios: sumarFijos(activos, 'ACCESORIO').toDecimalPlaces(2).toNumber(),
        total_fijo_mantenimiento: sumarFijos(activos, 'MANTENIMIENTO').toDecimalPlaces(2).toNumber(),
        conceptos_variables: activos.filter((c) => c.clase_calculo !== 'FIJO').length,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Tipos de la empresa que todavía no tienen costo creado, para el selector de alta. */
export async function listTiposDisponibles(): Promise<
  { id: string; nombre: string; equipos: number }[]
> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const [conteos, perfiles] = await Promise.all([
    prisma.vehicles.groupBy({
      by: ['type'],
      where: { company_id: companyId },
      _count: { _all: true },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      select: { type_id: true },
    }),
  ]);
  const yaCosteados = new Set(perfiles.map((p) => p.type_id));

  // type.company_id es nullable: hay tipos globales que usan varias empresas. El selector
  // ofrece los tipos propios MÁS los globales que los vehículos de esta empresa usan.
  const tipos = await prisma.type.findMany({
    where: {
      is_active: true,
      id: { notIn: [...yaCosteados] },
      OR: [{ company_id: companyId }, { id: { in: conteos.map((c) => c.type) } }],
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));
  return tipos.map((t) => ({
    id: t.id,
    nombre: t.name,
    equipos: equiposPorTipo.get(t.id) ?? 0,
  }));
}

/** Detalle del perfil de un tipo. Devuelve null si el tipo no existe o no está costeado. */
export async function getCostoTipoEquipo(typeId: string): Promise<CostoTipoEquipoDetalle | null> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  // Propio de la empresa o global (company_id null). Nunca uno de otra empresa.
  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true, name: true },
  });
  if (!tipo) return null;

  const [perfil, equipos_count] = await Promise.all([
    prisma.costo_tipo_equipo.findUnique({
      where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
      include: {
        conceptos: {
          where: { is_active: true },
          orderBy: { orden: 'asc' },
          include: {
            concepto: {
              include: {
                product: { select: { code: true, company_id: true } },
                indice: { select: { nombre: true } },
                _count: { select: { tipos: true } },
              },
            },
          },
        },
      },
    }),
    prisma.vehicles.count({ where: { company_id: companyId, type: typeId } }),
  ]);
  if (!perfil) return null;

  const conceptosClient: ConceptoAsociadoClient[] = perfil.conceptos.map((a) => {
    const c = a.concepto;
    const parametros = (c.parametros ?? {}) as Record<string, unknown>;
    // Defensa en profundidad: si el producto vinculado no es de esta empresa, se expone
    // como si no estuviera vinculado.
    const productoPropio = c.product && c.product.company_id === companyId ? c.product : null;
    return {
      id: c.id,
      asociacion_id: a.id,
      codigo: c.codigo,
      nombre: c.nombre,
      clase: c.clase,
      clase_calculo: c.clase_calculo,
      parametros,
      descripcion_calculo: describirCalculo(c.clase_calculo, parametros),
      product_id: c.product_id,
      product_code: productoPropio?.code ?? null,
      indice_id: c.indice_id,
      indice_nombre: c.indice?.nombre ?? null,
      precio_actualizado_at: c.precio_actualizado_at,
      orden: c.orden,
      is_active: c.is_active,
      usado_en_tipos: c._count.tipos,
    };
  });

  // Los totales fijos van sobre los parámetros crudos, en Decimal, y sólo sobre los
  // conceptos activos: así el total no arrastra el redondeo por concepto.
  const activos = perfil.conceptos.map((a) => a.concepto).filter((c) => c.is_active);

  return {
    type_id: tipo.id,
    nombre: tipo.name,
    perfil_id: perfil.id,
    equipos_count,
    accesorios: conceptosClient.filter((c) => c.clase === 'ACCESORIO'),
    mantenimiento: conceptosClient.filter((c) => c.clase === 'MANTENIMIENTO'),
    total_fijo_accesorios: sumarFijos(activos, 'ACCESORIO').toDecimalPlaces(2).toNumber(),
    total_fijo_mantenimiento: sumarFijos(activos, 'MANTENIMIENTO').toDecimalPlaces(2).toNumber(),
    conceptos_variables: conceptosClient.filter((c) => c.clase_calculo !== 'FIJO').length,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Crea el perfil del tipo y le asocia los conceptos elegidos. */
export async function crearCostoTipoEquipo(typeId: string, conceptoIds: string[]): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true },
  });
  if (!tipo) throw new Error('Tipo de equipo no encontrado o sin acceso');

  const ids = z.array(z.string().uuid()).parse(conceptoIds);
  if (ids.length > 0) {
    const propios = await prisma.concepto_equipo.count({
      where: { id: { in: ids }, company_id: companyId },
    });
    if (propios !== new Set(ids).size)
      throw new Error('Algún concepto no existe o no es de la empresa');
  }

  await assertPerfilResoluble(companyId, ids);

  const perfil = await prisma.costo_tipo_equipo.upsert({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    create: { company_id: companyId, type_id: typeId },
    update: {},
  });

  if (ids.length > 0) {
    await prisma.concepto_tipo_equipo.createMany({
      data: ids.map((conceptoId, idx) => ({
        costo_tipo_equipo_id: perfil.id,
        concepto_equipo_id: conceptoId,
        orden: idx,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return perfil.id;
}

export async function asociarConcepto(perfilId: string, conceptoId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const concepto = await prisma.concepto_equipo.findFirst({
    where: { id: conceptoId, company_id: companyId },
    select: { id: true },
  });
  if (!concepto) throw new Error('Concepto no encontrado o sin acceso');

  const actuales = await prisma.concepto_tipo_equipo.findMany({
    where: { costo_tipo_equipo_id: perfilId },
    select: { concepto_equipo_id: true },
  });
  await assertPerfilResoluble(companyId, [
    ...actuales.map((a) => a.concepto_equipo_id),
    conceptoId,
  ]);
  const cuantos = actuales.length;

  await prisma.concepto_tipo_equipo.create({
    data: { costo_tipo_equipo_id: perfilId, concepto_equipo_id: conceptoId, orden: cuantos },
  });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

export async function desasociarConcepto(asociacionId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const asociacion = await prisma.concepto_tipo_equipo.findUnique({
    where: { id: asociacionId },
    select: { costo_tipo_equipo_id: true },
  });
  if (!asociacion) throw new Error('Asociación no encontrada');
  await assertPerfilPertenece(asociacion.costo_tipo_equipo_id, companyId);

  // Sacar el concepto que le sirve de base a un porcentual deja el perfil irresoluble, y eso
  // ya no se ve: la red de las lecturas lo degradaría a costo cero en silencio.
  const quedan = await prisma.concepto_tipo_equipo.findMany({
    where: { costo_tipo_equipo_id: asociacion.costo_tipo_equipo_id, id: { not: asociacionId } },
    select: { concepto_equipo_id: true },
  });
  await assertPerfilResoluble(
    companyId,
    quedan.map((a) => a.concepto_equipo_id),
    { verbo: 'desasociar' }
  );

  await prisma.concepto_tipo_equipo.delete({ where: { id: asociacionId } });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

/** Deshace la decisión de costear un tipo. Borra el perfil y sus asociaciones. */
export async function eliminarCostoTipoEquipo(perfilId: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  await prisma.costo_tipo_equipo.delete({ where: { id: perfilId } });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}
