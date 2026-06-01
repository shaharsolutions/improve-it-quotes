create table if not exists public.signed_quotes (
  id text primary key,
  signed_at timestamptz not null default now(),
  quote jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.template_settings (
  id text primary key default 'default',
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.client_logo_settings (
  id text primary key default 'default',
  logos jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.signed_quotes enable row level security;
alter table public.template_settings enable row level security;
alter table public.client_logo_settings enable row level security;

drop policy if exists "signed quotes are publicly readable" on public.signed_quotes;
create policy "signed quotes are publicly readable"
on public.signed_quotes for select
to anon
using (true);

drop policy if exists "signed quotes can be created from the app" on public.signed_quotes;
create policy "signed quotes can be created from the app"
on public.signed_quotes for insert
to anon
with check (true);

drop policy if exists "signed quotes can be deleted from the app" on public.signed_quotes;
create policy "signed quotes can be deleted from the app"
on public.signed_quotes for delete
to anon
using (true);

drop policy if exists "template settings are publicly readable" on public.template_settings;
create policy "template settings are publicly readable"
on public.template_settings for select
to anon
using (true);

drop policy if exists "template settings can be saved from the app" on public.template_settings;
create policy "template settings can be saved from the app"
on public.template_settings for insert
to anon
with check (id = 'default');

drop policy if exists "template settings can be updated from the app" on public.template_settings;
create policy "template settings can be updated from the app"
on public.template_settings for update
to anon
using (id = 'default')
with check (id = 'default');

drop policy if exists "template settings can be reset from the app" on public.template_settings;
create policy "template settings can be reset from the app"
on public.template_settings for delete
to anon
using (id = 'default');

drop policy if exists "client logos are publicly readable" on public.client_logo_settings;
create policy "client logos are publicly readable"
on public.client_logo_settings for select
to anon
using (true);

drop policy if exists "client logos can be saved from the app" on public.client_logo_settings;
create policy "client logos can be saved from the app"
on public.client_logo_settings for insert
to anon
with check (id = 'default');

drop policy if exists "client logos can be updated from the app" on public.client_logo_settings;
create policy "client logos can be updated from the app"
on public.client_logo_settings for update
to anon
using (id = 'default')
with check (id = 'default');
