import { createClient } from '@/lib/supabase/server';
import { carregarConfig } from '@/lib/data';
import type { Fio } from '@/lib/types';
import OrcamentoClient from './OrcamentoClient';

export const dynamic = 'force-dynamic';

export default async function OrcamentoPage() {
  const sb = await createClient();
  const [{ data }, config] = await Promise.all([
    sb.from('fios').select('*').order('nome'),
    carregarConfig(sb),
  ]);
  return (
    <>
      <h1>Orçamento</h1>
      <OrcamentoClient fios={(data ?? []) as Fio[]} config={config} />
    </>
  );
}