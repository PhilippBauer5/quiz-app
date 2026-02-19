-- Add image_path column to quiz_questions for image-based quiz types
ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS image_path TEXT;
