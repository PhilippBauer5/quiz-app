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
