'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NumInput from '@/components/NumInput';
import { useSalvar } from '@/components/useSalvar';
import { brl, fmt, parseNum, relogio } from '@/lib/format';
import {
  calcularCustos,
  custoFixoPorHora,
  custoPorMetro,
  metrosConsumidos,
  metrosPorGrama,
  pesoSugeridoAntes,
  precoSugerido,
} from '@/lib/calc';
import type { Config, LancFio, LancMat, Material, Peca, RoloComSaldo } from '@/lib/types';

type Props = {
  peca: Peca;
  lancFio: LancFio[];
  lancMat: LancMat[];
  rolos: RoloComSaldo[];
  materiais: Material[];
  config: Config;
};

const MS_POR_HORA = 3.6e6;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const nomeRolo = (r: RoloComSaldo) => r.fio.nome + (r.fio.cor ? ` · ${r.fio.cor}` : '');

export default function Ficha({ peca, lancFio, lancMat, rolos, materiais, config }: Props) {
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const salvar = useSalvar();

  const finalizada = peca.status === 'finalizada';
  const rodando = !!peca.cronometro_inicio && !finalizada;

  const [agora, setAgora] = useState(0);
  const [nome, setNome] = useState(peca.nome);
  const [ocupado, setOcupado] = useState(false);
  const [roloSel, setRoloSel] = useState('');
  const [modoMat, setModoMat] = useState<'cad' | 'avulso'>('cad');
  const [matSel, setMatSel] = useState('');
  const [qtd, setQtd] = useState('');
  const [descAv, setDescAv] = useState('');
  const [valAv, setValAv] = useState('');

  useEffect(() => {
    setNome(peca.nome);
  }, [peca.nome]);

  useEffect(() => {
    if (!rodando) return;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  // ---------- cálculo ----------
  const horasAcum =
    peca.horas +
    (rodando && agora ? Math.max(0, agora - new Date(peca.cronometro_inicio!).getTime()) / MS_POR_HORA : 0);
  const fixoHora = custoFixoPorHora(config);

  const linhasFio = lancFio.map((l) => {
    const rolo = rolos.find((r) => r.id === l.rolo_id);
    const mPorG = rolo ? metrosPorGrama(rolo.fio) : null;
    const metros = finalizada
      ? l.metros
      : metrosConsumidos({ antes: l.peso_antes_g, depois: l.peso_depois_g, metrosManual: l.metros_manual, mPorG });
    const custo = finalizada
      ? l.custo ?? 0
      : metros != null && rolo
        ? metros * custoPorMetro(rolo.preco, rolo.metros)
        : 0;
    return { l, rolo, mPorG, metros, custo, completo: metros != null };
  });

  const custoFio = linhasFio.reduce((s, x) => s + x.custo, 0);
  const custoMat = lancMat.reduce((s, m) => s + m.quantidade * m.valor_unitario, 0);

  const c = finalizada
    ? {
        fio: peca.custo_fio ?? 0,
        materiais: peca.custo_materiais ?? 0,
        maoObra: peca.custo_mao_obra ?? 0,
        fixos: peca.custo_fixos ?? 0,
        total: peca.custo_total ?? 0,
      }
    : calcularCustos({
        custoFio,
        custoMateriais: custoMat,
        horas: horasAcum,
        maoObraFechada: peca.mao_obra_fechada,
        valorHora: config.valor_hora,
        fixoPorHora: fixoHora,
      });
  const taxa = finalizada ? peca.taxa_usada ?? 0 : config.taxa_maquininha;
  const preco = finalizada ? peca.preco_sugerido : precoSugerido(c.total, peca.margem, taxa);

  // ---------- fios ----------
  async function addFio(roloId: string) {
    const rolo = rolos.find((r) => r.id === roloId);
    if (!rolo) return;
    const sug = pesoSugeridoAntes(rolo.saldo_m, metrosPorGrama(rolo.fio), rolo.fio.tara_g);
    await salvar(
      sb.from('lancamentos_fio').insert({
        peca_id: peca.id,
        rolo_id: roloId,
        peso_antes_g: sug != null ? Math.round(sug) : null,
      })
    );
  }
  const updFio = (id: string, patch: Partial<LancFio>) =>
    salvar(sb.from('lancamentos_fio').update(patch).eq('id', id));
  const delFio = (id: string) => salvar(sb.from('lancamentos_fio').delete().eq('id', id));

  // ---------- materiais ----------
  async function addMatCad() {
    const m = materiais.find((x) => x.id === matSel);
    const q = parseNum(qtd);
    if (!m || q == null || q <= 0) {
      alert('Escolha o material e a quantidade.');
      return;
    }
    const ok = await salvar(
      sb.from('lancamentos_material').insert({
        peca_id: peca.id,
        material_id: m.id,
        descricao: m.nome,
        quantidade: q,
        valor_unitario: m.preco_unitario,
      })
    );
    if (ok) setQtd('');
  }
  async function addMatAvulso() {
    const v = parseNum(valAv);
    if (!descAv.trim() || v == null || v < 0) {
      alert('Informe a descrição e o valor.');
      return;
    }
    const ok = await salvar(
      sb.from('lancamentos_material').insert({
        peca_id: peca.id,
        descricao: descAv.trim(),
        quantidade: 1,
        valor_unitario: v,
      })
    );
    if (ok) {
      setDescAv('');
      setValAv('');
    }
  }
  const updMat = (id: string, patch: Partial<LancMat>) =>
    salvar(sb.from('lancamentos_material').update(patch).eq('id', id));
  const delMat = (id: string) => salvar(sb.from('lancamentos_material').delete().eq('id', id));

  // ---------- tempo ----------
  const iniciar = () =>
    salvar(sb.from('pecas').update({ cronometro_inicio: new Date().toISOString() }).eq('id', peca.id));
  const parar = () => {
    const h = peca.horas + (Date.now() - new Date(peca.cronometro_inicio!).getTime()) / MS_POR_HORA;
    return salvar(sb.from('pecas').update({ horas: r3(h), cronometro_inicio: null }).eq('id', peca.id));
  };

  // ---------- ciclo da peça ----------
  async function finalizar() {
    const faltando = linhasFio.filter((x) => !x.completo);
    if (faltando.length) {
      alert(
        `Faltam dados em ${faltando.length} fio(s): informe o peso depois (ou os metros) e confira a calibração do fio.`
      );
      return;
    }
    if (!confirm('Finalizar a peça? Os custos ficam congelados e o fio sai do saldo dos rolos.')) return;
    setOcupado(true);
    try {
      let horas = peca.horas;
      if (peca.cronometro_inicio) horas += (Date.now() - new Date(peca.cronometro_inicio).getTime()) / MS_POR_HORA;
      horas = r3(horas);

      for (const x of linhasFio) {
        const { error } = await sb.from('lancamentos_fio').update({ metros: x.metros, custo: x.custo }).eq('id', x.l.id);
        if (error) throw error;
      }

      const cc = calcularCustos({
        custoFio,
        custoMateriais: custoMat,
        horas,
        maoObraFechada: peca.mao_obra_fechada,
        valorHora: config.valor_hora,
        fixoPorHora: fixoHora,
      });
      const { error } = await sb
        .from('pecas')
        .update({
          status: 'finalizada',
          horas,
          cronometro_inicio: null,
          custo_fio: cc.fio,
          custo_materiais: cc.materiais,
          custo_mao_obra: cc.maoObra,
          custo_fixos: cc.fixos,
          custo_total: cc.total,
          preco_sugerido: precoSugerido(cc.total, peca.margem, config.taxa_maquininha),
          valor_hora_usado: config.valor_hora,
          taxa_usada: config.taxa_maquininha,
          finalizada_em: new Date().toISOString(),
        })
        .eq('id', peca.id);
      if (error) throw error;

      // rolos que acabaram são marcados como zerados
      const gasto = new Map<string, number>();
      for (const x of linhasFio) gasto.set(x.l.rolo_id, (gasto.get(x.l.rolo_id) ?? 0) + (x.metros ?? 0));
      for (const [roloId, g] of gasto) {
        const r = rolos.find((y) => y.id === roloId);
        if (r && r.saldo_m - g <= 0) await sb.from('rolos').update({ status: 'zerado' }).eq('id', roloId);
      }
      router.refresh();
    } catch (e: any) {
      alert('Erro ao finalizar: ' + (e?.message ?? e));
    }
    setOcupado(false);
  }

  async function reabrir() {
    if (!confirm('Reabrir a peça? O fio volta pro saldo dos rolos até finalizar de novo.')) return;
    setOcupado(true);
    const { error } = await sb.from('lancamentos_fio').update({ metros: null, custo: null }).eq('peca_id', peca.id);
    if (error) {
      alert('Erro: ' + error.message);
      setOcupado(false);
      return;
    }
    await salvar(
      sb
        .from('pecas')
        .update({
          status: 'em_andamento',
          custo_fio: null,
          custo_materiais: null,
          custo_mao_obra: null,
          custo_fixos: null,
          custo_total: null,
          preco_sugerido: null,
          valor_hora_usado: null,
          taxa_usada: null,
          finalizada_em: null,
        })
        .eq('id', peca.id)
    );
    setOcupado(false);
  }

  async function excluir() {
    if (!confirm('Excluir a peça? Não dá pra desfazer.')) return;
    const { error } = await sb.from('pecas').delete().eq('id', peca.id);
    if (error) {
      alert('Erro: ' + error.message);
      return;
    }
    router.replace('/pecas');
    router.refresh();
  }

  const abertos = rolos.filter((r) => r.status === 'aberto');

  return (
    <>
      <div className="row between" style={{ marginBottom: 8 }}>
        <Link href="/pecas" className="link">
          ← Peças
        </Link>
        <span className={'badge ' + (finalizada ? 'ok' : 'warn')}>{finalizada ? 'finalizada' : 'em andamento'}</span>
      </div>

      <div className="field">
        <input
          className="nome-peca"
          value={nome}
          disabled={finalizada}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => {
            const t = nome.trim();
            if (t && t !== peca.nome) salvar(sb.from('pecas').update({ nome: t }).eq('id', peca.id));
          }}
        />
      </div>

      {/* FIOS */}
      <section className="card">
        <h2>Fios</h2>
        {linhasFio.map(({ l, rolo, mPorG, metros, custo }) => {
          const manual = l.metros_manual != null;
          return (
            <div className="item" key={l.id}>
              <div className="row between">
                <strong>{rolo ? nomeRolo(rolo) : 'Rolo removido'}</strong>
                {!finalizada && (
                  <button className="btn small danger" onClick={() => delFio(l.id)}>
                    Remover
                  </button>
                )}
              </div>

              {!finalizada && (
                <div className="seg">
                  <button className={!manual ? 'on' : ''} onClick={() => updFio(l.id, { metros_manual: null })}>
                    Pesar
                  </button>
                  <button className={manual ? 'on' : ''} onClick={() => updFio(l.id, { metros_manual: l.metros_manual ?? 0 })}>
                    Metros
                  </button>
                </div>
              )}

              {manual ? (
                <div className="field">
                  <label>Metros gastos</label>
                  <NumInput value={l.metros_manual} disabled={finalizada} onCommit={(n) => updFio(l.id, { metros_manual: n ?? 0 })} />
                </div>
              ) : (
                <div className="grid2">
                  <div className="field">
                    <label>Peso antes (g)</label>
                    <NumInput value={l.peso_antes_g} disabled={finalizada} onCommit={(n) => updFio(l.id, { peso_antes_g: n })} />
                  </div>
                  <div className="field">
                    <label>Peso depois (g)</label>
                    <NumInput value={l.peso_depois_g} disabled={finalizada} onCommit={(n) => updFio(l.id, { peso_depois_g: n })} />
                  </div>
                </div>
              )}

              {!manual && !mPorG && !finalizada && (
                <p className="err">Fio sem calibração: pese o rolo fechado na tela Fios.</p>
              )}
              <div className={'small ' + (metros != null ? 'gd' : 'muted')}>
                {metros != null ? `${fmt(metros, 1)} m · ${brl(custo)}` : 'Preencha os pesos para calcular.'}
              </div>
            </div>
          );
        })}

        {!finalizada &&
          (abertos.length === 0 ? (
            <p className="muted small">
              Nenhum rolo aberto. <Link href="/fios">Cadastre um fio ou rolo</Link>.
            </p>
          ) : (
            <div className="row">
              <select className="grow" value={roloSel} onChange={(e) => setRoloSel(e.target.value)}>
                <option value="">Escolher fio…</option>
                {abertos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {nomeRolo(r)} — saldo {fmt(Math.max(r.saldo_m, 0), 0)} m
                  </option>
                ))}
              </select>
              <button
                className="btn"
                disabled={!roloSel}
                onClick={() => {
                  addFio(roloSel);
                  setRoloSel('');
                }}
              >
                Adicionar
              </button>
            </div>
          ))}
      </section>

      {/* MATERIAIS */}
      <section className="card">
        <h2>Outros materiais</h2>
        {lancMat.map((m) => (
          <div className="item" key={m.id}>
            <div className="row between">
              <strong>{m.descricao}</strong>
              {!finalizada && (
                <button className="btn small danger" onClick={() => delMat(m.id)}>
                  Remover
                </button>
              )}
            </div>
            {m.material_id && !finalizada ? (
              <div className="row" style={{ marginTop: 8 }}>
                <div style={{ width: 110 }}>
                  <NumInput value={m.quantidade} onCommit={(n) => n != null && n > 0 && updMat(m.id, { quantidade: n })} />
                </div>
                <span className="small muted">
                  × {brl(m.valor_unitario)} = {brl(m.quantidade * m.valor_unitario)}
                </span>
              </div>
            ) : (
              <div className="small muted" style={{ marginTop: 6 }}>
                {fmt(m.quantidade, 2)} × {brl(m.valor_unitario)} = {brl(m.quantidade * m.valor_unitario)}
              </div>
            )}
          </div>
        ))}

        {!finalizada && (
          <>
            <div className="seg">
              <button className={modoMat === 'cad' ? 'on' : ''} onClick={() => setModoMat('cad')}>
                Cadastrado
              </button>
              <button className={modoMat === 'avulso' ? 'on' : ''} onClick={() => setModoMat('avulso')}>
                Avulso
              </button>
            </div>
            {modoMat === 'cad' ? (
              materiais.length === 0 ? (
                <p className="muted small">
                  Nenhum material cadastrado. <Link href="/materiais">Cadastrar</Link>.
                </p>
              ) : (
                <div className="row">
                  <select className="grow" value={matSel} onChange={(e) => setMatSel(e.target.value)}>
                    <option value="">Escolher material…</option>
                    {materiais.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({brl(m.preco_unitario)}/{m.unidade})
                      </option>
                    ))}
                  </select>
                  <input style={{ width: 90 }} inputMode="decimal" placeholder="Qtd" value={qtd} onChange={(e) => setQtd(e.target.value)} />
                  <button className="btn" onClick={addMatCad}>
                    +
                  </button>
                </div>
              )
            ) : (
              <div className="row">
                <input className="grow" placeholder="Descrição" value={descAv} onChange={(e) => setDescAv(e.target.value)} />
                <input style={{ width: 100 }} inputMode="decimal" placeholder="R$" value={valAv} onChange={(e) => setValAv(e.target.value)} />
                <button className="btn" onClick={addMatAvulso}>
                  +
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* TEMPO */}
      <section className="card">
        <h2>Tempo e mão de obra</h2>
        <div className="timer">{relogio(horasAcum)}</div>
        {!finalizada && (
          <div className="row" style={{ margin: '10px 0' }}>
            {rodando ? (
              <button className="btn grow" onClick={parar}>
                Parar
              </button>
            ) : (
              <button className="btn grow" onClick={iniciar}>
                Iniciar cronômetro
              </button>
            )}
          </div>
        )}
        <div className="grid2">
          <div className="field">
            <label>Horas (ex: 2,5 = 2h30)</label>
            <NumInput
              value={rodando ? null : peca.horas}
              disabled={finalizada || rodando}
              onCommit={(n) => salvar(sb.from('pecas').update({ horas: n ?? 0 }).eq('id', peca.id))}
            />
          </div>
          <div className="field">
            <label>Mão de obra: valor fechado</label>
            <NumInput
              value={peca.mao_obra_fechada}
              disabled={finalizada}
              placeholder={`${brl(config.valor_hora)}/h`}
              onCommit={(n) => salvar(sb.from('pecas').update({ mao_obra_fechada: n }).eq('id', peca.id))}
            />
          </div>
        </div>
        <p className="small muted">
          Sem valor fechado, usa horas × {brl(config.valor_hora)} por hora.
        </p>
      </section>

      {/* MARGEM */}
      <section className="card">
        <h2>Margem de lucro (%)</h2>
        <NumInput
          value={peca.margem}
          disabled={finalizada}
          onCommit={(n) => n != null && salvar(sb.from('pecas').update({ margem: n }).eq('id', peca.id))}
        />
        <p className="small muted">Padrão da marca: {fmt(config.margem_padrao, 2)}%</p>
      </section>

      {/* RESUMO */}
      <section className="card">
        <h2>Resumo</h2>
        <div className="line"><span>Fio</span><span>{brl(c.fio)}</span></div>
        <div className="line"><span>Outros materiais</span><span>{brl(c.materiais)}</span></div>
        <div className="line"><span>Mão de obra</span><span>{brl(c.maoObra)}</span></div>
        <div className="line"><span>Energia e ferramentas</span><span>{brl(c.fixos)}</span></div>        <div className="line custo-total"><strong>Custo total</strong><strong>{brl(c.total)}</strong></div>
        <div style={{ height: 8 }} />
        {preco != null ? (
          <>
            <div className="line"><span>Taxa da maquininha ({fmt(taxa, 2)}%)</span><span>{brl((preco * taxa) / 100)}</span></div>
            <div className="line"><span>Lucro ({fmt(peca.margem, 2)}%)</span><span>{brl((preco * peca.margem) / 100)}</span></div>
            <div className="preco">
              <div className="muted small">Preço sugerido</div>
              <div className="total">{brl(preco)}</div>
            </div>
          </>
        ) : (
          <p className="err">Margem + taxa da maquininha chegam a 100% ou mais. Reduza a margem.</p>
        )}
      </section>

      {!finalizada ? (
        <button className="btn primary block" disabled={ocupado} onClick={finalizar}>
          Finalizar peça
        </button>
      ) : (
        <button className="btn block" disabled={ocupado} onClick={reabrir}>
          Reabrir peça
        </button>
      )}
      <button className="btn danger block" style={{ marginTop: 10 }} onClick={excluir}>
        Excluir peça
      </button>
    </>
  );
}
