// Viaje redondo de la fecha de ingreso entre la base y el legajo, en la zona
// horaria de los usuarios. Reproduce el tkt-648: el dato se guardaba bien pero
// el legajo mostraba el dia anterior, y el usuario lo leia como que su cambio
// no se habia guardado.
process.env.TZ = 'America/Argentina/Buenos_Aires';

import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { parseEmployeeDate } from './employee-dates';
import { toISODate } from './employee-update';

/** Lo que Prisma devuelve para una columna `@db.Date`: medianoche UTC. */
const comoLoDevuelvePrisma = (dia: string) => new Date(`${dia}T00:00:00.000Z`);

/** `src/app/dashboard/employee/action/page.tsx` serializa asi para el form. */
const comoLoSerializaLaPagina = (fecha: Date) => fecha.toISOString().split('T')[0];

/** Lo que Postgres termina guardando en una columna `@db.Date`. */
const comoLoGuardaPostgres = (iso: string) => iso.split('T')[0];

describe('fecha de ingreso: viaje redondo base -> legajo -> base', () => {
  const enLaBase = '2025-12-01';

  it('el legajo muestra el mismo dia que hay guardado', () => {
    const delForm = comoLoSerializaLaPagina(comoLoDevuelvePrisma(enLaBase));

    const loQueVeElUsuario = format(parseEmployeeDate(delForm)!, 'dd/MM/yyyy');

    expect(loQueVeElUsuario).toBe('01/12/2025');
  });

  it('guardar sin tocar el datepicker no corre el dia', () => {
    const delForm = comoLoSerializaLaPagina(comoLoDevuelvePrisma(enLaBase));

    const guardado = comoLoGuardaPostgres(toISODate(delForm)!);

    expect(guardado).toBe(enLaBase);
  });

  it('guardar la fecha elegida en el datepicker persiste ese mismo dia', () => {
    // react-day-picker entrega la medianoche local del dia clickeado.
    const elegidoEnElPicker = new Date(2025, 11, 1);

    const guardado = comoLoGuardaPostgres(toISODate(elegidoEnElPicker)!);

    expect(guardado).toBe('2025-12-01');
  });

  it('lo elegido, lo guardado y lo mostrado despues coinciden', () => {
    const elegidoEnElPicker = new Date(2025, 11, 1);

    const guardado = comoLoGuardaPostgres(toISODate(elegidoEnElPicker)!);
    const alRecargar = comoLoSerializaLaPagina(comoLoDevuelvePrisma(guardado));
    const loQueVeElUsuario = format(parseEmployeeDate(alRecargar)!, 'dd/MM/yyyy');

    expect(loQueVeElUsuario).toBe(format(elegidoEnElPicker, 'dd/MM/yyyy'));
  });
});
