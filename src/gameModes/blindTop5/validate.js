/**
 * Blind Top 5 – Validation
 *
 * A blind_top5 quiz needs exactly 5 items (stored as quiz_questions).
 * Each item needs a non-empty question text.
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.question.trim());
}

export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length !== 5) {
    return 'Blind Top 5 benötigt genau 5 Items.';
  }
  return null;
}
