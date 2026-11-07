'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import NumInput from '@/components/NumInput';
import { useSalvar } from '@/components/useSalvar';
import { parseNum } from '@/lib/format';
import type { Material } from '@/lib/types';

const UNIDADES = { un: 'por unidade', m: 'por metro', g: 'por grama' } as const;

export default function MateriaisClient({ materiais }: { materiais: Material[] }) {
  const sb = useMemo(() => createClient(), []);
  const salvar = useSalvar();
  const [nome, setNome] = useState('');
  const [un, setUn] = useState<Material['unidade']>('un');
  const [preco, setPreco] = useState('');

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const p = parseNum(preco);
    if (!nome.trim() || p == null || p < 0) {
      alert('Informe nome e preço.');
      return;
    }
    const ok = await salvar(sb.from('materiais').insert({ nome: nome.trim(), unidade: un, preco_unitario: p }));
    if (ok) {
      setNome('');
      setPreco('');
    }
  }

  async function excluir(m: Material) {
    if (!confirm(`Excluir "${m.nome}"? As peças que já usam esse material continuam com o valor lançado.`)) return;
    await salvar(sb.from('materiais').delete().eq('id', m.id));
  }

  return (
    <>
      <form className="card" onSubmit={criar}>
        <h2>Novo material</h2>
        <div className="field">
          <label>Nome</label>
          <input placeholder="Ex: Zíper 20 cm, forro, enchimento" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Unidade</label>
            <select value={un} onChange={(e) => setUn(e.target.value as Material['unidade'])}>
              {(Object.keys(UNIDADES) as Material['unidade'][]).map((u) => (
                <option key={u} value={u}>
                  {UNIDADES[u]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Preço (R$)</label>
            <input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />
          </div>
        </div>
        <button className="btn primary block">Cadastrar material</button>
      </form>

      {materiais.length === 0 && <p className="muted">Nenhum material cadastrado.</p>}
      {materiais.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <span className="peca-nome">{m.nome}</span>
            <button className="btn small danger" onClick={() => excluir(m)}>
              Excluir
            </button>
          </div>
          <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
            <label>Preço {UNIDADES[m.unidade]} (R$)</label>
            <NumInput
              value={m.preco_unitario}
              onCommit={(n) => n != null && n >= 0 && salvar(sb.from('materiais').update({ preco_unitario: n }).eq('id', m.id))}
            />
          </div>
        </div>
      ))}
    </>
  );
}
