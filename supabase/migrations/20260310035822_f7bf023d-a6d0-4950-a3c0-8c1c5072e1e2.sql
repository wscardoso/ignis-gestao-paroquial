
-- Allow the handle_new_user trigger to insert profiles (it runs as SECURITY DEFINER so this isn't strictly needed,
-- but let's also allow authenticated users to insert their own profile as fallback)
CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
