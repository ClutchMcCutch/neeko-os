create table if not exists public.team_members (
  email text primary key,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

insert into public.team_members (email, role)
values ('info@libertyhospitalityphl.com', 'owner')
on conflict (email) do update set role = excluded.role;

create table if not exists public.workspace_state (
  id text primary key default 'neeko',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create or replace function public.touch_workspace_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = lower(auth.jwt() ->> 'email');
  return new;
end;
$$;

drop trigger if exists workspace_state_touch on public.workspace_state;
create trigger workspace_state_touch
before insert or update on public.workspace_state
for each row execute function public.touch_workspace_state();

alter table public.team_members enable row level security;
alter table public.workspace_state enable row level security;

create or replace function public.is_neeko_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

drop policy if exists "team can read team list" on public.team_members;
create policy "team can read team list"
on public.team_members
for select
to authenticated
using (public.is_neeko_team_member());

drop policy if exists "team can read workspace" on public.workspace_state;
create policy "team can read workspace"
on public.workspace_state
for select
to authenticated
using (public.is_neeko_team_member());

drop policy if exists "team can create workspace" on public.workspace_state;
create policy "team can create workspace"
on public.workspace_state
for insert
to authenticated
with check (public.is_neeko_team_member());

drop policy if exists "team can update workspace" on public.workspace_state;
create policy "team can update workspace"
on public.workspace_state
for update
to authenticated
using (public.is_neeko_team_member())
with check (public.is_neeko_team_member());

do $$
begin
  alter publication supabase_realtime add table public.workspace_state;
exception
  when duplicate_object then null;
end $$;
