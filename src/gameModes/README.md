# Game Modes – Neuen Spielmodus hinzufügen

## Übersicht

Jeder Spielmodus lebt in seinem eigenen Ordner unter `src/gameModes/` und wird zentral in `index.js` registriert. Die Seiten (QuizCreate, QuizEdit, HostScreen, PlayerScreen) sind **mode-agnostisch** – sie nutzen ausschließlich die Registry.

```
src/gameModes/
  index.js                    ← Zentrale Registry
  README.md                   ← Diese Datei
  qa/                         ← Klassisch Frage & Antwort
  trueFalse/                  ← Wahr und Lüge
  identifyImage/              ← Wer oder was ist das?
  meinNeuerModus/             ← ← Dein neuer Modus
```

---

## Schritt-für-Schritt Workflow

### 1. Ordner anlegen

Erstelle einen neuen Ordner mit camelCase-Name:

```
src/gameModes/meinNeuerModus/
```

### 2. Pflicht-Dateien erstellen

Jeder Modus braucht **mindestens** diese 4 Dateien:

| Datei                | Zweck                                                     |
| -------------------- | --------------------------------------------------------- |
| `QuestionEditor.jsx` | Editor-UI im Quiz-Erstellen/Bearbeiten (Inputs pro Frage) |
| `validate.js`        | Validierung: welche Fragen sind gültig?                   |
| `HostView.jsx`       | Host-Ansicht während des Spiels (oder Platzhalter)        |
| `PlayerView.jsx`     | Spieler-Ansicht während des Spiels (oder Platzhalter)     |

**Optional:**

| Datei                 | Zweck                                                |
| --------------------- | ---------------------------------------------------- |
| `QuestionDisplay.jsx` | Eigene Frage-Darstellung im Spiel (z.B. Bild + Text) |

### 3. QuestionEditor.jsx

Rendert die Eingabefelder pro Frage auf den Create/Edit-Seiten.

**Props:**

| Prop       | Typ      | Beschreibung                                 |
| ---------- | -------- | -------------------------------------------- |
| `question` | Object   | `{ key, question, answer, image_path, ... }` |
| `onUpdate` | Function | `(key, field, value) => void`                |
| `quizId`   | String   | Quiz-ID (für Uploads o.ä.)                   |

**Beispiel (minimal):**

```jsx
import { Input } from '../../components/ui/Input';

export default function QuestionEditor({ question, onUpdate }) {
  return (
    <>
      <Input
        value={question.question}
        onChange={(e) => onUpdate(question.key, 'question', e.target.value)}
        placeholder="Frage eingeben…"
        className="mb-2"
      />
      <Input
        value={question.answer || ''}
        onChange={(e) => onUpdate(question.key, 'answer', e.target.value)}
        placeholder="Antwort"
        className="text-sm"
      />
    </>
  );
}
```

### 4. validate.js

Zwei Export-Funktionen:

```js
/**
 * Gibt nur die gültigen Fragen zurück (zum Speichern).
 */
export function validateQuestions(questions) {
  return questions.filter((q) => q.question.trim());
}

/**
 * Gibt einen Fehlertext zurück, oder null wenn alles OK ist.
 */
export function getValidationError(questions) {
  const valid = validateQuestions(questions);
  if (valid.length === 0) return 'Mindestens eine Frage ist erforderlich.';
  return null;
}
```

> **Tipp:** Passe die Filter-Logik an deinen Modus an. Beispiel `identifyImage` filtert nach `q.image_path` statt `q.question.trim()`.

### 5. HostView.jsx & PlayerView.jsx

Wenn dein Modus den **Standard-QA-Flow** nutzen soll (Host bewertet manuell, Spieler tippt Antwort), erstelle Platzhalter und setze in der Registry `hostView: null` / `playerView: null`:

```jsx
export default function HostView({ room, questions, players }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
      <p className="text-gray-400">Mein Modus – Host-Ansicht</p>
    </div>
  );
}
```

Wenn dein Modus eine **eigene Spiellogik** braucht (z.B. automatische Bewertung, Timer, Multiple Choice), implementiere die volle Logik in diesen Dateien und setze `hostView` / `playerView` auf die Komponenten.

**HostView Props:** `{ room, questions, players }`
**PlayerView Props:** `{ room, question, playerData }`

### 6. QuestionDisplay.jsx (optional)

Nur nötig, wenn dein Modus die Frage **anders darstellen** soll als nur Text (z.B. Bild + Text). Wird im Host- und Player-Default-Flow genutzt.

```jsx
export default function QuestionDisplay({ question }) {
  if (!question) return null;
  return (
    <>
      {/* Deine Custom-Darstellung */}
      <h2 className="text-xl font-semibold">{question.question}</h2>
    </>
  );
}
```

> Wenn `questionDisplay: null` → Der Default-Flow zeigt `image_path` (falls vorhanden) + Fragetext automatisch.

### 7. In der Registry registrieren

Öffne `src/gameModes/index.js` und füge hinzu:

```js
// 1. Imports
import MeinModusHostView from './meinNeuerModus/HostView';
import MeinModusPlayerView from './meinNeuerModus/PlayerView';
import MeinModusQuestionEditor from './meinNeuerModus/QuestionEditor';
import {
  validateQuestions as mmValidate,
  getValidationError as mmError,
} from './meinNeuerModus/validate';
// Optional:
// import MeinModusQuestionDisplay from './meinNeuerModus/QuestionDisplay';

// 2. Eintrag in GAME_MODES
export const GAME_MODES = {
  // ... bestehende Modi ...
  mein_modus: {
    label: 'Mein neuer Modus', // Anzeigename im Dropdown
    hostView: null, // null = Standard-QA-Flow
    playerView: null, // null = Standard-QA-Flow
    questionEditor: MeinModusQuestionEditor,
    validateQuestions: mmValidate,
    getValidationError: mmError,
    questionDisplay: null, // null = Standard (image_path + Text)
  },
};
```

### 8. DB-Änderungen (falls nötig)

Wenn dein Modus neue Spalten in `quiz_questions` braucht:

1. Migration erstellen: `supabase/migrations/XXX_beschreibung.sql`
2. `supabase/schema.sql` aktualisieren
3. SQL im Supabase Dashboard ausführen
4. `api.js` → `saveQuestions()` anpassen, damit die neuen Felder gespeichert werden

### 9. Testen

1. `npx vite build` → keine Fehler?
2. Quiz erstellen mit neuem Modus → Editor korrekt?
3. Quiz speichern → Validierung greift?
4. Raum erstellen → Spiel starten → Host sieht Fragen?
5. Spieler beitritt → Fragen + Antwort funktioniert?

### 10. Commit

```bash
git add -A
git commit -m "feat(mein_modus): neuer Spielmodus"
git push origin main
```

---

## Registry-Felder Referenz

| Feld                 | Typ                            | Pflicht | Beschreibung                                 |
| -------------------- | ------------------------------ | ------- | -------------------------------------------- |
| `label`              | `string`                       | ✅      | Anzeigename im Dropdown                      |
| `hostView`           | `Component \| null`            | ✅      | Host-Spielansicht (`null` = Standard-QA)     |
| `playerView`         | `Component \| null`            | ✅      | Player-Spielansicht (`null` = Standard-QA)   |
| `questionEditor`     | `Component`                    | ✅      | Editor pro Frage                             |
| `validateQuestions`  | `(questions) → questions[]`    | ✅      | Filtert gültige Fragen                       |
| `getValidationError` | `(questions) → string \| null` | ✅      | Fehlermeldung oder null                      |
| `questionDisplay`    | `Component \| null`            | ❌      | Eigene Frage-Darstellung (`null` = Standard) |

## Bestehende Modi als Referenz

| Modus                 | Key              | Besonderheiten                                             |
| --------------------- | ---------------- | ---------------------------------------------------------- |
| Frage & Antwort       | `qa`             | Standard-Flow, Textfrage + Textantwort                     |
| Wahr und Lüge         | `true_false`     | Eigene PlayerView (Buttons statt Textarea), auto-evaluate  |
| Wer oder was ist das? | `identify_image` | Bild-Upload via Supabase Storage, QuestionDisplay mit Bild |
