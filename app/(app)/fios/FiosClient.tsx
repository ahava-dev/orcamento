'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import NumInput from '@/components/NumInput';
import { useSalvar } from '@/components/useSalvar';
import { brl, fmt, numTxt, parseNum } from '@/lib/format';
import { custoPorMetro, gramasDeFio, metrosPorGrama } from '@/lib/calc';
import type { Fio, RoloComSaldo } from '@/lib/types';

const VAZIO = { nome: '', cor: '', esp: '', preco: '', metros: '', tara: '' };

export default function FiosClient({ fios, rolos }: { fios: Fio[]; rolos: RoloComSaldo[] }) {
  const sb = useMemo(() => createClient(), []);
  const salvar = useSalvar();
  const [f, setF] = useState(VAZIO);
  const set = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const preco = parseNum(f.preco);
    const metros = parseNum(f.metros);
    if (!f.nome.trim() || preco == null || metros == null || metros <= 0) {
      alert('Informe nome, preço e metros do rolo.');
      return;
    }
    const { data, error } = await sb
      .from('fios')
      .insert({
        nome: f.nome.trim(),
        cor: f.cor.trim() || null,
        espessura_mm: parseNum(f.esp),
        preco_rolo: preco,
        metros_rolo: metros,
        tara_g: parseNum(f.tara) ?? 0,
      })
      .select('id')
      .single();
    if (error || !data) {
      alert('Erro ao salvar: ' + (error?.message ?? ''));
      return;
    }
    if (await salvar(sb.from('rolos').insert({ fio_id: data.id, preco, metros }))) setF(VAZIO);
  }

  return (
    <>
      <form className="card" onSubmit={criar}>
        <h2>Novo fio</h2>
        <div className="grid2">
          <div className="field"><label>Nome</label><input value={f.nome} onChange={set('nome')} /></div>
          <div className="field"><label>Cor</label><input value={f.cor} onChange={set('cor')} /></div>
          <div className="field"><label>Espessura (mm)</label><input inputMode="decimal" value={f.esp} onChange={set('esp')} /></div>
          <div className="field"><label>Preço do rolo (R$)</label><input inputMode="decimal" value={f.preco} onChange={set('preco')} /></div>
          <div className="field"><label>Metros do rolo</label><input inputMode="decimal" value={f.metros} onChange={set('metros')} /></div>
          <div className="field"><label>Peso do tubo (g)</label><input inputMode="decimal" value={f.tara} onChange={set('tara')} /></div>
        </div>
        <button className="btn primary block">Cadastrar fio</button>
      </form>

      {fios.length === 0 && <p className="muted">Nenhum fio cadastrado.</p>}
      {fios.map((fio) => (
        <FioCard key={fio.id} fio={fio} rolos={rolos.filter((r) => r.fio_id === fio.id)} />
      ))}
    </>
  );
}

function FioCard({ fio, rolos }: { fio: Fio; rolos: RoloComSaldo[] }) {
  const sb = useMemo(() => createClient(), []);
  const salvar = useSalvar();
  const [novo, setNovo] = useState(false);
  const [preco, setPreco] = useState(numTxt(fio.preco_rolo));
  const [metros, setMetros] = useState(numTxt(fio.metros_rolo));

  const g = gramasDeFio(fio);
  const mpg = metrosPorGrama(fio);

  async function novoRolo() {
    const p = parseNum(preco);
    const m = parseNum(metros);
    if (p == null || m == null || m <= 0) {
      alert('Informe preço e metros do rolo.');
      return;
    }
    const ok = await salvar(sb.from('rolos').insert({ fio_id: fio.id, preco: p, metros: m }));
    if (ok) {
      await sb.from('fios').update({ preco_rolo: p }).eq('id', fio.id);
      setNovo(false);
    }
  }

  return (
    <section className="card">
      <div className="row between">
        <div>
          <span className="peca-nome">{fio.nome}</span>
          <div className="small muted">
            {fio.cor ?? ''}
            {fio.espessura_mm != null ? `${fio.cor ? ' · ' : ''}${fmt(fio.espessura_mm, 2)} mm` : ''}
          </div>
        </div>
        <span className="small">R$ {fmt(custoPorMetro(fio.preco_rolo, fio.metros_rolo), 3)}/m</span>
      </div>

      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="field">
          <label>Peso do tubo (g)</label>
          <NumInput value={fio.tara_g} onCommit={(n) => salvar(sb.from('fios').update({ tara_g: n ?? 0 }).eq('id', fio.id))} />
        </div>
        <div className="field">
          <label>Rolo fechado na balança (g)</label>
          <NumInput value={fio.peso_fechado_g} onCommit={(n) => salvar(sb.from('fios').update({ peso_fechado_g: n }).eq('id', fio.id))} />
        </div>
      </div>
      {mpg ? (
        <p className="small gd">
          {fmt(g, 0)} g de fio · {fmt(mpg, 3)} m por grama
        </p>
      ) : (
        <p className="err">Sem calibração: pese um rolo fechado (com o tubo) e informe acima.</p>
      )}

      <h2 style={{ marginTop: 14 }}>Rolos</h2>
      {rolos.map((r) => {
        const pct = Math.min(100, Math.max(0, (r.saldo_m / r.metros) * 100));
        return (
          <div className="item" key={r.id}>
            <div className="row between">
              <span className={'badge ' + (r.status !== 'zerado' && r.em_uso ? 'warn' : '')}>
                {r.status === 'zerado' ? 'zerado' : r.em_uso ? 'em uso' : 'aberto'}
              </span>
              <span className="small muted">
                {brl(r.preco)} · {fmt(r.metros, 0)} m
              </span>
            </div>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            <div className="small">
              Saldo: {fmt(Math.max(r.saldo_m, 0), 0)} m
              {mpg ? ` · ${fmt(Math.max(r.saldo_m, 0) / mpg, 0)} g de fio (na balança: ~${fmt(Math.max(r.saldo_m, 0) / mpg + fio.tara_g, 0)} g)` : ''}
            </div>
            <details>
              <summary>Histórico ({r.historico.length})</summary>
              {r.historico.length === 0 && <p className="small muted">Nenhuma peça finalizada com esse rolo.</p>}
              {r.historico.map((h, i) => (
                <div className="line small" key={i}>
                  <Link href={`/pecas/${h.peca_id}`}>{h.nome}</Link>
                  <span>{fmt(h.metros, 0)} m</span>
                </div>
              ))}
            </details>
            <button
              className="btn small"
              onClick={() =>
                salvar(sb.from('rolos').update({ status: r.status === 'zerado' ? 'aberto' : 'zerado' }).eq('id', r.id))
              }
            >
              {r.status === 'zerado' ? 'Reabrir rolo' : 'Marcar como zerado'}
            </button>
          </div>
        );
      })}

      {novo ? (
        <div className="item">
          <div className="grid2">
            <div className="field"><label>Preço (R$)</label><input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} /></div>
            <div className="field"><label>Metros</label><input inputMode="decimal" value={metros} onChange={(e) => setMetros(e.target.value)} /></div>
          </div>
          <div className="row">
            <button className="btn primary grow" onClick={novoRolo}>Adicionar rolo</button>
            <button className="btn" onClick={() => setNovo(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button className="btn small" onClick={() => setNovo(true)}>+ Novo rolo</button>
      )}
    </section>
  );
}
