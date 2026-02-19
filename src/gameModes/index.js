/**
 * Game Modes Registry
 *
 * Jeder Modus liefert:
 *   label            – Anzeigename im Dropdown
 *   hostView         – Host-Ansicht im aktiven Spiel (null → Standard-QA-Flow)
 *   playerView       – Spieler-Ansicht im aktiven Spiel (null → Standard-QA-Flow)
 *   questionEditor   – Editor-Komponente für Create/Edit-Seiten
 *   validateQuestions – (questions) → nur die gültigen Fragen
 *   getValidationError – (questions) → Fehlermeldung oder null
 *   questionDisplay  – optionale Komponente für Frage-Darstellung im Spiel (null → Standard)
 */

import QAHostView from './qa/HostView';
import QAPlayerView from './qa/PlayerView';
import QAQuestionEditor from './qa/QuestionEditor';
import {
  validateQuestions as qaValidate,
  getValidationError as qaError,
} from './qa/validate';

import TrueFalseHostView from './trueFalse/HostView';
import TrueFalsePlayerView from './trueFalse/PlayerView';
import TrueFalseQuestionEditor from './trueFalse/QuestionEditor';
import {
  validateQuestions as tfValidate,
  getValidationError as tfError,
} from './trueFalse/validate';

import IdentifyImageHostView from './identifyImage/HostView';
import IdentifyImagePlayerView from './identifyImage/PlayerView';
import IdentifyImageQuestionEditor from './identifyImage/QuestionEditor';
import IdentifyImageQuestionDisplay from './identifyImage/QuestionDisplay';
import {
  validateQuestions as iiValidate,
  getValidationError as iiError,
} from './identifyImage/validate';

export const GAME_MODES = {
  qa: {
    label: 'Klassisch Frage & Antwort',
    hostView: QAHostView,
    playerView: QAPlayerView,
    questionEditor: QAQuestionEditor,
    validateQuestions: qaValidate,
    getValidationError: qaError,
    questionDisplay: null,
  },
  true_false: {
    label: 'Wahr und Lüge',
    hostView: null,
    playerView: TrueFalsePlayerView,
    questionEditor: TrueFalseQuestionEditor,
    validateQuestions: tfValidate,
    getValidationError: tfError,
    questionDisplay: null,
  },
  identify_image: {
    label: 'Wer oder was ist das?',
    hostView: null,
    playerView: null,
    questionEditor: IdentifyImageQuestionEditor,
    validateQuestions: iiValidate,
    getValidationError: iiError,
    questionDisplay: IdentifyImageQuestionDisplay,
  },
};
