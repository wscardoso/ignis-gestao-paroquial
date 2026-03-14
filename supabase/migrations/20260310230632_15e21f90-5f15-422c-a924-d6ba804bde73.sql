-- Drop the recursive policies
DROP POLICY IF EXISTS "super_admin_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_profiles" ON public.profiles;

-- Recreate using security definer functions (no recursion)
CREATE POLICY "super_admin_view_all_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (get_my_role() = 'super_admin');

CREATE POLICY "super_admin_update_profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'super_admin');