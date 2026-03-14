ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT TO authenticated USING (true);