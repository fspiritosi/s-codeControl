import { describe, it, expect } from 'vitest';
import { composicionPDFStrings, type ComposicionPDFData } from './composicion-template';
import { renderComposicionPDF } from './composicion-generator';
import { componerCostos } from '@/modules/costos/shared/utils/calcular-composicion';
import type { ComponerCostosInput } from '@/modules/costos/shared/types/composicion.types';

const INPUT: ComponerCostosInput = {
  servicio_id: 'pecom',
  periodo: '2025-06',
  config_cct_id: 'cct',
  subtotales: {
    mod: '5920054.312596719',
    ocp: '522446.75',
    equipos: '10812700.718452381',
    combustible: '1669506.25',
  },
  margenes: { margen_debcred: 0.01, margen_iibb: 0.03, margen_estructura: 0.05, margen_ganancia: 0.1, licencia_ordenanza: 0.0084 },
  outputs: [
    { id: 'km', codigo: 'KM_EXCEDENTE', nombre: 'Km excedente', formula: { tipo: 'precio_div_kms_x_factor', kms_base: 2500, factor: 0.5 } },
  ],
};

function pdfData(): ComposicionPDFData {
  return {
    company: { name: 'Transporte SP SRL', cuit: '30-12345678-9' },
    customer: { name: 'PECOM' },
    servicio: { nombre: 'RDLS → Bajo del Toro 44+1', cct_codigo: '545/08', cct_nombre: 'UOCRA Petroleros' },
    detalle: componerCostos(INPUT),
  };
}

describe('composicionPDFStrings', () => {
  it('incluye empresa, cliente, servicio, período y montos clave', () => {
    const strings = composicionPDFStrings(pdfData());
    expect(strings).toContain('Transporte SP SRL');
    expect(strings).toContain('PECOM');
    expect(strings).toContain('RDLS → Bajo del Toro 44+1');
    // precio mensual golden formateado en ARS
    expect(strings.some((s) => s.includes('23.560.093'))).toBe(true);
    // el output derivado aparece por nombre
    expect(strings).toContain('Km excedente');
  });
});

describe('renderComposicionPDF', () => {
  it('genera un Buffer PDF válido', async () => {
    const buffer = await renderComposicionPDF(pdfData());
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    // firma de archivo PDF
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
