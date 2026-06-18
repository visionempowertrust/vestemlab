create table if not exists stemlab_resources (
  id text primary key,
  subject text not null,
  name text not null,
  image text,
  video text,
  supplier text,
  uses text,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_manuals (
  id text primary key,
  subject text not null,
  name text not null,
  objective text,
  resource_ids jsonb not null default '[]'::jsonb,
  other_resources text,
  steps text,
  observations text,
  inferences text,
  concepts text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_sessions (
  id text primary key,
  facilitator text not null,
  session_date date not null,
  state text not null,
  school text not null,
  subject text not null,
  activity_id text not null,
  activity_name text not null,
  concept_criteria jsonb not null default '[]'::jsonb,
  attendance jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_schools (
  id text primary key,
  state text not null,
  district text not null,
  school_name text not null,
  address text,
  school_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stemlab_facilitators (
  id text primary key,
  state text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  alternate_phone text,
  designation text,
  qualification text,
  is_special_educator boolean not null default false,
  is_educator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stemlab_manuals_subject_idx on stemlab_manuals(subject);
create index if not exists stemlab_sessions_school_date_idx on stemlab_sessions(state, school, session_date desc);

alter table stemlab_resources enable row level security;
alter table stemlab_manuals enable row level security;
alter table stemlab_sessions enable row level security;
alter table stemlab_schools enable row level security;
alter table stemlab_facilitators enable row level security;

drop policy if exists "stemlab prototype resources" on stemlab_resources;
create policy "stemlab prototype resources" on stemlab_resources for all using (true) with check (true);
drop policy if exists "stemlab prototype manuals" on stemlab_manuals;
create policy "stemlab prototype manuals" on stemlab_manuals for all using (true) with check (true);
drop policy if exists "stemlab prototype sessions" on stemlab_sessions;
create policy "stemlab prototype sessions" on stemlab_sessions for all using (true) with check (true);
drop policy if exists "stemlab prototype schools" on stemlab_schools;
create policy "stemlab prototype schools" on stemlab_schools for all using (true) with check (true);
drop policy if exists "stemlab prototype facilitators" on stemlab_facilitators;
create policy "stemlab prototype facilitators" on stemlab_facilitators for all using (true) with check (true);

grant select, insert, update, delete on stemlab_resources to anon, authenticated;
grant select, insert, update, delete on stemlab_manuals to anon, authenticated;
grant select, insert, update, delete on stemlab_sessions to anon, authenticated;
grant select, insert, update, delete on stemlab_schools to anon, authenticated;
grant select, insert, update, delete on stemlab_facilitators to anon, authenticated;

-- This portal reuses the VICT assessment project's existing registered_students table.
-- Run this file once in the Supabase SQL Editor. The portal then imports its bundled JSON data automatically.
