/**
 * Game Modes Registry
 *
 * WICHTIG: Neuen Modus hinzufügen → 3 Stellen anpassen:
 * 1. Hier registrieren (hostView, playerView, label)
 * 2. QuizCreatePage.jsx → Antwort-Input für den Modus anpassen
 * 3. QuizEditPage.jsx   → Antwort-Input für den Modus anpassen
 *
 * hostView: null → nutzt die Standard-QA Host-Ansicht
 */

import QAHostView from './qa/HostView';
import QAPlayerView from './qa/PlayerView';
import TrueFalseHostView from './trueFalse/HostView';
import TrueFalsePlayerView from './trueFalse/PlayerView';

export const GAME_MODES = {
  qa: {
    label: 'Klassisch Frage & Antwort',
    hostView: QAHostView,
    playerView: QAPlayerView,
  },
  true_false: {
    label: 'Wahr und Lüge',
    hostView: null,
    playerView: TrueFalsePlayerView,
  },
};
