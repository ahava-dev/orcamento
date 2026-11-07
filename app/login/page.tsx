'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    const { error } = await createClient().auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro('E-mail ou senha incorretos.');
      setCarregando(false);
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="login">
      <div className="crop" style={{ width: 320, height: 182 }}>
        <img src="/logo-principal.png" alt="Ahava" style={{ marginTop: -82 }} />
      </div>
      <form className="login-form" onSubmit={entrar}>
        <div className="field">
          <label>E-mail</label>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        {erro && <p className="err">{erro}</p>}
        <button className="btn primary block" disabled={carregando}>
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}