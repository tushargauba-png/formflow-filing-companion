-- Only emails listed in allowed_users (with a confirmed sign-in) can see or change app data.
create table public.allowed_users(
 email text primary key check (email = lower(email)), note text,
 created_at timestamptz not null default now());
alter table public.allowed_users enable row level security;
grant select on public.allowed_users to authenticated;
grant all on public.allowed_users to service_role;
insert into public.allowed_users(email, note) values ('tushar.gauba@tkassociate.in', 'Owner');

create function public.is_allowed_user() returns boolean language sql stable security definer set search_path = public, auth as $$
 select exists(
  select 1 from auth.users u join public.allowed_users a on a.email = lower(u.email)
  where u.id = auth.uid() and u.email_confirmed_at is not null)
$$;
revoke execute on function public.is_allowed_user() from public, anon;
grant execute on function public.is_allowed_user() to authenticated;

drop policy "auth all" on public.remitters;
drop policy "auth all" on public.remittees;
drop policy "auth all" on public.forms;
drop policy "auth all" on public.export_templates;
drop policy "auth all" on public.form_attachments;
drop policy "auth files" on storage.objects;
create policy "allowed users" on public.remitters for all to authenticated using (public.is_allowed_user()) with check (public.is_allowed_user());
create policy "allowed users" on public.remittees for all to authenticated using (public.is_allowed_user()) with check (public.is_allowed_user());
create policy "allowed users" on public.forms for all to authenticated using (public.is_allowed_user()) with check (public.is_allowed_user());
create policy "allowed users" on public.export_templates for all to authenticated using (public.is_allowed_user()) with check (public.is_allowed_user());
create policy "allowed users" on public.form_attachments for all to authenticated using (public.is_allowed_user()) with check (public.is_allowed_user());
create policy "allowed users" on public.allowed_users for select to authenticated using (public.is_allowed_user());
create policy "allowed users files" on storage.objects for all to authenticated
 using (bucket_id = 'form-files' and public.is_allowed_user()) with check (bucket_id = 'form-files' and public.is_allowed_user());

-- Import helpers from 0001 are no longer needed.
drop function if exists public._r(text);
drop function if exists public._e(text);
