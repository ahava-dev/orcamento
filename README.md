# Preços do Crochê

Next.js + Supabase + Vercel.

## Rodar

1. Supabase: criar projeto.
2. SQL Editor: colar e rodar `supabase/schema.sql`.
3. Authentication > Users: criar os usuários (dono e artesão).
4. Copiar `.env.example` para `.env.local` e preencher URL e anon key (Project Settings > API).
5. `npm install`
6. `npm run dev`
7. Conferir a conta: `npm run test:calc`

## Deploy

Vercel: importar o repositório do GitHub e adicionar as duas variáveis do `.env.example`.

## Primeiro uso

1. Ajustes: valor da hora, margem padrão, taxa da maquininha, energia, ferramentas e horas do mês.
2. Fios: cadastrar o fio, informar peso do tubo e peso do rolo fechado (calibração).
3. Materiais: cadastrar os que se repetem.
4. Peças: nova peça.
