'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSalvar } from '@/components/useSalvar';
import { brl, numTxt, parseNum } from '@/lib/format';
import { custoFixoPorHora } from '@/lib/calc';
import type { Config } from '@/lib/types';

type Campo = keyof Config;

const CAMPOS: { k: Campo; rotulo: string }[] = [
  { k: 'valor_hora', rotulo: 'Valor da hora de mão de obra (R$)' },
  { k: 'margem_padrao', rotulo: 'Margem de lucro padrão (%)' },
  { k: 'taxa_maquininha', rotulo: 'Taxa da maquininha (%)' },
  { k: 'energia_mes', rotulo: 'Energia no mês (R$)' },
  { k: 'ferramentas_mes', rotulo: 'Ferramentas no mês (R$)' },
  { k: 'horas_mes', rotulo: 'Horas trabalhadas no mês' },
];

export default function ConfigForm({ config }: { config: Config }) {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const salvar = useSalvar();
  const [f, setF] = useState<Record<Campo, string>>(
    Object.fromEntries(CAMPOS.map(({ k }) => [k, numTxt(config[k])])) as Record<Campo, string>
  );
  const [salvo, setSalvo] = useState(false);

  const n = (k: Campo) => parseNum(f[k]) ?? 0;
  const fixo = custoFixoPorHora({
    energia_mes: n('energia_mes'),
    ferramentas_mes: n('ferramentas_mes'),
    horas_mes: n('horas_mes'),
  });

  async function gravar(e: React.FormEvent) {
    e.preventDefault();
    setSalvo(false);
    const ok = await salvar(
      sb.from('configuracoes').upsert({
        id: 1,
        valor_hora: n('valor_hora'),
        margem_padrao: n('margem_padrao'),
        taxa_maquininha: n('taxa_maquininha'),
        energia_mes: n('energia_mes'),
        ferramentas_mes: n('ferramentas_mes'),
        horas_mes: n('horas_mes'),
      })
    );
    if (ok) setSalvo(true);
  }

  async function sair() {
    await sb.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <form className="card" onSubmit={gravar}>
        {CAMPOS.map(({ k, rotulo }) => (
          <div className="field" key={k}>
            <label>{rotulo}</label>
            <input
              inputMode="decimal"
              value={f[k]}
              onChange={(e) => {
                setF({ ...f, [k]: e.target.value });
                setSalvo(false);
              }}
            />
          </div>
        ))}
        <p className="small muted">
          Energia e ferramentas por hora de trabalho: <strong>{brl(fixo)}</strong>
        </p>
        <button className="btn primary block">Salvar ajustes</button>
        {salvo && <p className="small" style={{ color: 'var(--ok)' }}>Salvo.</p>}
        <p className="small muted">
          Peças já finalizadas não mudam. Peças em andamento usam os valores novos.
        </p>
      </form>

      <button className="btn block" onClick={sair}>
        Sair
      </button>
    </>
  );
}
