create table public.remitters(
 id uuid primary key default gen_random_uuid(), nickname text not null, name text not null, pan text, tan text,
 address text, city text, state text, pincode text, country text default 'India', email text, phone text,
 ao_details text, bank_name text, bank_branch text, bsr_code text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.remittees(
 id uuid primary key default gen_random_uuid(), nickname text not null, name text not null, country text,
 address text, tin text, email text, nature_of_remittance text, purpose_code text, dtaa_article text,
 trc_available boolean default false, form_10f boolean default false, pe_in_india boolean default false, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.forms(
 id uuid primary key default gen_random_uuid(), form_type text not null default '146', sr_no text, fy text,
 start_date date default current_date, remitter_id uuid references public.remitters(id) on delete set null,
 remittee_id uuid references public.remittees(id) on delete set null, is_revised boolean not null default false,
 status text not null default 'Draft', remittee_invoice_no text, remittee_invoice_date date, remittee_tin text,
 currency text, amount_fc numeric, exchange_rate numeric, amount_inr numeric, gross_amount numeric, net_amount numeric,
 nature_of_remittance text, purpose_code text, relevant_section text, dtaa_article text, taxable_in_india text,
 tds_rate numeric, tds_amount numeric, tds_basis text, bank_name text, proposed_remittance_date date,
 filing_date date, ack_no text, udin text, certification_charges numeric, invoicing_status text not null default 'Not invoiced',
 billing_invoice_no text, payment_status text not null default 'Not applicable', certificate_required text,
 document_description text, remarks text, copied_from uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.export_templates(
 id uuid primary key default gen_random_uuid(), name text not null, columns jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now());
create table public.form_attachments(
 id uuid primary key default gen_random_uuid(), form_id uuid not null references public.forms(id) on delete cascade,
 file_name text not null, storage_path text not null, doc_type text, created_at timestamptz not null default now());
grant select,insert,update,delete on public.remitters, public.remittees, public.forms, public.export_templates, public.form_attachments to authenticated;
grant all on public.remitters, public.remittees, public.forms, public.export_templates, public.form_attachments to service_role;
alter table public.remitters enable row level security;
alter table public.remittees enable row level security;
alter table public.forms enable row level security;
alter table public.export_templates enable row level security;
alter table public.form_attachments enable row level security;
create policy "auth all" on public.remitters for all to authenticated using (true) with check (true);
create policy "auth all" on public.remittees for all to authenticated using (true) with check (true);
create policy "auth all" on public.forms for all to authenticated using (true) with check (true);
create policy "auth all" on public.export_templates for all to authenticated using (true) with check (true);
create policy "auth all" on public.form_attachments for all to authenticated using (true) with check (true);
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
create trigger t1 before update on public.remitters for each row execute function public.touch_updated_at();
create trigger t2 before update on public.remittees for each row execute function public.touch_updated_at();
create trigger t3 before update on public.forms for each row execute function public.touch_updated_at();
create policy "auth files" on storage.objects for all to authenticated using (bucket_id='form-files') with check (bucket_id='form-files');