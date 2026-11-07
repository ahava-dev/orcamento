import { createClient } from '@/lib/supabase/server';
import { carregarConfig } from '@/lib/data';
import type { Peca } from '@/lib/types';
import ListaPecas from './ListaPecas';

export const dynamic = 'force-dynamic';

export default async function PecasPage() {
  const sb = await createClient();
  const [{ data }, config] = await Promise.all([
    sb.from('pecas').select('*').order('created_at', { ascending: false }),
    carregarConfig(sb),
  ]);
  return (
    <>
      <h1>Peças</h1>
      <ListaPecas pecas={(data ?? []) as Peca[]} margemPadrao={config.margem_padrao} />
    </>
  );
}
