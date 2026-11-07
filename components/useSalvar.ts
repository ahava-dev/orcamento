'use client';

import { useRouter } from 'next/navigation';

export type Res = { error: { message: string } | null };

/** Executa uma gravação do Supabase, avisa se der erro e atualiza a tela. */
export function useSalvar() {
  const router = useRouter();
  return async (p: PromiseLike<Res>): Promise<boolean> => {
    const { error } = await p;
    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return false;
    }
    router.refresh();
    return true;
  };
}
