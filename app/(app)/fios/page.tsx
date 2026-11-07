import { createClient } from '@/lib/supabase/server';
import { carregarRolos } from '@/lib/data';
import type { Fio } from '@/lib/types';
import FiosClient from './FiosClient';

export const dynamic = 'force-dynamic';

export default async function FiosPage() {
  const sb = await createClient();
  const [{ data: fios }, rolos] = await Promise.all([
    sb.from('fios').select('*').order('nome'),
    carregarRolos(sb),
  ]);
  return (
    <>
      <h1>Fios e rolos</h1>
      <FiosClient fios={(fios ?? []) as Fio[]} rolos={rolos} />
    </>
  );
}
