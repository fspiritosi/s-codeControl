export function parseCbuInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 22);
}

export function formatCbu(cbu: string | null | undefined): string {
  if (!cbu) return '—';
  const clean = cbu.trim();
  if (clean.length === 0) return '—';
  if (clean.length !== 22) return clean;
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}
