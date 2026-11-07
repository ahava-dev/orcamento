import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarRolos } from '@/lib/data';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const sb = await createClient();
  const [{ data: emAndamento }, rolos] = await Promise.all([
    sb.from('pecas').select('id, nome').eq('status', 'em_andamento').order('created_at', { ascending: false }),
    carregarRolos(sb),
  ]);
  const baixos = rolos.filter((r) => r.status === 'aberto' && r.saldo_m <= r.metros * 0.15);

  return (
    <>
      <h1>Início</h1>

      <div className="grid2" style={{ marginBottom: 14 }}>
        <Link href="/pecas" className="btn primary">Nova peça</Link>
        <Link href="/fios" className="btn">Cadastrar fio</Link>
      </div>
      <Link href="/orcamento" className="btn block" style={{ marginBottom: 14 }}>Orçamento</Link>

      <section className="card">
        <h2>Peças em andamento</h2>
        {(emAndamento ?? []).length === 0 && <p className="muted">Nenhuma peça em andamento.</p>}
        {(emAndamento ?? []).map((p: { id: string; nome: string }) => (
          <Link key={p.id} href={`/pecas/${p.id}`} className="line" style={{ textDecoration: 'none' }}>
            <span>{p.nome}</span>
            <span className="muted">›</span>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2>Rolos acabando</h2>
        {baixos.length === 0 && <p className="muted">Nenhum rolo com pouco fio.</p>}
        {baixos.map((r) => (
          <div key={r.id} className="line">
            <span>
              {r.fio.nome}
              {r.fio.cor ? ` · ${r.fio.cor}` : ''}
            </span>
            <span className="badge warn">{fmt(Math.max(r.saldo_m, 0), 0)} m</span>
          </div>
        ))}
      </section>
    </>
  );
}
