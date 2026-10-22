<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All app data (remitters, remittees, forms, export_templates, form_attachments) is shared across signed-in users via `to authenticated using (true)` RLS — single-firm app; add roles via a separate user_roles table if staff permissions are needed.
- Form 145 will reuse the `forms` table via the `form_type` column ('146' / '145') rather than a new table, so masters, register and exports stay shared.
- Form field definitions, statuses and export columns live in `src/lib/form-fields.ts`; editor, preview and exports read from there so a new field is added in one place.
- Data reads go through react-query options in `src/lib/queries.ts` using the browser client (RLS applies); no server functions needed yet.
- Supporting documents live in the private `form-files` storage bucket, opened via short-lived signed URLs.
- Form-specific portal fields and editable party snapshots are stored in forms.portal_details; shared scalar amounts remain canonical for reports, and field definitions drive editor, preview and exports.
- Remittance and gross-up calculations live in a pure tested module; explicit calculation or enabled automatic recalculation prevents silently altering historic amounts.
