'use client';

import { useState } from 'react';
import { brl, fmt, numTxt, parseNum } from '@/lib/format';
import { calcularCustos, custoFixoPorHora, gramasDeFio, precoSugerido } from '@/lib/calc';
import type { Config, Fio } from '@/lib/types';

const nomeFio = (f: Fio) => f.nome + (f.cor ? ` · ${f.cor}` : '');

export default function OrcamentoClient({ fios, config }: { fios: Fio[]; config: Config }) {
  const [metros, setMetros] = useState('2');
  const [pesoAm, setPesoAm] = useState('');
  const [compAm, setCompAm] = useState('1');
  const [sel, setSel] = useState<string[]>([]);
  const [precoKg, setPrecoKg] = useState('');
  const [perda, setPerda] = useState('10');
  const [hm, setHm] = useState('');
  const [matM, setMatM] = useState('');
  const [matFixo, setMatFixo] = useState('');
  const [margem, setMargem] = useState(numTxt(config.margem_padrao));

  const n = (s: string) => parseNum(s) ?? 0;
  const m = n(metros);
  const gPorM = n(compAm) > 0 ? n(pesoAm) / n(compAm) : 0;
  const gTotal = gPorM * m * (1 + n(perda) / 100);

  const escolhidos = fios.filter((f) => sel.includes(f.id));
  const precos = escolhidos.map((f) => {
    const g = gramasDeFio(f) ?? 0;
    return g > 0 ? f.preco_rolo / g : null;
  });
  const validos = precos.filter((p): p is number => p != null);
  const mediaFios = validos.length ? validos.reduce((s, p) => s + p, 0) / validos.length : 0;
  const manual = n(precoKg);
  const porGrama = manual > 0 ? manual / 1000 : mediaFios;
  const semCalib = escolhidos.length - validos.length;

  const c = calcularCustos({
    custoFio: gTotal * porGrama,
    custoMateriais: n(matM) * m + n(matFixo),
    horas: n(hm) * m,
    maoObraFechada: null,
    valorHora: config.valor_hora,
    fixoPorHora: custoFixoPorHora(config),
  });
  const preco = precoSugerido(c.total, n(margem), config.taxa_maquininha);

  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

  return (
    <>
      <section className="card">
        <h2>Peça</h2>
        <div className="field">
          <label>Metros da peça</label>
          <input inputMode="decimal" value={metros} onChange={(e) => setMetros(e.target.value)} />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Peso da amostra (g)</label>
            <input inputMode="decimal" value={pesoAm} onChange={(e) => setPesoAm(e.target.value)} />
          </div>
          <div className="field">
            <label>Comprimento da amostra (m)</label>
            <input inputMode="decimal" value={compAm} onChange={(e) => setCompAm(e.target.value)} />
          </div>
        </div>
        <p className="small muted">
          Se o peso já for de 1 metro, deixe o comprimento em 1. Fio por metro: {fmt(gPorM, 1)} g.
        </p>
        <div className="field">
          <label>Perda/sobra de fio (%)</label>
          <input inputMode="decimal" value={perda} onChange={(e) => setPerda(e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2>Fios</h2>
        {fios.length === 0 && <p className="muted small">Nenhum fio cadastrado.</p>}
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {fios.map((f) => (
            <button key={f.id} type="button" className={'chip' + (sel.includes(f.id) ? ' on' : '')} onClick={() => toggle(f.id)}>
              {nomeFio(f)}
            </button>
          ))}
        </div>
        <p className="small muted">Com vários fios escolhidos, usa a média do preço por grama.</p>
        {semCalib > 0 && (
          <p className="err">{semCalib} fio(s) sem calibração ficaram fora da média. Calibre na tela Fios.</p>
        )}
        <div className="field">
          <label>Ou informe o preço do fio por kg (R$)</label>
          <input inputMode="decimal" value={precoKg} onChange={(e) => setPrecoKg(e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2>Tempo e materiais</h2>
        <div className="field">
          <label>Horas por metro</label>
          <input inputMode="decimal" value={hm} onChange={(e) => setHm(e.target.value)} />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Materiais por metro (R$)</label>
            <input inputMode="decimal" value={matM} onChange={(e) => setMatM(e.target.value)} />
          </div>
          <div className="field">
            <label>Materiais fixos (R$)</label>
            <input inputMode="decimal" value={matFixo} onChange={(e) => setMatFixo(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Margem de lucro (%)</label>
          <input inputMode="decimal" value={margem} onChange={(e) => setMargem(e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h2>Resumo</h2>
        {gPorM === 0 && <p className="err">Informe o peso da amostra.</p>}
        {gPorM > 0 && porGrama === 0 && <p className="err">Escolha os fios ou informe o preço por kg.</p>}
        <div className="line"><span>Fio ({fmt(gTotal, 0)} g)</span><span>{brl(c.fio)}</span></div>
        <div className="line"><span>Outros materiais</span><span>{brl(c.materiais)}</span></div>
        <div className="line"><span>Mão de obra</span><span>{brl(c.maoObra)}</span></div>
        <div className="line"><span>Energia e ferramentas</span><span>{brl(c.fixos)}</span></div>
        <div className="line custo-total"><strong>Custo total</strong><strong>{brl(c.total)}</strong></div>
        {preco != null ? (
          <>
            <div className="line"><span>Taxa da maquininha ({fmt(config.taxa_maquininha, 2)}%)</span><span>{brl((preco * config.taxa_maquininha) / 100)}</span></div>
            <div className="line"><span>Lucro ({fmt(n(margem), 2)}%)</span><span>{brl((preco * n(margem)) / 100)}</span></div>
            <div className="preco">
              <div className="muted small">Preço sugerido</div>
              <div className="total">{brl(preco)}</div>
              {m > 0 && <div className="small gd">{brl(preco / m)} por metro</div>}
            </div>
          </>
        ) : (
          <p className="err">Margem + taxa da maquininha chegam a 100% ou mais. Reduza a margem.</p>
        )}
      </section>
    </>
  );
}