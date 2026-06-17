/*
  # Add Document Annotations/Notes Table

  1. New Table: `document_annotations`
    - Stores user notes and annotations linked to documents
    - Each annotation tied to a user and document
    - Supports multiple notes per document per user
    - Timestamp tracking for edit history

  2. Security
    - Enable RLS on `document_annotations` table
    - Users can only view/edit their own annotations
    - Allow reading others' public annotations (if implemented)
*/

CREATE TABLE IF NOT EXISTS document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id uuid NOT NULL REFERENCES archives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage own annotations"
  ON document_annotations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public annotations"
  ON document_annotations FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE INDEX idx_document_annotations_archive_id ON document_annotations(archive_id);
CREATE INDEX idx_document_annotations_user_id ON document_annotations(user_id);
