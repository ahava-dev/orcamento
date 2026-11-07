import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { carregarConfig, carregarRolos } from '@/lib/data';
import type { LancFio, LancMat, Material, Peca } from '@/lib/types';
import Ficha from './Ficha';

export const dynamic = 'force-dynamic';

export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();

  const { data: peca } = await sb.from('pecas').select('*').eq('id', id).maybeSingle();
  if (!peca) notFound();

  const [lf, lm, rolos, mats, config] = await Promise.all([
    sb.from('lancamentos_fio').select('*').eq('peca_id', id).order('created_at'),
    sb.from('lancamentos_material').select('*').eq('peca_id', id).order('created_at'),
    carregarRolos(sb),
    sb.from('materiais').select('*').order('nome'),
    carregarConfig(sb),
  ]);

  return (
    <Ficha
      peca={peca as Peca}
      lancFio={(lf.data ?? []) as LancFio[]}
      lancMat={(lm.data ?? []) as LancMat[]}
      rolos={rolos}
      materiais={(mats.data ?? []) as Material[]}
      config={config}
    />
  );
}
