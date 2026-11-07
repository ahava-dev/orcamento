export type Config = {
  valor_hora: number;
  margem_padrao: number;
  taxa_maquininha: number;
  energia_mes: number;
  ferramentas_mes: number;
  horas_mes: number;
};

export type FioCalib = {
  metros_rolo: number;
  tara_g: number;
  peso_fechado_g: number | null;
};

/** Gramas de fio num rolo fechado (peso do rolo - tubo). */
export function gramasDeFio(f: FioCalib): number | null {
  if (f.peso_fechado_g == null) return null;
  const g = f.peso_fechado_g - f.tara_g;
  return g > 0 ? g : null;
}

/** Metros por grama de fio. Null se o fio não foi calibrado. */
export function metrosPorGrama(f: FioCalib): number | null {
  const g = gramasDeFio(f);
  if (g == null || f.metros_rolo <= 0) return null;
  return f.metros_rolo / g;
}

/** Metros gastos: metros informados à mão, ou (peso antes - depois) x m/g. */
export function metrosConsumidos(i: {
  antes: number | null;
  depois: number | null;
  metrosManual: number | null;
  mPorG: number | null;
}): number | null {
  if (i.metrosManual != null) return i.metrosManual >= 0 ? i.metrosManual : null;
  if (i.antes == null || i.depois == null || i.mPorG == null) return null;
  const g = i.antes - i.depois;
  return g >= 0 ? g * i.mPorG : null;
}

export function custoPorMetro(preco: number, metros: number): number {
  return metros > 0 ? preco / metros : 0;
}

/** Energia + ferramentas do mês divididos pelas horas trabalhadas no mês. */
export function custoFixoPorHora(
  c: Pick<Config, 'energia_mes' | 'ferramentas_mes' | 'horas_mes'>
): number {
  return c.horas_mes > 0 ? (c.energia_mes + c.ferramentas_mes) / c.horas_mes : 0;
}

export function calcularCustos(i: {
  custoFio: number;
  custoMateriais: number;
  horas: number;
  maoObraFechada: number | null;
  valorHora: number;
  fixoPorHora: number;
}) {
  const maoObra = i.maoObraFechada != null ? i.maoObraFechada : i.horas * i.valorHora;
  const fixos = i.horas * i.fixoPorHora;
  const total = i.custoFio + i.custoMateriais + maoObra + fixos;
  return { fio: i.custoFio, materiais: i.custoMateriais, maoObra, fixos, total };
}

/** preço = custo / (1 - margem - taxa). Null se margem + taxa >= 100%. */
export function precoSugerido(custo: number, margemPct: number, taxaPct: number): number | null {
  const d = 1 - (margemPct + taxaPct) / 100;
  return d > 0 ? custo / d : null;
}

/** Peso esperado na balança (fio restante + tubo). */
export function pesoSugeridoAntes(
  saldoM: number,
  mPorG: number | null,
  taraG: number
): number | null {
  if (mPorG == null || mPorG <= 0) return null;
  return saldoM / mPorG + taraG;
}
