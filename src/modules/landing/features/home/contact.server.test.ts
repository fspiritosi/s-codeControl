import { beforeEach, describe, expect, it, vi } from 'vitest';

const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: smtp.createTransport } }));

let handle: typeof import('./contact.server').handleContact;
const payload = {
  nombre: 'Ana Pérez',
  empresa: 'Empresa de prueba',
  email: 'ana@example.com',
  interes: 'Software a medida',
  mensaje: 'Quiero coordinar una llamada para mi empresa.',
  website: '',
};
const request = (data: unknown = payload, origin = 'https://www.codecontrol.com.ar') =>
  new Request('https://www.codecontrol.com.ar/api/contact', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('SMTP_HOST', 'smtp.example.com');
  vi.stubEnv('SMTP_PORT', '465');
  vi.stubEnv('SMTP_USER', 'web@example.com');
  vi.stubEnv('SMTP_PASS', 'test-only');
  vi.stubEnv('SMTP_SECURE', '');
  smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail, close: smtp.close });
  smtp.sendMail.mockResolvedValue({ accepted: ['ventas@codecontrol.com.ar'], rejected: [] });
  handle = (await import('./contact.server')).handleContact;
});

describe('contacto público de la landing', () => {
  it('envía solo a ventas con remitente autenticado y reply-to del visitante', async () => {
    expect((await handle(request())).status).toBe(200);
    expect(smtp.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ventas@codecontrol.com.ar',
        from: { name: 'CodeControl Web', address: 'web@example.com' },
        replyTo: { name: 'Ana Pérez', address: 'ana@example.com' },
        text: expect.stringContaining(payload.mensaje),
      })
    );
    expect(smtp.close).toHaveBeenCalledOnce();
  });
  it.each([
    { ...payload, email: 'invalid' },
    { ...payload, nombre: 'Ana\r\nBcc: other@example.com' },
    { ...payload, mensaje: 'corto' },
    { ...payload, interes: 'otro' },
    { ...payload, to: 'other@example.com' },
    { ...payload, website: 'https://spam.example' },
  ])('rechaza datos inválidos o intentos de abuso', async (data) => {
    expect((await handle(request(data))).status).toBe(400);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it('rechaza otro origen', async () => {
    expect((await handle(request(payload, 'https://other.example'))).status).toBe(403);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it('rechaza cuerpos grandes incluso sin Content-Length', async () => {
    expect((await handle(request({ ...payload, mensaje: 'x'.repeat(20_000) }))).status).toBe(413);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it('informa configuración faltante sin fingir envío', async () => {
    vi.stubEnv('SMTP_PASS', '');
    expect((await handle(request())).status).toBe(503);
    expect(smtp.sendMail).not.toHaveBeenCalled();
  });
  it('no confirma éxito si el destinatario fue rechazado', async () => {
    smtp.sendMail.mockResolvedValue({ accepted: [], rejected: ['ventas@codecontrol.com.ar'] });
    expect((await handle(request())).status).toBe(502);
  });
  it('no expone errores internos SMTP', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    smtp.sendMail.mockRejectedValue(new Error('SMTP sensitive details'));
    const response = await handle(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('sensitive details');
    expect(smtp.close).toHaveBeenCalledOnce();
    log.mockRestore();
  });
  it('limita los intentos repetidos', async () => {
    for (let i = 0; i < 3; i++) expect((await handle(request())).status).toBe(200);
    expect((await handle(request())).status).toBe(429);
    expect(smtp.sendMail).toHaveBeenCalledTimes(3);
  });
  it('usa STARTTLS para el puerto 587', async () => {
    vi.stubEnv('SMTP_PORT', '587');
    await handle(request());
    expect(smtp.createTransport).toHaveBeenCalledWith(expect.objectContaining({ secure: false, requireTLS: true }));
  });
});
