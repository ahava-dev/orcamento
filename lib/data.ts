import type { SupabaseClient } from '@supabase/supabase-js';
import type { Config } from './calc';
import type { RoloComSaldo } from './types';

export const CONFIG_PADRAO: Config = {
  valor_hora: 0,
  margem_padrao: 30,
  taxa_maquininha: 0,
  energia_mes: 0,
  ferramentas_mes: 0,
  horas_mes: 160,
};

export async function carregarConfig(sb: SupabaseClient): Promise<Config> {
  const { data } = await sb.from('configuracoes').select('*').eq('id', 1).maybeSingle();
  return { ...CONFIG_PADRAO, ...(data ?? {}) };
}

/** Rolos com saldo (metros do rolo - metros das peças finalizadas) e histórico. */
export async function carregarRolos(sb: SupabaseClient): Promise<RoloComSaldo[]> {
  const [r, l] = await Promise.all([
    sb.from('rolos').select('*, fio:fios(*)').order('created_at', { ascending: false }),
    sb.from('lancamentos_fio').select('rolo_id, metros, peca_id, peca:pecas(id, nome, status)'),
  ]);
  const lanc = (l.data ?? []) as any[];
  return ((r.data ?? []) as any[]).map((ro) => {
    const meus = lanc.filter((x) => x.rolo_id === ro.id);
    const usado = meus.reduce((s, x) => s + (x.metros ?? 0), 0);
    return {
      ...ro,
      usado_m: usado,
      saldo_m: ro.metros - usado,
      em_uso: meus.some((x) => x.metros == null),
      historico: meus
        .filter((x) => x.metros != null)
        .map((x) => ({ peca_id: x.peca_id, nome: x.peca?.nome ?? 'Peça', metros: x.metros })),
    } as RoloComSaldo;
  });
}
