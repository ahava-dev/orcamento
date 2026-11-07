import { createClient } from '@/lib/supabase/server';
import { carregarConfig } from '@/lib/data';
import ConfigForm from './ConfigForm';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const sb = await createClient();
  const config = await carregarConfig(sb);
  return (
    <>
      <h1>Ajustes</h1>
      <ConfigForm config={config} />
    </>
  );
}
