import { describe, it, expect } from 'vitest';
import { agruparOCP, type ItemOCPCalc } from './calcular-ocp';

// ─── Fixture golden: OCP del servicio PECOM RDLS-BDT 44+1 (Jun 2025) ───────────
// Transcrito de composicion-pecom-*.xls, hoja "OCP". cantidad_personas = 1.5 (relevos).
const PECOM_OCP: ItemOCPCalc[] = [
  // Vestimenta (total anual 2.044.320)
  { grupo: 'vestimenta', costo_anual: '75600', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '186960', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '137700', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '678000', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '274500', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '190000', cantidad_personas: '1.5' },
  { grupo: 'vestimenta', costo_anual: '501560', cantidad_personas: '1.5' },
  // EPP (total anual 826.692)
  { grupo: 'epp', costo_anual: '40600', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '288792', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '165200', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '82800', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '14400', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '134400', cantidad_personas: '1.5' },
  { grupo: 'epp', costo_anual: '100500', cantidad_personas: '1.5' },
  // Médicos
  { grupo: 'medicos', costo_anual: '680000', cantidad_personas: '1.5' },
  // Carnet (total anual 628.562)
  { grupo: 'carnet', costo_anual: '353112', cantidad_personas: '1.5' },
  { grupo: 'carnet', costo_anual: '275450', cantidad_personas: '1.5' },
];

describe('agruparOCP', () => {
  it('provisión mensual = Σ(costo_anual × personas) / 12 por grupo', () => {
    const items: ItemOCPCalc[] = [
      { grupo: 'vestimenta', costo_anual: '120000', cantidad_personas: '1' },
      { grupo: 'vestimenta', costo_anual: '60000', cantidad_personas: '2' },
    ];
    const { por_grupo, total_ocp } = agruparOCP(items);
    // (120000×1 + 60000×2) / 12 = 240000/12 = 20000
    expect(por_grupo[0].provision_mensual.toNumber()).toBe(20000);
    expect(total_ocp.toNumber()).toBe(20000);
  });

  it('excluye ítems inactivos', () => {
    const items: ItemOCPCalc[] = [
      { grupo: 'epp', costo_anual: '120000', cantidad_personas: '1', is_active: true },
      { grupo: 'epp', costo_anual: '999999', cantidad_personas: '1', is_active: false },
    ];
    expect(agruparOCP(items).total_ocp.toNumber()).toBe(10000);
  });

  it('golden — OCP PECOM RDLS-BDT 44+1 → $522.446,75', () => {
    const { por_grupo, total_ocp } = agruparOCP(PECOM_OCP);
    expect(total_ocp.toDecimalPlaces(2).toNumber()).toBe(522446.75);

    const vest = por_grupo.find((g) => g.grupo === 'vestimenta')!;
    expect(vest.provision_mensual.toDecimalPlaces(2).toNumber()).toBe(255540);
    const carnet = por_grupo.find((g) => g.grupo === 'carnet')!;
    expect(carnet.provision_mensual.toDecimalPlaces(2).toNumber()).toBe(78570.25);
  });
});
