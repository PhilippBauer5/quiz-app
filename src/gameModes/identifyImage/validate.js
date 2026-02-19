/**
 * IdentifyImage Validation – Jede Frage braucht ein Bild + Musterantwort.
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.image_path && q.answer?.trim());
}

export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length === 0)
    return 'Mindestens eine Frage mit Bild und Musterantwort ist erforderlich.';
  const missing = questions.filter((q) => q.image_path && !q.answer?.trim());
  if (missing.length > 0)
    return `${missing.length} Frage(n) ohne Musterantwort. Bitte ergänzen.`;
  return null;
}
