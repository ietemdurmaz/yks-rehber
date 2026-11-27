create type public.app_role as enum ('super_admin', 'tenant_admin');
create type public.institution_type as enum ('devlet', 'vakif');
create type public.score_type as enum ('SAY', 'EA', 'SOZ', 'DIL', 'TYT');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete restrict,
  full_name text not null check (length(full_name) between 2 and 200),
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tenant_admin_requires_tenant check (role = 'super_admin' or tenant_id is not null)
);

create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'super_admin' from public.profiles p where p.id = auth.uid() and p.is_active),
    false
  );
$$;

create function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.tenant_id from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null check (length(name) between 2 and 100),
  unique (id, tenant_id),
  unique (tenant_id, name)
);

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  city_id uuid not null,
  name text not null check (length(name) between 2 and 200),
  type public.institution_type not null,
  unique (id, tenant_id),
  foreign key (city_id, tenant_id) references public.cities (id, tenant_id) on delete restrict
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  university_id uuid not null,
  name text not null check (length(name) between 2 and 200),
  score_type public.score_type not null,
  base_score numeric(6, 2) not null check (base_score between 0 and 600),
  ranking integer check (ranking > 0),
  data_year smallint not null check (data_year between 2000 and 2100),
  source text not null check (length(source) between 2 and 500),
  foreign key (university_id, tenant_id) references public.universities (id, tenant_id) on delete restrict
);

create table public.housing_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  city_id uuid not null,
  label text not null check (length(label) between 2 and 200),
  min_price integer not null check (min_price >= 0),
  max_price integer not null check (max_price >= min_price),
  price_date date not null,
  source text not null check (length(source) between 2 and 500),
  foreign key (city_id, tenant_id) references public.cities (id, tenant_id) on delete restrict
);

create table public.job_listings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  city_id uuid not null,
  title text not null check (length(title) between 2 and 200),
  min_income integer not null check (min_income >= 0),
  max_income integer not null check (max_income >= min_income),
  price_date date not null,
  source text not null check (length(source) between 2 and 500),
  foreign key (city_id, tenant_id) references public.cities (id, tenant_id) on delete restrict
);

create table public.living_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  city_id uuid not null,
  category text not null check (length(category) between 2 and 100),
  min_amount integer not null check (min_amount >= 0),
  max_amount integer not null check (max_amount >= min_amount),
  price_date date not null,
  source text not null check (length(source) between 2 and 500),
  foreign key (city_id, tenant_id) references public.cities (id, tenant_id) on delete restrict
);

create table public.site_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 2 and 200),
  body text not null,
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  tenant_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  result text not null check (result in ('success', 'denied', 'failure')),
  request_id text,
  changes jsonb
);

create function public.audit_logs_block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs kayitlari degistirilemez';
end;
$$;

create trigger audit_logs_no_update_delete
before update or delete on public.audit_logs
for each row execute function public.audit_logs_block_mutation();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.universities enable row level security;
alter table public.programs enable row level security;
alter table public.housing_options enable row level security;
alter table public.job_listings enable row level security;
alter table public.living_costs enable row level security;
alter table public.site_pages enable row level security;
alter table public.audit_logs enable row level security;

create policy tenants_read on public.tenants for select to anon, authenticated using (true);
create policy tenants_write on public.tenants for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin());
create policy profiles_write on public.profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy cities_read on public.cities for select to anon, authenticated using (true);
create policy cities_write on public.cities for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy universities_read on public.universities for select to anon, authenticated using (true);
create policy universities_write on public.universities for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy programs_read on public.programs for select to anon, authenticated using (true);
create policy programs_write on public.programs for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy housing_options_read on public.housing_options for select to anon, authenticated using (true);
create policy housing_options_write on public.housing_options for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy job_listings_read on public.job_listings for select to anon, authenticated using (true);
create policy job_listings_write on public.job_listings for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy living_costs_read on public.living_costs for select to anon, authenticated using (true);
create policy living_costs_write on public.living_costs for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy site_pages_read on public.site_pages for select to anon, authenticated using (true);
create policy site_pages_write on public.site_pages for all to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id())
  with check (public.is_super_admin() or tenant_id = public.current_tenant_id());

create policy audit_logs_read on public.audit_logs for select to authenticated
  using (public.is_super_admin() or tenant_id = public.current_tenant_id());

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
revoke insert, update, delete on public.tenants, public.profiles from anon;
revoke insert, update, delete on public.cities, public.universities, public.programs,
  public.housing_options, public.job_listings, public.living_costs, public.site_pages from anon;
