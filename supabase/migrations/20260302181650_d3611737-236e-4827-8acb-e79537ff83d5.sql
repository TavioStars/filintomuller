
-- Storage policies for material-files bucket
CREATE POLICY "Anyone can view material files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'material-files');

CREATE POLICY "Admins can upload material files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'material-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete material files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'material-files' AND public.has_role(auth.uid(), 'admin'));
