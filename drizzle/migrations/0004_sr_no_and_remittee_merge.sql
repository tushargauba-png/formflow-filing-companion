-- New forms without a Sr No get the next running number (numeric Sr Nos only; mirrors nextSrNo in src/lib/validation.ts).
create or replace function public.forms_assign_sr_no() returns trigger language plpgsql set search_path = public as $$
begin
 if new.sr_no is null or btrim(new.sr_no) = '' then
  perform pg_advisory_xact_lock(hashtext('forms_sr_no'));
  select (coalesce(max(btrim(sr_no)::bigint), 0) + 1)::text into new.sr_no from public.forms where btrim(sr_no) ~ '^\d+$';
 end if;
 return new;
end $$;
create trigger forms_assign_sr_no before insert on public.forms for each row execute function public.forms_assign_sr_no();

-- Merge duplicate remittees: move their forms to the one being kept, then delete the duplicates.
-- Runs as the caller, so the allowed-users RLS policies still apply.
create or replace function public.merge_remittees(keep_id uuid, merge_ids uuid[], mark_revised boolean default false)
returns integer language plpgsql set search_path = public as $$
declare moved integer;
begin
 if keep_id = any(merge_ids) then raise exception 'Cannot merge a remittee into itself'; end if;
 if not exists (select 1 from public.remittees where id = keep_id) then raise exception 'Remittee to keep was not found'; end if;
 update public.forms set remittee_id = keep_id, is_revised = is_revised or mark_revised where remittee_id = any(merge_ids);
 get diagnostics moved = row_count;
 delete from public.remittees where id = any(merge_ids);
 return moved;
end $$;
revoke execute on function public.merge_remittees(uuid, uuid[], boolean) from public, anon;
grant execute on function public.merge_remittees(uuid, uuid[], boolean) to authenticated;
