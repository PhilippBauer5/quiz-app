import { supabase } from '../supabaseClient';

const BUCKET = 'quiz-images';
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

/**
 * Upload an image file to Supabase Storage.
 * @param {File} file
 * @param {string} quizId
 * @param {string} questionKey - local question key (UUID)
 * @returns {Promise<string>} image_path in the bucket
 */
export async function uploadQuestionImage(file, quizId, questionKey) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Nur Bilddateien sind erlaubt.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Bild darf maximal 3 MB groß sein.');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const ts = Date.now();
  const path = `${quizId}/${questionKey}-${ts}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (error) throw error;

  return path;
}

/**
 * Get the public URL for an image_path stored in Supabase Storage.
 * @param {string} imagePath
 * @returns {string}
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(imagePath);
  return data?.publicUrl || null;
}

/**
 * Delete an image from Supabase Storage.
 * @param {string} imagePath
 */
export async function deleteQuestionImage(imagePath) {
  if (!imagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
  if (error) console.error('deleteQuestionImage error:', error);
}
