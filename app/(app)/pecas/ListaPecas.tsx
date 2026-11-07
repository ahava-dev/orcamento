'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { brl } from '@/lib/format';
import type { Peca } from '@/lib/types';

type Filtro = 'todas' | 'em_andamento' | 'finalizada';

export default function ListaPecas({ pecas, margemPadrao }: { pecas: Peca[]; margemPadrao: number }) {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [nome, setNome] = useState('');
  const [criando, setCriando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setCriando(true);
    const { data, error } = await createClient()
      .from('pecas')
      .insert({ nome: nome.trim(), margem: margemPadrao })
      .select('id')
      .single();
    if (error || !data) {
      alert('Erro ao criar: ' + (error?.message ?? ''));
      setCriando(false);
      return;
    }
    router.push(`/pecas/${data.id}`);
  }

  const lista = pecas.filter(
    (p) =>
      (filtro === 'todas' || p.status === filtro) &&
      p.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <>
      <form className="card" onSubmit={criar}>
        <h2>Nova peça</h2>
        <div className="row">
          <input className="grow" placeholder="Ex: Bolsa palha ráfia" value={nome} onChange={(e) => setNome(e.target.value)} />
          <button className="btn primary" disabled={criando || !nome.trim()}>
            Criar
          </button>
        </div>
      </form>

      <input placeholder="Buscar peça…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="chips">
        {(
          [
            ['todas', 'Todas'],
            ['em_andamento', 'Em andamento'],
            ['finalizada', 'Finalizadas'],
          ] as [Filtro, string][]
        ).map(([v, r]) => (
          <button key={v} type="button" className={'chip' + (filtro === v ? ' on' : '')} onClick={() => setFiltro(v)}>
            {r}
          </button>
        ))}
      </div>

      {lista.length === 0 && <p className="muted">Nenhuma peça encontrada.</p>}
      {lista.map((p) => (
        <Link key={p.id} href={`/pecas/${p.id}`} className="card">
          <div className="row between">
            <span className="peca-nome">{p.nome}</span>
            <span className={'badge ' + (p.status === 'finalizada' ? 'ok' : 'warn')}>
              {p.status === 'finalizada' ? 'finalizada' : 'em andamento'}
            </span>
          </div>
          {p.status === 'finalizada' && (
            <div className="row between small muted" style={{ marginTop: 6 }}>
              <span>Custo {brl(p.custo_total)}</span>
              <span>Preço sugerido {brl(p.preco_sugerido)}</span>
            </div>
          )}
        </Link>
      ))}
    </>
  );
}
