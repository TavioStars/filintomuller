
-- Add DELETE policy for admins on notification-images bucket
CREATE POLICY "Admins can delete notification images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'notification-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
