## Phase 2 – Quiz Creator (Upload) (2–4 Sessions)

### 2.1 Quiz-Create Screen

Route: `/quiz/create`

- Felder: Titel, Beschreibung, Typ = `standard_qa`
- Fragenliste:
  - `prompt`
  - `solutionText` (für Host als Referenz)
  - `points` (default 1)
- Speichern → schreibt `quizzes` + `quiz_questions`

### 2.2 Quiz List (für Host)

Route: `/quizzes`

- Liste eigener Quizzes
- “Start Show” Button pro Quiz

**Definition of Done**

- Du kannst ein Quiz anlegen und wieder laden
- Fragenreihenfolge stimmt (`order_index`)
  Ok dann lass uns mühe die UX so gut wie möglich zu machen:
  Wir müssen den Wust hier in eine gute UX bringen, und du musst dafür sorgen das solche Funktionen wie load nicht vergessen werden, von denen ich keine Ahnung habe.

Meine Vorstellung:

- Ich öffne die Seite 3 Buttons:

1. Quiz erstellen
2. Raum beitreten
3. Raum erstellen (Hosten, Automatischer Gamemaster)

# Quiz erstellen:

- Dort kann man dann seine Bisher erstellen Quizzen sehen in einer Kachel Optic
- Wenn noch keine Da ein großes Plus
  -> Wenn schon welche erstellt sind das Plus dezentraler, aber eingängig
- Klickt man aufs Plus kann man von verschiednen Quiz arten wählen
  -> Bei uns erstmal Standart Frage
  -> Da kann man dann erst Titel, dann frage 1 Antwort 1 Frage 2 Antwort 2 eigeben
- UNd speicher logic usw

# Raum beitreten

- Einfach nur eine neue Seite wo man einen Anzeige Namen und den Session / Raum Code eingibt
  -> Ich teste das nachher mit Labtop als Host und Handy als Player

# Raum erstellen

- Alles was es Braucht um einen Raum zu erzeugen den Player über den Code beitreten können
- Der der den Raum erstellt ist Automatisch Gamemaster, und kann bei den Submission auf richtig oder falsch drücken
- Beim klicken von Raum erstellen muss der Host aus seinen erstellten Quizes auswählen

---

## Ziel-UX: 3-Button Startseite

### Route: `/`

**Drei große Actions (Cards/Buttons):**

1. **Quiz erstellen**
2. **Raum beitreten**
3. **Raum erstellen (Host)**

Optional (aber sehr sinnvoll):

- Oben rechts klein: „Dev Panel“ nur in Development (nicht im Produkt-UI)

---

## 1) Quiz erstellen

### Route: `/quizzes`

Hier ist **dein Dashboard für eigene Quizzes** (Kacheloptik).

**States:**

- **Loading** (Skeletons/Spinner)
- **Empty State**: große Plus-Kachel “Quiz erstellen”
- **Liste**: Quiz-Kacheln + eine dezente Plus-Kachel

**Quiz-Kachel enthält:**

- Titel
- Beschreibung (kurz)
- Anzahl Fragen
- „Bearbeiten“
- Optional: „Starten“ (kann später auch hier sein, aber bei dir soll Host-Flow über „Raum erstellen“ laufen)

**Wichtig (Load nicht vergessen):**

- Beim Mount: `loadMyQuizzes()` (Supabase select)
- Sorting: z. B. `created_at desc`

### Route: `/quiz/create`

**Quiz Wizard (einfach, schnell, wenig Overhead):**

**Schritt 1: Quiz-Typ wählen**

- aktuell nur: `standard_qa`
- (UI trotzdem als Auswahl, damit später erweiterbar)

**Schritt 2: Metadaten**

- Titel (required)
- Beschreibung (optional)

**Schritt 3: Fragen erfassen**

- Liste von Fragekarten
- Jede Frage:
  - `prompt` (required)
  - `solutionText` (Host-Referenz, required oder optional – ich würde required machen, sonst ist Gamemaster später blind)
  - `points` (default 1)
- Buttons:
  - „+ Frage hinzufügen“
  - „Speichern“

**UX-Regeln die sich bewährt haben:**

- Autosave erst später. Am Anfang: „Speichern“ ist klarer.
- Validierung inline: “Titel fehlt”, “Frage 2 hat kein Prompt”, etc.
- Beim Speichern: erst Quiz anlegen, dann Fragen mit `order_index` als 0..n-1

### Route: `/quiz/:id/edit`

Gleicher Screen wie create, aber:

- Beim Mount: `loadQuiz(id)` + `loadQuestions(id order by order_index)`
- Speichern macht „Update Quiz“ + „Replace/Upsert Questions“

**Wichtig (auch so eine “vergessene” Funktion):**

- Wenn du Edit anbietest, brauchst du Load by ID + Questions load. Sonst wird UX schnell kaputt.

---

## 2) Raum beitreten

### Route: `/room/join`

Super simpel, wie du sagst:

**Felder:**

- Anzeigename (required)
- Raumcode (required)
- Button: „Beitreten“

**Flow:**

1. validate
2. `joinRoom(roomCode, displayName)`
3. navigate `/room/:code/play` (oder `/room/:id/play`)

**Für deinen Test (Host Laptop, Player Handy):**

- Der Player muss zuverlässig reconnecten können:
  - roomCode reicht, plus eine player-id in localStorage (später)
  - am Anfang genügt: neu joinen erzeugt neuen player record

---

## 3) Raum erstellen (Host)

### Route: `/room/create`

Hier passiert der „Host wählt Quiz → erstellt Raum“ Flow.

**Screen-Layout:**

- Oben: “Wähle Quiz”
- Darunter: Quiz-Kacheln (wie `/quizzes`, aber als Auswahl)
- Wenn keine Quizzes: Hinweis + Button „Quiz erstellen“
- Button: „Raum erstellen“

**Wichtig (Load nicht vergessen, wieder):**

- Beim Mount: `loadMyQuizzes()` (sonst ist Host-Screen tot)

**Flow:**

1. Host wählt Quiz
2. Klick „Raum erstellen“
3. `createRoom(quiz_id, host_user_id)` → erzeugt `room_code`
4. navigate `/room/:code/host`

### Route: `/room/:code/host`

Host-Ansicht als Gamemaster.

**Oben groß:**

- Raumcode + „Kopieren“-Button
- Status: “0 Spieler verbunden” (später live)
- Button: “Spiel starten”

**Spiel-Loop (Phase 1 simpel):**

- Wenn ein Player submitted:
  - Host sieht: Playername + Antworttext
  - Buttons: „Richtig“ / „Falsch“
  - ggf. „Punkte“ anpassbar oder per `points` der Frage
- Nach Bewertung: Host klickt “Nächste Frage”

Damit dein Kern funktioniert, brauchst du minimal:

- Eine “current_question_index” pro Room
- Submissions pro Frage/Player
- Host entscheidet richtig/falsch → Score update

---

## Informationsarchitektur (damit’s nicht wieder Wust wird)

### Empfohlene Routes (minimal, sauber)

- `/` Start
- `/quizzes` (Liste)
- `/quiz/create`
- `/quiz/:id/edit`
- `/room/join`
- `/room/create`
- `/room/:code/host`
- `/room/:code/play`

### Layout-Regel

- **Produkt-UI**: nur relevante Buttons
- **Dev Panel**: maximal unter `/?dev=1` oder nur in `import.meta.env.DEV`

So bleibt’s aufgeräumt.

---

## Daten-/Logik-Fallen die ich für dich „absichere“

Damit du nicht in typische Sackgassen rennst, hier die Stellen, die wir von Anfang an “richtig” bauen:

1. **Load-Listen auf allen Auswahl-Screens**
   - `/quizzes` lädt Quizzes
   - `/room/create` lädt Quizzes (wieder)
   - `/quiz/:id/edit` lädt Quiz + Fragen

2. **Fragenreihenfolge stabil**
   - `order_index` beim Insert setzen (0..n-1)
   - beim Load immer `order by order_index`

3. **Edit-Speicherstrategie**
   - Am Anfang am einfachsten: „Delete all questions for quiz_id“ + „Insert new ordered list“
   - Später kann man Upserts machen

4. **Room-Code UX**
   - Room Code muss gut lesbar sein (z. B. `ABCD12`)
   - Copy Button

5. **Player-Join**
   - Anzeigename required (sonst wird Host UI Mist)
   - room_code required

---

## Umsetzungs-Reihenfolge (damit du schnell ein spielbares Ergebnis hast)

1. **Routes + Startseite `/`** (3 Buttons, clean UI)
2. **Quizzes Liste `/quizzes`** inkl. Empty State + Load
3. **Quiz Create `/quiz/create`** inkl. Save (quizzes + quiz_questions)
4. **Room Create `/room/create`** inkl. Quiz-Auswahl + Load + Room anlegen
5. **Host Screen `/room/:code/host`** zeigt Code + “Spiel starten” (noch ohne Loop)
6. **Join Screen `/room/join`** + Player Screen placeholder
7. Danach: Submissions + Host Bewertung + Next Question

So hast du sehr früh einen “echten” Flow:  
Quiz erstellen → Raum erstellen → Code anzeigen → beitreten.

---

Wenn du mir sagst, ob ihr aktuell **React Router** drin habt (oder noch alles in einer Page), kann ich dir als nächsten Schritt direkt die **konkrete Ordner-/Komponentenstruktur** geben (z. B. `pages/`, `components/`, `lib/supabase/`, `features/quiz/`) und die minimalen Komponenten, die du jetzt als erstes anlegst – ohne irgendwas zu “refactoren”, nur sauber daneben aufbauen und dann das Dev Panel entfernen/auslagern.
