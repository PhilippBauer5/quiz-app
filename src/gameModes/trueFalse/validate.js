/**
 * TrueFalse Validation
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.question.trim());
}

export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length === 0) return 'Mindestens eine Frage ist erforderlich.';
  return null;
}
