'use server';

import { prisma } from '@/shared/lib/prisma';
import { getRequiredActionContext } from '@/shared/lib/server-action-context';
import { assertModuloHabilitado } from '@/modules/costos/shared/utils/access';
import { Decimal, toClientNumber } from '@/modules/costos/shared/utils/decimal';
import { sumarItemsTipo } from '@/modules/costos/shared/utils/calcular-costo-equipo';
import { resolverRefrescoPrecios } from '@/modules/costos/shared/utils/refresco-precios';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type {
  CostoTipoEquipoDetalle,
  ItemCostoTipoClient,
  ItemCostoTipoInput,
  TipoEquipoResumen,
} from '@/modules/costos/shared/types/tipo-equipo.types';

const TIPOS_PATH = '/dashboard/costos/tipos-equipo';
// El costo mensual del listado de equipos se calcula con los ítems del tipo, así que
// toda mutación de ítems acá invalida también esa pantalla.
const EQUIPOS_PATH = '/dashboard/costos/equipos';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const schemaItem = z.object({
  clase: z.enum(['ACCESORIO', 'MANTENIMIENTO']),
  nombre: z.string().min(1).max(200),
  product_id: z.string().uuid().nullable().optional(),
  cantidad: z.number().positive(),
  precio_unitario: z.number().nonnegative(),
  orden: z.number().int().nonnegative().default(0),
  is_active: z.boolean().optional(),
});

// En el alta individual `orden` default a 0 tiene sentido. En el bulk, en cambio, el
// default de Zod se aplicaría durante el parse y `i.orden ?? idx` nunca caería en el
// índice del arreglo: todo ítem sin orden explícito quedaría en 0. Este schema deja
// `orden` genuinamente opcional para que el fallback al índice funcione de verdad.
const schemaItemBulk = schemaItem.omit({ orden: true }).extend({
  orden: z.number().int().nonnegative().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ItemRow = {
  id: string;
  clase: 'ACCESORIO' | 'MANTENIMIENTO';
  nombre: string;
  product_id: string | null;
  cantidad: { toString(): string };
  precio_unitario: { toString(): string };
  precio_actualizado_at: Date | null;
  orden: number;
  is_active: boolean;
  product?: { code: string; name: string; company_id: string } | null;
};

function toItemClient(i: ItemRow, companyId: string): ItemCostoTipoClient {
  const cantidad = toClientNumber(i.cantidad.toString());
  const precio_unitario = toClientNumber(i.precio_unitario.toString());
  // El subtotal se calcula en Decimal, no con aritmética de floats.
  const subtotal = new Decimal(i.cantidad.toString())
    .mul(new Decimal(i.precio_unitario.toString()))
    .toDecimalPlaces(2)
    .toNumber();
  // Defensa en profundidad: aunque las mutaciones ya validan pertenencia antes de
  // escribir, esta lectura no depende de esa invariante. Si el producto vinculado no
  // es de esta empresa, se expone como si no estuviera vinculado.
  const productoPropio = i.product && i.product.company_id === companyId ? i.product : null;
  return {
    id: i.id,
    clase: i.clase,
    nombre: i.nombre,
    product_id: i.product_id,
    product_code: productoPropio?.code ?? null,
    product_name: productoPropio?.name ?? null,
    cantidad,
    precio_unitario,
    subtotal,
    precio_actualizado_at: i.precio_actualizado_at,
    orden: i.orden,
    is_active: i.is_active,
  };
}

async function assertPerfilPertenece(perfilId: string, companyId: string) {
  const perfil = await prisma.costo_tipo_equipo.findFirst({
    where: { id: perfilId, company_id: companyId },
    select: { id: true },
  });
  if (!perfil) throw new Error('Perfil de costo no encontrado o sin acceso');
}

/**
 * Verifica que un product_id exista y pertenezca a la empresa antes de vincularlo a
 * un ítem. Es la primera línea de defensa contra vincular un ítem a un producto
 * ajeno; toItemClient agrega una segunda al leer, por si esta invariante llegara a
 * romperse por otra vía de escritura.
 */
async function assertProductoPertenece(productId: string, companyId: string) {
  const producto = await prisma.products.findFirst({
    where: { id: productId, company_id: companyId },
    select: { id: true },
  });
  if (!producto) throw new Error('Producto no encontrado o sin acceso');
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listTiposEquipoConCosto(): Promise<TipoEquipoResumen[]> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  // type.company_id es nullable: hay tipos globales que usan varias empresas. El
  // listado incluye los tipos propios MÁS los globales que los vehículos de esta
  // empresa efectivamente usan; si no, esos equipos no tendrían dónde cargar sus ítems.
  const conteos = await prisma.vehicles.groupBy({
    by: ['type'],
    where: { company_id: companyId },
    _count: { _all: true },
  });

  const [tipos, perfiles] = await Promise.all([
    prisma.type.findMany({
      where: {
        is_active: true,
        OR: [{ company_id: companyId }, { id: { in: conteos.map((c) => c.type) } }],
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.costo_tipo_equipo.findMany({
      where: { company_id: companyId },
      include: { items: { where: { is_active: true } } },
    }),
  ]);

  const perfilPorTipo = new Map(perfiles.map((p) => [p.type_id, p]));
  const equiposPorTipo = new Map(conteos.map((c) => [c.type, c._count._all]));

  return tipos.map((t) => {
    const perfil = perfilPorTipo.get(t.id);
    const items = perfil?.items ?? [];
    const { accesorios, mantenimiento_anual } = sumarItemsTipo(
      items.map((i) => ({
        clase: i.clase,
        cantidad: i.cantidad.toString(),
        precio_unitario: i.precio_unitario.toString(),
        is_active: i.is_active,
      }))
    );

    return {
      type_id: t.id,
      nombre: t.name,
      perfil_id: perfil?.id ?? null,
      equipos_count: equiposPorTipo.get(t.id) ?? 0,
      accesorios_count: items.filter((i) => i.clase === 'ACCESORIO').length,
      mantenimiento_count: items.filter((i) => i.clase === 'MANTENIMIENTO').length,
      total_accesorios: accesorios.toDecimalPlaces(2).toNumber(),
      mantenimiento_anual: mantenimiento_anual.toDecimalPlaces(2).toNumber(),
    };
  });
}

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
        items: {
          orderBy: [{ clase: 'asc' }, { orden: 'asc' }],
          include: { product: { select: { code: true, name: true, company_id: true } } },
        },
      },
    }),
    prisma.vehicles.count({ where: { company_id: companyId, type: typeId } }),
  ]);

  // La suma va sobre los valores crudos de Prisma (strings), no sobre los numbers ya
  // redondeados de toItemClient: si no, el total arrastra el error de redondeo por ítem.
  const { accesorios, mantenimiento_anual } = sumarItemsTipo(
    (perfil?.items ?? []).map((i) => ({
      clase: i.clase,
      cantidad: i.cantidad.toString(),
      precio_unitario: i.precio_unitario.toString(),
      is_active: i.is_active,
    }))
  );
  const items = (perfil?.items ?? []).map((i) => toItemClient(i, companyId));

  return {
    type_id: tipo.id,
    nombre: tipo.name,
    perfil_id: perfil?.id ?? null,
    equipos_count,
    accesorios: items.filter((i) => i.clase === 'ACCESORIO'),
    mantenimiento: items.filter((i) => i.clase === 'MANTENIMIENTO'),
    total_accesorios: accesorios.toDecimalPlaces(2).toNumber(),
    mantenimiento_anual: mantenimiento_anual.toDecimalPlaces(2).toNumber(),
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Crea el perfil del tipo si todavía no existe. Devuelve su id. */
export async function ensureCostoTipoEquipo(typeId: string): Promise<string> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const tipo = await prisma.type.findFirst({
    where: { id: typeId, OR: [{ company_id: companyId }, { company_id: null }] },
    select: { id: true },
  });
  if (!tipo) throw new Error('Tipo de equipo no encontrado o sin acceso');

  const perfil = await prisma.costo_tipo_equipo.upsert({
    where: { company_id_type_id: { company_id: companyId, type_id: typeId } },
    create: { company_id: companyId, type_id: typeId },
    update: {},
  });
  return perfil.id;
}

export async function addItemCostoTipo(perfilId: string, input: ItemCostoTipoInput) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);
  const parsed = schemaItem.parse(input);
  if (parsed.product_id) {
    await assertProductoPertenece(parsed.product_id, companyId);
  }

  const item = await prisma.item_costo_tipo.create({
    data: {
      costo_tipo_equipo_id: perfilId,
      ...parsed,
      product_id: parsed.product_id ?? null,
      precio_actualizado_at: parsed.product_id ? new Date() : null,
    },
  });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return item.id;
}

export async function updateItemCostoTipo(id: string, input: Partial<ItemCostoTipoInput>) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_costo_tipo.findUnique({
    where: { id },
    select: { costo_tipo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertPerfilPertenece(existing.costo_tipo_equipo_id, companyId);

  const parsed = schemaItem.partial().parse(input);
  if (parsed.product_id) {
    await assertProductoPertenece(parsed.product_id, companyId);
  }
  await prisma.item_costo_tipo.update({ where: { id }, data: parsed });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

export async function deleteItemCostoTipo(id: string) {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);

  const existing = await prisma.item_costo_tipo.findUnique({
    where: { id },
    select: { costo_tipo_equipo_id: true },
  });
  if (!existing) throw new Error('Ítem no encontrado');
  await assertPerfilPertenece(existing.costo_tipo_equipo_id, companyId);

  await prisma.item_costo_tipo.delete({ where: { id } });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
}

/** Carga masiva de ítems (dialog de importación). Retorna la cantidad insertada. */
export async function bulkAddItemsCostoTipo(
  perfilId: string,
  items: ItemCostoTipoInput[]
): Promise<number> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const parsed = z.array(schemaItemBulk).min(1).parse(items);

  // Un producto ajeno vinculado en el lote no debe poder escribirse: una sola query
  // para todos los product_id del lote, comparando cantidad esperada vs. encontrada.
  const productIds = Array.from(
    new Set(parsed.map((i) => i.product_id).filter((id): id is string => !!id))
  );
  if (productIds.length > 0) {
    const encontrados = await prisma.products.count({
      where: { id: { in: productIds }, company_id: companyId },
    });
    if (encontrados !== productIds.length) {
      throw new Error('Producto no encontrado o sin acceso');
    }
  }

  const result = await prisma.item_costo_tipo.createMany({
    data: parsed.map((i, idx) => ({
      costo_tipo_equipo_id: perfilId,
      clase: i.clase,
      nombre: i.nombre,
      product_id: i.product_id ?? null,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      orden: i.orden ?? idx,
      is_active: i.is_active ?? true,
    })),
  });
  revalidatePath(TIPOS_PATH);
  revalidatePath(EQUIPOS_PATH);
  return result.count;
}

/**
 * Refresca el precio de los ítems vinculados a almacén desde products.cost_price.
 * No toca nombre ni cantidad. Devuelve cuántos cambiaron y el delta total en el valor
 * de los ítems. Ojo: ese delta no es anual, porque mezcla accesorios (base amortizable)
 * con mantenimiento (anual); quien lo muestre no debe rotularlo con una unidad.
 */
export async function refrescarPreciosDesdeAlmacen(
  perfilId: string
): Promise<{ actualizados: number; delta_total: number }> {
  const { companyId } = await getRequiredActionContext();
  await assertModuloHabilitado(companyId);
  await assertPerfilPertenece(perfilId, companyId);

  const items = await prisma.item_costo_tipo.findMany({
    where: { costo_tipo_equipo_id: perfilId, product_id: { not: null } },
    select: { id: true, product_id: true, cantidad: true, precio_unitario: true },
  });
  if (items.length === 0) return { actualizados: 0, delta_total: 0 };

  const productos = await prisma.products.findMany({
    where: { id: { in: items.map((i) => i.product_id!) }, company_id: companyId },
    select: { id: true, cost_price: true },
  });
  const precios = new Map(productos.map((p) => [p.id, p.cost_price.toString()]));

  const { actualizados, delta_total } = resolverRefrescoPrecios(
    items.map((i) => ({
      id: i.id,
      product_id: i.product_id,
      cantidad: i.cantidad.toString(),
      precio_unitario: i.precio_unitario.toString(),
    })),
    precios
  );

  if (actualizados.length > 0) {
    const ahora = new Date();
    await prisma.$transaction(
      actualizados.map((a) =>
        prisma.item_costo_tipo.update({
          where: { id: a.id },
          data: { precio_unitario: a.precio_unitario.toFixed(2), precio_actualizado_at: ahora },
        })
      )
    );
    revalidatePath(TIPOS_PATH);
    revalidatePath(EQUIPOS_PATH);
  }

  return {
    actualizados: actualizados.length,
    delta_total: delta_total.toDecimalPlaces(2).toNumber(),
  };
}
