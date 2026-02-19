/**
 * IdentifyImage Validation – Jede Frage braucht ein Bild.
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.image_path);
}

export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length === 0) return 'Mindestens eine Frage mit Bild ist erforderlich.';
  return null;
}
