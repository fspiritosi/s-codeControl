'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal } from '@/modules/costos/shared/utils/decimal';
import {
  ordenTopologicoConceptos,
  type ConceptoEquipoCalc,
} from '@/modules/costos/shared/utils/calcular-conceptos-equipo';
import {
  validarParametros,
  derivarCodigo,
  describirCalculo,
} from '@/modules/costos/shared/validators/concepto-equipo';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@/generated/prisma/client';
import { z } from 'zod';
import type {
  ConceptoEquipoClient,
  ConceptoEquipoInput,
} from '@/modules/costos/shared/types/concepto.types';

const CONCEPTOS_PATH = '/dashboard/costos/conceptos';
const TIPOS_PATH = '/dashboard/costos/tipos-equipo';
const EQUIPOS_PATH = '/dashboard/costos/equipos';

const schemaConcepto = z.object({
  nombre: z.string().min(1).max(200),
  clase: z.enum(['ACCESORIO', 'MANTENIMIENTO']),
  clase_calculo: z.enum(['FIJO', 'PCT_VALOR_EQUIPO', 'PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_KM']),
  parametros: z.record(z.unknown()),
  product_id: z.string().uuid().nullable().optional(),
  indice_id: z.string().uuid().nullable().optional(),
  orden: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

type ConceptoRow = {
  id: string;
  codigo: string;
  nombre: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  clase_calculo: 'FIJO' | 'PCT_VALOR_EQUIPO' | 'PCT_CONCEPTO' | 'PCT_SUMA_CONCEPTOS' | 'POR_KM';
  parametros: unknown;
  product_id: string | null;
  indice_id: string | null;
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  product?: { code: string; company_id: string } | null;
  indice?: { nombre: string } | null;
  _count?: { tipos: number };
};

function toConceptoClient(c: ConceptoRow, companyId: string): ConceptoEquipoClient {
  const parametros = (c.parametros ?? {}) as Record<string, unknown>;
  const productoPropio = c.product && c.product.company_id === companyId ? c.product : null;
  return {
    id: c.id,
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
    usado_en_tipos: c._count?.tipos ?? 0,
  };
}

/** Valida pertenencia y devuelve el producto, que en el alta aporta el precio de costo. */
async function assertProductoPertenece(productId: string, companyId: string) {
  const p = await prisma.products.findFirst({
    where: { id: productId, company_id: companyId },
    select: { id: true, cost_price: true },
  });
  if (!p) throw new Error('Producto no encontrado o sin acceso');
  return p;
}

async function assertIndicePertenece(indiceId: string, companyId: string) {
  const i = await prisma.indices.findFirst({
    where: { id: indiceId, company_id: companyId },
    select: { id: true },
  });
  if (!i) throw new Error('Índice no encontrado o sin acceso');
}

/**
 * Verifica que el catálogo resultante siga siendo resoluble: sin referencias colgadas y sin
 * ciclos. Se corre ANTES de escribir, sobre el catálogo completo con el cambio aplicado.
 */
async function assertCatalogoResoluble(
  companyId: string,
  cambio: {
    id?: string;
    codigo: string;
    clase: 'ACCESORIO' | 'MANTENIMIENTO';
    clase_calculo: ConceptoRow['clase_calculo'];
    parametros: Record<string, unknown>;
  }
) {
  // Todos los conceptos, activos e inactivos: es el mismo criterio que usa el motor, que toma
  // al inactivo como existente pero de valor 0. Cargar sólo los activos haría fallar como
  // "referencia inexistente" algo que en tiempo de cálculo resuelve sin problema.
  const existentes = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId },
    select: {
      id: true,
      codigo: true,
      clase: true,
      clase_calculo: true,
      parametros: true,
      is_active: true,
    },
  });

  const conceptos: ConceptoEquipoCalc[] = existentes
    .filter((c) => c.id !== cambio.id)
    .map((c) => ({
      codigo: c.codigo,
      clase: c.clase,
      clase_calculo: c.clase_calculo,
      parametros: (c.parametros ?? {}) as Record<string, unknown>,
      is_active: c.is_active,
    }));

  conceptos.push({
    codigo: cambio.codigo,
    clase: cambio.clase,
    clase_calculo: cambio.clase_calculo,
    parametros: cambio.parametros,
  });

  // Lanza CicloConceptosEquipoError o ReferenciaConceptoEquipoInvalidaError si algo no cierra.
  ordenTopologicoConceptos(conceptos);
}

/**
 * Nombres de los conceptos de la empresa que usan a `codigo` como base, sea con PCT_CONCEPTO o
 * dentro de la lista de un PCT_SUMA_CONCEPTOS.
 */
async function conceptosQueReferencian(
  companyId: string,
  codigo: string,
  excluirId: string
): Promise<string[]> {
  const candidatos = await prisma.concepto_equipo.findMany({
    where: {
      company_id: companyId,
      id: { not: excluirId },
      clase_calculo: { in: ['PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS'] },
    },
    select: { nombre: true, clase_calculo: true, parametros: true },
  });

  return candidatos
    .filter((c) => {
      const p = (c.parametros ?? {}) as Record<string, unknown>;
      if (c.clase_calculo === 'PCT_CONCEPTO') return p.concepto_codigo === codigo;
      return Array.isArray(p.conceptos_codigos) && p.conceptos_codigos.includes(codigo);
    })
    .map((c) => c.nombre);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listConceptos(): Promise<ConceptoEquipoClient[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId },
    include: {
      product: { select: { code: true, company_id: true } },
      indice: { select: { nombre: true } },
      _count: { select: { tipos: true } },
    },
    orderBy: [{ clase: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
  });

  return conceptos.map((c) => toConceptoClient(c as ConceptoRow, companyId));
}

/** Índices de la empresa, para vincularlos a un concepto FIJO y actualizarlo por variación. */
export async function listIndices(): Promise<{ id: string; nombre: string }[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  return prisma.indices.findMany({
    where: { company_id: companyId },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createConcepto(input: ConceptoEquipoInput): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  const parsed = schemaConcepto.parse(input);
  let parametros = validarParametros(parsed.clase_calculo, parsed.parametros);

  // Vincular un producto del almacén significa que el precio lo manda el almacén: se copia
  // en el alta y sólo entonces se sella la fecha, que así refleja un refresco real.
  let precio_actualizado_at: Date | null = null;
  if (parsed.product_id) {
    const producto = await assertProductoPertenece(parsed.product_id, companyId);
    if (parsed.clase_calculo === 'FIJO') {
      parametros = validarParametros('FIJO', {
        ...parametros,
        precio_unitario: producto.cost_price.toString(),
      });
      precio_actualizado_at = new Date();
    }
  }
  if (parsed.indice_id) await assertIndicePertenece(parsed.indice_id, companyId);

  const existentes = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId },
    select: { codigo: true },
  });
  const codigo = derivarCodigo(
    parsed.nombre,
    existentes.map((e) => e.codigo)
  );

  await assertCatalogoResoluble(companyId, {
    codigo,
    clase: parsed.clase,
    clase_calculo: parsed.clase_calculo,
    parametros,
  });

  const creado = await prisma.concepto_equipo.create({
    data: {
      company_id: companyId,
      codigo,
      nombre: parsed.nombre,
      clase: parsed.clase,
      clase_calculo: parsed.clase_calculo,
      parametros: parametros as Prisma.InputJsonObject,
      product_id: parsed.product_id ?? null,
      indice_id: parsed.indice_id ?? null,
      precio_actualizado_at,
      orden: parsed.orden ?? 0,
      is_active: parsed.is_active ?? true,
    },
  });

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return creado.id;
}

export async function updateConcepto(id: string, input: Partial<ConceptoEquipoInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.concepto_equipo.findFirst({
    where: { id, company_id: companyId },
  });
  if (!existente) throw new Error('Concepto no encontrado o sin acceso');

  const parsed = schemaConcepto.partial().parse(input);
  const clase_calculo = parsed.clase_calculo ?? existente.clase_calculo;

  // Los parámetros de una clase no significan nada en otra: convertirlos sería adivinar, y
  // arrastrar los viejos deja el concepto valiendo 0 en silencio. Se rechaza el cambio.
  if (clase_calculo !== existente.clase_calculo && !parsed.parametros) {
    throw new Error('Al cambiar la forma de cálculo hay que indicar los parámetros nuevos');
  }

  const parametros = parsed.parametros
    ? validarParametros(clase_calculo, parsed.parametros)
    : ((existente.parametros ?? {}) as Record<string, unknown>);

  if (parsed.product_id) await assertProductoPertenece(parsed.product_id, companyId);
  if (parsed.indice_id) await assertIndicePertenece(parsed.indice_id, companyId);

  await assertCatalogoResoluble(companyId, {
    id,
    codigo: existente.codigo,
    clase: parsed.clase ?? existente.clase,
    clase_calculo,
    parametros,
  });

  await prisma.concepto_equipo.update({
    where: { id },
    data: {
      nombre: parsed.nombre ?? existente.nombre,
      clase: parsed.clase ?? existente.clase,
      clase_calculo,
      parametros: parametros as Prisma.InputJsonObject,
      product_id: parsed.product_id === undefined ? existente.product_id : parsed.product_id,
      indice_id: parsed.indice_id === undefined ? existente.indice_id : parsed.indice_id,
      orden: parsed.orden ?? existente.orden,
      is_active: parsed.is_active ?? existente.is_active,
    },
  });

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

/**
 * Borra un concepto. Falla si está asociado a algún tipo, y también si otro concepto lo usa
 * como base: borrarlo dejaría esa referencia colgada y el motor lanzaría al resolver el perfil
 * donde vive el que referencia.
 */
export async function deleteConcepto(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existente = await prisma.concepto_equipo.findFirst({
    where: { id, company_id: companyId },
    include: { _count: { select: { tipos: true } } },
  });
  if (!existente) throw new Error('Concepto no encontrado o sin acceso');
  if (existente._count.tipos > 0) {
    throw new Error(
      `No se puede eliminar: el concepto está asociado a ${existente._count.tipos} tipo(s) de equipo`
    );
  }

  const dependientes = await conceptosQueReferencian(companyId, existente.codigo, id);
  if (dependientes.length > 0) {
    throw new Error(
      `No se puede eliminar: lo usan como base ${dependientes.map((n) => `«${n}»`).join(', ')}`
    );
  }

  await prisma.concepto_equipo.delete({ where: { id } });
  revalidatePath(CONCEPTOS_PATH);
}

/** Refresca el precio de los conceptos FIJO vinculados a un producto del almacén. */
export async function refrescarPreciosConceptos(): Promise<{ actualizados: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId, clase_calculo: 'FIJO', product_id: { not: null } },
    select: { id: true, product_id: true, parametros: true },
  });
  if (conceptos.length === 0) return { actualizados: 0 };

  const productos = await prisma.products.findMany({
    where: { id: { in: conceptos.map((c) => c.product_id!) }, company_id: companyId },
    select: { id: true, cost_price: true },
  });
  const precios = new Map(productos.map((p) => [p.id, p.cost_price.toString()]));

  const cambios = conceptos.flatMap((c) => {
    const nuevo = precios.get(c.product_id!);
    if (nuevo == null) return [];
    const p = (c.parametros ?? {}) as Record<string, unknown>;
    if (new Decimal(String(p.precio_unitario ?? 0)).eq(new Decimal(nuevo))) return [];
    return [{ id: c.id, parametros: { ...p, precio_unitario: nuevo } }];
  });

  if (cambios.length > 0) {
    const ahora = new Date();
    await prisma.$transaction(
      cambios.map((c) =>
        prisma.concepto_equipo.update({
          where: { id: c.id },
          data: { parametros: c.parametros, precio_actualizado_at: ahora },
        })
      )
    );
    revalidatePath(CONCEPTOS_PATH);
    revalidatePath(TIPOS_PATH);
    revalidatePath(EQUIPOS_PATH);
  }

  return { actualizados: cambios.length };
}

/**
 * Aplica la variación de un índice a los conceptos FIJO que lo tengan asociado.
 * `variacion` está en porcentaje (4.2 = +4,2%), como en index_values.
 */
export async function aplicarIndiceConceptos(
  indiceId: string,
  anio: number,
  mes: number
): Promise<{ actualizados: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertIndicePertenece(indiceId, companyId);

  const valor = await prisma.index_values.findUnique({
    where: { indice_id_anio_mes: { indice_id: indiceId, anio, mes } },
    select: { variacion: true },
  });
  if (!valor) throw new Error('No hay valor cargado para ese índice en el período indicado');

  const factor = new Decimal(1).add(new Decimal(valor.variacion.toString()).div(100));

  const conceptos = await prisma.concepto_equipo.findMany({
    where: { company_id: companyId, clase_calculo: 'FIJO', indice_id: indiceId },
    select: { id: true, parametros: true },
  });
  if (conceptos.length === 0) return { actualizados: 0 };

  const ahora = new Date();
  await prisma.$transaction(
    conceptos.map((c) => {
      const p = (c.parametros ?? {}) as Record<string, unknown>;
      const nuevo = new Decimal(String(p.precio_unitario ?? 0)).mul(factor).toDecimalPlaces(2);
      return prisma.concepto_equipo.update({
        where: { id: c.id },
        data: {
          parametros: { ...p, precio_unitario: nuevo.toFixed(2) },
          precio_actualizado_at: ahora,
        },
      });
    })
  );

  revalidatePath(CONCEPTOS_PATH);
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return { actualizados: conceptos.length };
}
