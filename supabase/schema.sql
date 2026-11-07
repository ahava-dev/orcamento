create extension if not exists "pgcrypto";

create table public.configuracoes (
  id int primary key default 1 check (id = 1),
  valor_hora numeric not null default 0,
  margem_padrao numeric not null default 30,
  taxa_maquininha numeric not null default 0,
  energia_mes numeric not null default 0,
  ferramentas_mes numeric not null default 0,
  horas_mes numeric not null default 160
);
insert into public.configuracoes (id) values (1) on conflict do nothing;

create table public.fios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text,
  espessura_mm numeric,
  preco_rolo numeric not null,
  metros_rolo numeric not null,
  tara_g numeric not null default 0,
  peso_fechado_g numeric,
  created_at timestamptz not null default now()
);

create table public.rolos (
  id uuid primary key default gen_random_uuid(),
  fio_id uuid not null references public.fios(id) on delete cascade,
  preco numeric not null,
  metros numeric not null,
  status text not null default 'aberto' check (status in ('aberto', 'zerado')),
  comprado_em date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade text not null check (unidade in ('un', 'm', 'g')),
  preco_unitario numeric not null,
  created_at timestamptz not null default now()
);

create table public.pecas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'finalizada')),
  horas numeric not null default 0,
  cronometro_inicio timestamptz,
  margem numeric not null,
  mao_obra_fechada numeric,
  custo_fio numeric,
  custo_materiais numeric,
  custo_mao_obra numeric,
  custo_fixos numeric,
  custo_total numeric,
  preco_sugerido numeric,
  valor_hora_usado numeric,
  taxa_usada numeric,
  created_at timestamptz not null default now(),
  finalizada_em timestamptz
);

create table public.lancamentos_fio (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas(id) on delete cascade,
  rolo_id uuid not null references public.rolos(id),
  peso_antes_g numeric,
  peso_depois_g numeric,
  metros_manual numeric,
  metros numeric,
  custo numeric,
  created_at timestamptz not null default now()
);

create table public.lancamentos_material (
  id uuid primary key default gen_random_uuid(),
  peca_id uuid not null references public.pecas(id) on delete cascade,
  material_id uuid references public.materiais(id) on delete set null,
  descricao text not null,
  quantidade numeric not null default 1,
  valor_unitario numeric not null,
  created_at timestamptz not null default now()
);

create index on public.rolos (fio_id);
create index on public.lancamentos_fio (peca_id);
create index on public.lancamentos_fio (rolo_id);
create index on public.lancamentos_material (peca_id);

do $$
declare t text;
begin
  foreach t in array array[
    'configuracoes', 'fios', 'rolos', 'materiais',
    'pecas', 'lancamentos_fio', 'lancamentos_material'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "autenticados" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
