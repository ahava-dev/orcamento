import { createClient } from '@/lib/supabase/server';
import type { Material } from '@/lib/types';
import MateriaisClient from './MateriaisClient';

export const dynamic = 'force-dynamic';

export default async function MateriaisPage() {
  const sb = await createClient();
  const { data } = await sb.from('materiais').select('*').order('nome');
  return (
    <>
      <h1>Materiais</h1>
      <MateriaisClient materiais={(data ?? []) as Material[]} />
    </>
  );
}
