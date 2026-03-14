
INSERT INTO storage.buckets (id, name, public) VALUES ('parishes', 'parishes', true);

CREATE POLICY "Authenticated users can upload parish logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'parishes');

CREATE POLICY "Anyone can view parish logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'parishes');

CREATE POLICY "Authenticated users can update parish logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'parishes');
