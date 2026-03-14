CREATE POLICY "super_admin_delete_profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (get_my_role() = 'super_admin');