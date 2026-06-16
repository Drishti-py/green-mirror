
CREATE POLICY "Users can upload own bills"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bills' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own bills"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bills' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own bills"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bills' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own bills"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bills' AND (storage.foldername(name))[1] = auth.uid()::text);
