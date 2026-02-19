import { getImageUrl } from '../../lib/supabase/imageStorage';

/**
 * Renders a question image + optional text for any game mode.
 * Used by HostScreen and PlayerScreen in the default QA flow.
 */
export default function QuestionDisplay({ question }) {
  if (!question) return null;

  return (
    <>
      {question.image_path && (
        <img
          src={getImageUrl(question.image_path)}
          alt="Fragebild"
          className="rounded-xl max-h-64 w-full object-contain bg-gray-900 border border-gray-700 mt-2 mb-3"
        />
      )}
      {question.question && (
        <h2 className="text-xl font-semibold mt-2 mb-2">
          {question.question}
        </h2>
      )}
    </>
  );
}
