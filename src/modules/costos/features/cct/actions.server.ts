'use server';

import { prisma } from '@/shared/lib/prisma';
import { getActionContext } from '@/shared/lib/server-action-context';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import type { ConfigCCTClient, CategoriaCCTClient, ConceptoCCTClient, TopeImponibleClient } from '../../shared/types/cct.types';

function requireCompanyId(companyId: string | undefined): string {
  if (!companyId) throw new Error('No hay empresa activa en sesión');
  return companyId;
}

// ─── Schemas de validación ────────────────────────────────────────────────────

const schemaNuevoCCT = z.object({
  cct_codigo: z.string().min(1).max(20),
  cct_nombre: z.string().min(1).max(100),
  vigencia_desde: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  descripcion: z.string().optional(),
});

const schemaCategoria = z.object({
  config_cct_id: z.string().uuid(),
  codigo: z.string().min(1).max(20),
  nombre: z.string().min(1).max(100),
  orden: z.number().int().default(0),
});

const schemaConcepto = z.object({
  config_cct_id: z.string().uuid(),
  codigo: z.string().min(1).max(30),
  nombre: z.string().min(1).max(100),
  tipo: z.enum(['remunerativo', 'no_remunerativo', 'descuento', 'aporte_patronal', 'provision', 'prevision', 'ausentismo']),
  aplica_en: z.array(z.enum(['mod_servicio', 'liquidacion'])),
  clase_calculo: z.enum(['FIJO_GLOBAL', 'FIJO_POR_CATEGORIA', 'PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_ANTIGUEDAD_VALOR', 'POR_ANTIGUEDAD_PCT', 'POR_UNIDAD']),
  parametros: z.record(z.unknown()).default({}),
  orden: z.number().int().default(0),
});

const schemaValorCategoria = z.object({
  concepto_cct_id: z.string().uuid(),
  categoria_cct_id: z.string().uuid(),
  valor: z.number().positive(),
});

const schemaTope = z.object({
  codigo: z.string().min(1).max(50),
  vigencia_desde: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  valor: z.number().positive(),
  fuente: z.string().optional(),
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listarCCTs(): Promise<ConfigCCTClient[]> {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const rows = await prisma.config_cct.findMany({
    where: { company_id: companyId },
    include: {
      categorias: { orderBy: { orden: 'asc' } },
      conceptos: {
        where: { is_active: true },
        orderBy: { orden: 'asc' },
        include: { valores: true },
      },
    },
    orderBy: [{ cct_codigo: 'asc' }, { vigencia_desde: 'desc' }],
  });

  return rows.map((r) => ({
    ...r,
    categorias: r.categorias as CategoriaCCTClient[],
    conceptos: r.conceptos.map((c) => ({
      ...c,
      parametros: c.parametros as ConceptoCCTClient['parametros'],
      valores: c.valores.map((v) => ({ ...v, valor: Number(v.valor) })),
    })),
  }));
}

export async function getCCTConConceptos(cctId: string): Promise<ConfigCCTClient | null> {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const row = await prisma.config_cct.findFirst({
    where: { id: cctId, company_id: companyId },
    include: {
      categorias: { orderBy: { orden: 'asc' } },
      conceptos: {
        orderBy: { orden: 'asc' },
        include: { valores: true },
      },
    },
  });
  if (!row) return null;

  return {
    ...row,
    categorias: row.categorias as CategoriaCCTClient[],
    conceptos: row.conceptos.map((c) => ({
      ...c,
      parametros: c.parametros as ConceptoCCTClient['parametros'],
      valores: c.valores.map((v) => ({ ...v, valor: Number(v.valor) })),
    })),
  };
}

export async function listarTopes(): Promise<TopeImponibleClient[]> {
  const rows = await prisma.tope_imponible.findMany({
    orderBy: [{ codigo: 'asc' }, { vigencia_desde: 'desc' }],
  });
  return rows.map((r) => ({ ...r, valor: Number(r.valor) }));
}

// ─── Mutations: config_cct ────────────────────────────────────────────────────

export async function crearCCT(data: z.infer<typeof schemaNuevoCCT>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const parsed = schemaNuevoCCT.parse(data);

  // Solo puede haber un CCT activo por código por empresa
  await prisma.config_cct.updateMany({
    where: { company_id: companyId, cct_codigo: parsed.cct_codigo, vigencia_hasta: null },
    data: { vigencia_hasta: parsed.vigencia_desde, is_active: false },
  });

  const cct = await prisma.config_cct.create({
    data: { ...parsed, company_id: companyId },
  });

  revalidatePath('/dashboard/costos/configuracion-cct');
  return cct;
}

export async function clonarParitaria(cctOrigenId: string, nuevaVigencia: string) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);

  const origen = await prisma.config_cct.findFirst({
    where: { id: cctOrigenId, company_id: companyId },
    include: {
      categorias: true,
      conceptos: { include: { valores: true } },
    },
  });
  if (!origen) throw new Error('CCT origen no encontrado');

  // Cerrar el origen
  await prisma.config_cct.update({
    where: { id: cctOrigenId },
    data: { vigencia_hasta: nuevaVigencia, is_active: false },
  });

  // Crear nueva paritaria
  const nuevo = await prisma.config_cct.create({
    data: {
      company_id: companyId,
      cct_codigo: origen.cct_codigo,
      cct_nombre: origen.cct_nombre,
      vigencia_desde: nuevaVigencia,
      vigencia_hasta: null,
      is_active: true,
      descripcion: origen.descripcion,
    },
  });

  // Clonar categorías y mapear IDs viejos → nuevos
  const mapCategorias = new Map<string, string>();
  for (const cat of origen.categorias) {
    const nueva = await prisma.categoria_cct.create({
      data: { config_cct_id: nuevo.id, codigo: cat.codigo, nombre: cat.nombre, orden: cat.orden },
    });
    mapCategorias.set(cat.id, nueva.id);
  }

  // Clonar conceptos
  for (const concepto of origen.conceptos) {
    const nuevoConcepto = await prisma.concepto_cct.create({
      data: {
        config_cct_id: nuevo.id,
        codigo: concepto.codigo,
        nombre: concepto.nombre,
        tipo: concepto.tipo,
        aplica_en: concepto.aplica_en,
        clase_calculo: concepto.clase_calculo,
        parametros: (concepto.parametros ?? {}) as Prisma.InputJsonValue,
        orden: concepto.orden,
        is_active: concepto.is_active,
      },
    });
    for (const val of concepto.valores) {
      const nuevaCatId = mapCategorias.get(val.categoria_cct_id);
      if (nuevaCatId) {
        await prisma.valor_concepto_categoria.create({
          data: { concepto_cct_id: nuevoConcepto.id, categoria_cct_id: nuevaCatId, valor: val.valor },
        });
      }
    }
  }

  revalidatePath('/dashboard/costos/configuracion-cct');
  return nuevo;
}

// ─── Mutations: categorías ────────────────────────────────────────────────────

export async function crearCategoria(data: z.infer<typeof schemaCategoria>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const parsed = schemaCategoria.parse(data);
  await assertCCTPertenece(parsed.config_cct_id, companyId);

  const cat = await prisma.categoria_cct.create({ data: parsed });
  revalidatePath('/dashboard/costos/configuracion-cct');
  return cat;
}

export async function actualizarCategoria(id: string, data: Partial<z.infer<typeof schemaCategoria>>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const cat = await prisma.categoria_cct.findUniqueOrThrow({ where: { id } });
  await assertCCTPertenece(cat.config_cct_id, companyId);

  const updated = await prisma.categoria_cct.update({ where: { id }, data });
  revalidatePath('/dashboard/costos/configuracion-cct');
  return updated;
}

export async function eliminarCategoria(id: string) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const cat = await prisma.categoria_cct.findUniqueOrThrow({ where: { id } });
  await assertCCTPertenece(cat.config_cct_id, companyId);

  await prisma.categoria_cct.delete({ where: { id } });
  revalidatePath('/dashboard/costos/configuracion-cct');
}

// ─── Mutations: conceptos ─────────────────────────────────────────────────────

export async function crearConcepto(data: z.infer<typeof schemaConcepto>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const parsed = schemaConcepto.parse(data);
  await assertCCTPertenece(parsed.config_cct_id, companyId);
  await validarParametrosConcepto(parsed);

  const concepto = await prisma.concepto_cct.create({
    data: { ...parsed, parametros: parsed.parametros as Prisma.InputJsonValue },
  });
  revalidatePath('/dashboard/costos/configuracion-cct');
  return concepto;
}

export async function actualizarConcepto(id: string, data: Partial<z.infer<typeof schemaConcepto>>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const concepto = await prisma.concepto_cct.findUniqueOrThrow({ where: { id } });
  await assertCCTPertenece(concepto.config_cct_id, companyId);

  const updated = await prisma.concepto_cct.update({
    where: { id },
    data: { ...data, parametros: data.parametros ? (data.parametros as Prisma.InputJsonValue) : undefined },
  });
  revalidatePath('/dashboard/costos/configuracion-cct');
  return updated;
}

export async function toggleConcepto(id: string, is_active: boolean) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const concepto = await prisma.concepto_cct.findUniqueOrThrow({ where: { id } });
  await assertCCTPertenece(concepto.config_cct_id, companyId);

  await prisma.concepto_cct.update({ where: { id }, data: { is_active } });
  revalidatePath('/dashboard/costos/configuracion-cct');
}

// ─── Mutations: valores por categoría ────────────────────────────────────────

export async function upsertValorCategoria(data: z.infer<typeof schemaValorCategoria>) {
  const { companyId: rawId } = await getActionContext();
  const companyId = requireCompanyId(rawId);
  const parsed = schemaValorCategoria.parse(data);

  const concepto = await prisma.concepto_cct.findUniqueOrThrow({ where: { id: parsed.concepto_cct_id } });
  await assertCCTPertenece(concepto.config_cct_id, companyId);

  await prisma.valor_concepto_categoria.upsert({
    where: {
      concepto_cct_id_categoria_cct_id: {
        concepto_cct_id: parsed.concepto_cct_id,
        categoria_cct_id: parsed.categoria_cct_id,
      },
    },
    create: parsed,
    update: { valor: parsed.valor },
  });
  revalidatePath('/dashboard/costos/configuracion-cct');
}

// ─── Mutations: topes imponibles ──────────────────────────────────────────────

export async function crearTope(data: z.infer<typeof schemaTope>) {
  const parsed = schemaTope.parse(data);
  const tope = await prisma.tope_imponible.create({ data: parsed });
  revalidatePath('/dashboard/costos/topes-imponibles');
  return tope;
}

export async function actualizarTope(id: string, data: Partial<z.infer<typeof schemaTope>>) {
  const tope = await prisma.tope_imponible.update({ where: { id }, data });
  revalidatePath('/dashboard/costos/topes-imponibles');
  return tope;
}

// ─── Helper de autorización ───────────────────────────────────────────────────

async function assertCCTPertenece(cctId: string, companyId: string) {
  const cct = await prisma.config_cct.findFirst({ where: { id: cctId, company_id: companyId } });
  if (!cct) throw new Error('CCT no encontrado o sin acceso');
}

async function validarParametrosConcepto(data: z.infer<typeof schemaConcepto>) {
  if (['PCT_CONCEPTO', 'PCT_SUMA_CONCEPTOS', 'POR_ANTIGUEDAD_PCT'].includes(data.clase_calculo)) {
    const cct = await prisma.config_cct.findUniqueOrThrow({
      where: { id: data.config_cct_id },
      include: { conceptos: { select: { codigo: true } } },
    });
    const codigos = new Set(cct.conceptos.map((c) => c.codigo));

    if (data.clase_calculo === 'PCT_CONCEPTO') {
      const { concepto_codigo } = data.parametros as { concepto_codigo: string };
      if (!codigos.has(concepto_codigo))
        throw new Error(`Concepto referenciado '${concepto_codigo}' no existe en este CCT`);
    }
    if (data.clase_calculo === 'PCT_SUMA_CONCEPTOS') {
      const { conceptos_codigos } = data.parametros as { conceptos_codigos: string[] };
      for (const cod of conceptos_codigos) {
        if (!codigos.has(cod)) throw new Error(`Concepto referenciado '${cod}' no existe en este CCT`);
      }
    }
    if (data.clase_calculo === 'POR_ANTIGUEDAD_PCT') {
      const { concepto_base_codigo } = data.parametros as { concepto_base_codigo: string };
      if (!codigos.has(concepto_base_codigo))
        throw new Error(`Concepto base '${concepto_base_codigo}' no existe en este CCT`);
    }
  }
}
