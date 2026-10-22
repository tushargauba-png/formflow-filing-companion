ALTER TABLE public.forms ADD COLUMN portal_details jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.forms.portal_details IS 'Form 146 portal-specific fields and editable remitter/remittee snapshots; existing scalar fields remain canonical for reports.';
ALTER TABLE public.remitters ADD COLUMN entity_status text, ADD COLUMN residential_status text, ADD COLUMN bank_ifsc text;
ALTER TABLE public.remittees ADD COLUMN pan text, ADD COLUMN phone text, ADD COLUMN principal_place text, ADD COLUMN trc_number text;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms, public.remitters, public.remittees TO authenticated;
GRANT ALL ON public.forms, public.remitters, public.remittees TO service_role;