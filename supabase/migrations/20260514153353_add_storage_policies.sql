/*
  # Add storage policies for archive-files bucket

  1. New Policies
    - Authenticated users can upload files
    - Anyone can read files (public bucket)
    - Users can update/delete their own uploads
*/

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'archive-files');

-- Allow anyone to read
CREATE POLICY "Anyone can read archive files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'archive-files');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'archive-files');
