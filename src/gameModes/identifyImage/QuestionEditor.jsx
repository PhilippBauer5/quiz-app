import { useState } from 'react';
import { Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  uploadQuestionImage,
  getImageUrl,
  deleteQuestionImage,
} from '../../lib/supabase/imageStorage';
import { toast } from 'sonner';

/**
 * IdentifyImage QuestionEditor – Bild-Upload + optionaler Frage-Text + Antwort
 *
 * Props:
 *   question   – das Frage-Objekt { key, question, answer, image_path }
 *   onUpdate   – (key, field, value) => void
 *   quizId     – Quiz-ID für Storage-Pfade
 */
export default function QuestionEditor({ question, onUpdate, quizId }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file) {
    setUploading(true);
    try {
      const path = await uploadQuestionImage(file, quizId, question.key);
      onUpdate(question.key, 'image_path', path);
      toast.success('Bild hochgeladen');
    } catch (err) {
      toast.error(err.message || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    try {
      await deleteQuestionImage(question.image_path);
    } catch {
      // ignore – file may already be gone
    }
    onUpdate(question.key, 'image_path', null);
  }

  return (
    <>
      <Input
        value={question.question}
        onChange={(e) => onUpdate(question.key, 'question', e.target.value)}
        placeholder="Frage (optional)"
        className="mb-2"
      />

      {/* Image upload zone */}
      <div className="mb-2">
        {question.image_path ? (
          <div className="relative group">
            <img
              src={getImageUrl(question.image_path)}
              alt="Fragebild"
              className="rounded-lg max-h-48 w-full object-contain bg-gray-900 border border-gray-700"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Entfernen
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 px-4 py-6 text-sm text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Wird hochgeladen…</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span>Bild hochladen (max. 3 MB)</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      <Input
        value={question.answer || ''}
        onChange={(e) => onUpdate(question.key, 'answer', e.target.value)}
        placeholder="Musterantwort (optional)"
        className="text-sm"
      />
    </>
  );
}
