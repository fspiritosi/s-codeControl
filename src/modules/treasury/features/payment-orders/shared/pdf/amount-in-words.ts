/**
 * Convierte un importe numérico a su representación textual en español (Argentina).
 * Formato: "PESOS <enteros> CON <centavos>/100"
 */

const UNITS = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISEIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
  'VEINTE',
  'VEINTIUNO',
  'VEINTIDOS',
  'VEINTITRES',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISEIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
];

const TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];

const HUNDREDS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function below100(n: number): string {
  if (n < 30) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]} Y ${UNITS[u]}`;
}

function below1000(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r === 0 ? HUNDREDS[h] : `${HUNDREDS[h]} ${below100(r)}`.trim();
}

function belowMillion(n: number): string {
  if (n === 0) return '';
  if (n < 1000) return below1000(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const thousandsText = thousands === 1 ? 'MIL' : `${below1000(thousands)} MIL`;
  return rest === 0 ? thousandsText : `${thousandsText} ${below1000(rest)}`;
}

function integerToWords(n: number): string {
  if (n === 0) return 'CERO';
  if (n < 1_000_000) return belowMillion(n);
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millionsText = millions === 1 ? 'UN MILLON' : `${belowMillion(millions)} MILLONES`;
  return rest === 0 ? millionsText : `${millionsText} ${belowMillion(rest)}`;
}

export function amountToSpanishWords(amount: number): string {
  const safe = Math.abs(Math.round(amount * 100) / 100);
  const integerPart = Math.floor(safe);
  const cents = Math.round((safe - integerPart) * 100);
  const words = integerToWords(integerPart).replace(/\s+/g, ' ').trim();
  const centsStr = String(cents).padStart(2, '0');
  return `PESOS ${words} CON ${centsStr}/100`;
}
