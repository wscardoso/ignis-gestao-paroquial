ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS number text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS foundation_date text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS notes text;