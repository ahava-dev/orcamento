export function brl(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmt(n: number | null | undefined, casas = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
}

/** Aceita "2,5", "2.5" e "1.411,5". Vazio ou inválido vira null. */
export function parseNum(s: string): number | null {
  let t = s.trim();
  if (t === '') return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function numTxt(n: number | null | undefined): string {
  return n == null ? '' : String(n).replace('.', ',');
}

/** Horas decimais para hh:mm:ss. */
export function relogio(horas: number): string {
  const total = Math.max(0, Math.floor(horas * 3600));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}
