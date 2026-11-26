import { describe, expect, it } from 'vitest';
import { invoiceAmountInOrderCurrency, invoiceNeedsOrderRate, resolveInvoiceOrderRates } from './currency-conversion';

describe('invoiceNeedsOrderRate', () => {
  it('pide TC solo para una factura en pesos de una OC en moneda extranjera', () => {
    expect(invoiceNeedsOrderRate('ARS', 'USD')).toBe(true);
    expect(invoiceNeedsOrderRate('ARS', 'ARS')).toBe(false);
    expect(invoiceNeedsOrderRate('USD', 'USD')).toBe(false);
    // Factura en USD contra OC en pesos: usa el exchange_rate propio de la factura.
    expect(invoiceNeedsOrderRate('USD', 'ARS')).toBe(false);
  });

  it('trata una moneda vacía como pesos', () => {
    expect(invoiceNeedsOrderRate(null, 'USD')).toBe(true);
  });
});

describe('resolveInvoiceOrderRates', () => {
  const inv = (id: string, currency: string, order_exchange_rate: number | null = null) => ({
    id,
    full_number: `0001-${id}`,
    currency,
    order_exchange_rate,
  });

  it('usa el TC ingresado para las facturas en pesos de una OC en USD', () => {
    const res = resolveInvoiceOrderRates([inv('a', 'ARS'), inv('b', 'ARS')], 'USD', { a: 1187.5, b: 1200 });
    expect(res).toEqual({ ok: true, rates: { a: 1187.5, b: 1200 } });
  });

  it('el TC ingresado reemplaza al que la factura ya tenía', () => {
    const res = resolveInvoiceOrderRates([inv('a', 'ARS', 1000)], 'USD', { a: 1187.5 });
    expect(res).toEqual({ ok: true, rates: { a: 1187.5 } });
  });

  it('si no se ingresa TC conserva el que la factura ya tenía', () => {
    const res = resolveInvoiceOrderRates([inv('a', 'ARS', 1150)], 'USD', {});
    expect(res).toEqual({ ok: true, rates: { a: 1150 } });
  });

  it('falla y nombra las facturas sin TC válido', () => {
    const res = resolveInvoiceOrderRates([inv('a', 'ARS'), inv('b', 'ARS', 1)], 'USD', { a: 0 });
    expect(res).toEqual({ ok: false, missing: ['0001-a', '0001-b'] });
  });

  it('no pide TC a facturas en la misma moneda que la OC ni en una OC en pesos', () => {
    expect(resolveInvoiceOrderRates([inv('a', 'USD')], 'USD', {})).toEqual({ ok: true, rates: {} });
    expect(resolveInvoiceOrderRates([inv('a', 'ARS'), inv('b', 'USD')], 'ARS', {})).toEqual({ ok: true, rates: {} });
  });
});

describe('invoiceAmountInOrderCurrency', () => {
  it('convierte la factura en pesos a dólares con su TC (caso del cliente)', () => {
    const amount = invoiceAmountInOrderCurrency(
      29_718_975,
      { currency: 'ARS', exchange_rate: 1, order_exchange_rate: 1187.5 },
      { currency: 'USD', exchange_rate: 1150 }
    );
    expect(amount).toBe(25_026.51);
  });
});
