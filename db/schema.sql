-- Elite Match Properties — schema de produção
-- Auth por OTP (magic code) para todos os papéis; sessões em cookie httpOnly.

create extension if not exists "pgcrypto";

-- Identidade única por pessoa (lead ou corretor).
create table if not exists usuarios (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null default '',
  email      text unique,
  whatsapp   text unique,
  papel      text not null default 'lead' check (papel in ('lead','corretor')),
  criado_em  timestamptz not null default now()
);

-- Códigos OTP emitidos (guardamos só o hash do código).
create table if not exists otp_codes (
  id          uuid primary key default gen_random_uuid(),
  destino     text not null,                          -- whatsapp normalizado (só dígitos) ou email
  canal       text not null check (canal in ('whatsapp','email')),
  codigo_hash text not null,
  expira_em   timestamptz not null,
  consumido   boolean not null default false,
  tentativas  int not null default 0,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_otp_destino on otp_codes(destino, consumido);

-- Sessões (token opaco no cookie; guardamos o hash).
create table if not exists sessoes (
  token_hash text primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  expira_em  timestamptz not null,
  criado_em  timestamptz not null default now()
);

create table if not exists imoveis (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  bairro        text not null default '',
  cidade        text not null default '',
  preco         bigint not null default 0,
  area          int not null default 0,
  quartos       int not null default 0,
  vagas         int not null default 0,
  tipo          text not null default 'apartamento' check (tipo in ('casa','apartamento','terreno','comercial')),
  foto          text not null default '',
  diferenciais  text[] not null default '{}',
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references usuarios(id) on delete set null,
  nome          text not null,
  whatsapp      text not null,
  orcamento_min bigint not null default 0,
  orcamento_max bigint not null default 0,
  regiao        text not null default '',
  tipo          text not null default 'apartamento',
  quartos       int not null default 0,
  desejo        text not null default '',
  criado_em     timestamptz not null default now()
);
create index if not exists idx_leads_usuario on leads(usuario_id);

create table if not exists interacoes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  imovel_id  uuid not null references imoveis(id) on delete cascade,
  acao       text not null check (acao in ('like','dislike')),
  criado_em  timestamptz not null default now(),
  unique (lead_id, imovel_id)
);
create index if not exists idx_inter_lead on interacoes(lead_id);
create index if not exists idx_inter_acao on interacoes(acao, criado_em desc);
