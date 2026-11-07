'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  pecas: 'M5 9h14l-1 11H6L5 9zM9 9V7a3 3 0 016 0v2',
  fios: 'M12 3a9 9 0 100 18 9 9 0 000-18zM5 9c5 2 9 2 14 0M5 15c5-2 9-2 14 0',
  mat: 'M4 7l8-4 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10',
  aj: 'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',
};

const itens = [
  { href: '/', rotulo: 'Início', icone: 'home' },
  { href: '/pecas', rotulo: 'Peças', icone: 'pecas' },
  { href: '/fios', rotulo: 'Fios', icone: 'fios' },
  { href: '/materiais', rotulo: 'Materiais', icone: 'mat' },
  { href: '/config', rotulo: 'Ajustes', icone: 'aj' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {itens.map((i) => {
        const ativo = i.href === '/' ? pathname === '/' : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={ativo ? 'on' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={P[i.icone]} />
            </svg>
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}