/**
 * TrueFalse Validation – Frage + Wahr/Falsch Auswahl erforderlich
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.question.trim() && q.answer?.trim());
}

export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length === 0)
    return 'Mindestens eine Frage mit Antwort (Wahr/Falsch) ist erforderlich.';
  const missing = questions.filter(
    (q) => q.question.trim() && !q.answer?.trim()
  );
  if (missing.length > 0)
    return `${missing.length} Frage(n) ohne Antwort. Bitte Wahr oder Falsch auswählen.`;
  return null;
}
