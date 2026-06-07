import { Decimal } from './decimal';
import { prisma } from '@/shared/lib/prisma';
import type { ResumenOCP, ResumenOCPGrupo, ItemOCPClient } from '@/modules/costos/shared/types/ocp.types';

type Num = Decimal | string | number;

export type ItemOCPCalc = {
  grupo: string;
  costo_anual: Num;
  cantidad_personas: Num;
  is_active?: boolean | null;
};

/**
 * Agrupa ítems OCP y calcula la provisión mensual por grupo y total.
 *
 *   total_anual_grupo = Σ (costo_anual × cantidad_personas)   [ítems activos]
 *   provision_mensual_grupo = total_anual_grupo / 12
 *   total_ocp = Σ provision_mensual_grupo
 *
 * Función pura — reproduce el "RESUMEN" de la planilla del cliente.
 */
export function agruparOCP<T extends ItemOCPCalc>(
  items: T[]
): { por_grupo: { grupo: string; items: T[]; total_anual: Decimal; provision_mensual: Decimal }[]; total_ocp: Decimal } {
  const activos = items.filter((i) => i.is_active !== false);
  const grupos = new Map<string, T[]>();
  for (const item of activos) {
    const arr = grupos.get(item.grupo) ?? [];
    arr.push(item);
    grupos.set(item.grupo, arr);
  }

  const por_grupo = Array.from(grupos.entries()).map(([grupo, grupoItems]) => {
    const total_anual = grupoItems.reduce(
      (acc, i) => acc.add(new Decimal(i.costo_anual).mul(new Decimal(i.cantidad_personas))),
      new Decimal(0)
    );
    return { grupo, items: grupoItems, total_anual, provision_mensual: total_anual.div(12) };
  });

  const total_ocp = por_grupo.reduce((acc, g) => acc.add(g.provision_mensual), new Decimal(0));
  return { por_grupo, total_ocp };
}

/** Versión que consulta la DB y retorna el resumen client-safe (Decimal → number). */
export async function calcularOCP(servicioId: string): Promise<ResumenOCP> {
  const items = await prisma.item_ocp.findMany({ where: { servicio_id: servicioId, is_active: true } });

  const { por_grupo, total_ocp } = agruparOCP(
    items.map((i) => ({
      grupo: i.grupo,
      costo_anual: i.costo_anual.toString(),
      cantidad_personas: i.cantidad_personas.toString(),
      is_active: i.is_active,
      _raw: i,
    }))
  );

  const gruposClient: ResumenOCPGrupo[] = por_grupo.map((g) => ({
    grupo: g.grupo,
    items: g.items.map((gi): ItemOCPClient => ({
      ...gi._raw,
      costo_anual: new Decimal(gi._raw.costo_anual.toString()).toNumber(),
      cantidad_personas: new Decimal(gi._raw.cantidad_personas.toString()).toNumber(),
    })),
    total_anual: g.total_anual.toDecimalPlaces(2).toNumber(),
    provision_mensual: g.provision_mensual.toDecimalPlaces(2).toNumber(),
  }));

  return {
    servicio_id: servicioId,
    por_grupo: gruposClient,
    total_ocp: total_ocp.toDecimalPlaces(2).toNumber(),
  };
}
