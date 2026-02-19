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

import BlindTop5HostView from './blindTop5/HostView';
import BlindTop5PlayerView from './blindTop5/PlayerView';
import BlindTop5QuestionEditor from './blindTop5/QuestionEditor';
import {
  validateQuestions as bt5Validate,
  getValidationError as bt5Error,
} from './blindTop5/validate';

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
  blind_top5: {
    label: 'Blind Top 5',
    hostView: BlindTop5HostView,
    playerView: BlindTop5PlayerView,
    questionEditor: BlindTop5QuestionEditor,
    validateQuestions: bt5Validate,
    getValidationError: bt5Error,
    questionDisplay: null,
    fixedQuestionCount: 5,
  },
};
