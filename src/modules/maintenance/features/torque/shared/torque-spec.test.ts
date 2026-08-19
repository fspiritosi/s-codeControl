import { describe, expect, it } from 'vitest';
import {
  TORQUE_CHECK_ITEMS,
  PREVIOUS_CHECK_KEYS,
  TIGHTENING_CHECK_KEYS,
  formatTorqueRange,
  checkLabel,
} from './torque-spec';

describe('catálogo de ítems', () => {
  it('tiene 7 verificaciones previas y 8 de apriete', () => {
    expect(PREVIOUS_CHECK_KEYS).toHaveLength(7);
    expect(TIGHTENING_CHECK_KEYS).toHaveLength(8);
    expect(TORQUE_CHECK_ITEMS).toHaveLength(15);
  });

  it('no repite claves', () => {
    const keys = TORQUE_CHECK_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('devuelve la etiqueta de una clave y la clave misma si no existe', () => {
    expect(checkLabel('epp')).toBe('Elementos de Protección Personal (EPP)');
    expect(checkLabel('inexistente')).toBe('inexistente');
  });
});

describe('formatTorqueRange', () => {
  it('arma el texto con Nm y ft-lbs como en el papel', () => {
    expect(
      formatTorqueRange({ nm_min: 150, nm_max: 170, ftlb_min: 111, ftlb_max: 125 })
    ).toBe('150-170 Nm (111-125 ft-lbs)');
  });

  it('omite los ft-lbs si no están cargados', () => {
    expect(
      formatTorqueRange({ nm_min: 500, nm_max: 600, ftlb_min: null, ftlb_max: null })
    ).toBe('500-600 Nm');
  });
});
