import {createContext, Dispatch} from 'react';
import {ImageSourcePropType} from 'react-native';

import {
  Action,
  TogglePlayPause,
  ToggleLive,
  PlayMedia,
  UpdatePlayerStatus,
  UpdateLiveShow,
  SetShows,
  UpdatePlaybackInfo,
  PlaybackAction,
  SetPlayState,
  StopPlayer,
  Seek,
  SeekDone,
} from 'actions';
import {Player} from 'player';
import {EpisodeMeta} from 'db';

export const LIVE_URL =
  'https://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/index_96_a-p.m3u8';

export enum PlayState {
  STOPPED,
  PAUSED,
  PLAYING,
}

export type PlayerState = {
  visible: boolean;
  state: PlayState;
  media?: Media;
  show?: Show;
  episode?: Episode;
  position?: number;
  duration?: number;
  loading: boolean;
};

export type Media = {
  url: string;
};

export type Episode = {
  url: string;
  title: string;
  date?: string;
  duration?: number;
  media: Media[];
};

export type Show = {
  url: string;
  name: string;
  cover: ImageSourcePropType;
  hosts: String;
  description: string[];
  sortNum: number;
  episodes: Episode[];
};

export type State = {
  shows: Show[];
  liveShow?: Show;
  player: PlayerState;
  playbackDispatch: Dispatch<PlaybackAction>;
};

export const INITIAL_STATE: State = {
  shows: [],
  liveShow: undefined,
  player: {
    visible: false,
    state: PlayState.STOPPED,
    loading: false,
  },
  playbackDispatch: () => {},
};

export const StateContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
}>({
  state: INITIAL_STATE,
  dispatch: () => {},
});

const togglePlayPause = (state: State): State => {
  const {playbackDispatch, player} = state;
  let {state: playState, media} = player;

  if (playState !== PlayState.PLAYING) {
    playState = PlayState.PLAYING;
  } else if (media?.url === LIVE_URL) {
    playState = PlayState.STOPPED;
  } else {
    playState = PlayState.PAUSED;
  }

  if (media !== undefined) {
    playbackDispatch(new SetPlayState(media.url, playState));
  }

  return {
    ...state,
    player: {...player, state: playState},
  };
};

const toggleLive = (state: State): State => {
  const {player, liveShow} = state;

  if (liveShow === undefined) {
    return state;
  }

  if (player.media?.url === LIVE_URL) {
    return togglePlayPause(state);
  }

  return playMedia(state, new PlayMedia({url: LIVE_URL}, undefined, liveShow));
};

const playMedia = (state: State, action: PlayMedia): State => {
  const {player, playbackDispatch} = state;
  const {media, show, episode} = action;

  playbackDispatch(action);

  return {
    ...state,
    player: {
      ...player,
      visible: true,
      show,
      episode,
      media,
      state: PlayState.PLAYING,
      loading: true,
    },
  };
};

const updatePlayerStatus = (
  state: State,
  action: UpdatePlayerStatus,
): State => {
  const {player, playbackDispatch} = state;
  const {show, episode, media} = player;
  let {loading, position, duration: duration} = action;

  if (media?.url === LIVE_URL) {
    duration = undefined;
  }

  playbackDispatch(new UpdatePlaybackInfo(position, duration, show, episode));

  if (duration === player.duration && loading === player.loading) {
    return state;
  }

  return {
    ...state,
    player: {...player, duration, loading},
  };
};

const seek = (state: State, action: Seek): State => {
  const {playbackDispatch} = state;

  playbackDispatch(action);
  return state;
};

const seekDone = (state: State, action: SeekDone): State => {
  const {playbackDispatch} = state;

  playbackDispatch(action);
  return state;
};

const stopPlayer = (state: State, action: StopPlayer): State => {
  const {player, playbackDispatch} = state;
  const {hide} = action;
  let {show, episode, media} = player;
  let position;

  playbackDispatch(action);

  if (hide) {
    show = undefined;
    episode = undefined;
    media = undefined;
    position = undefined;
  } else {
    position = 0;
  }

  return {
    ...state,
    player: {
      ...player,
      state: PlayState.STOPPED,
      show,
      episode,
      media,
      position,
      visible: !hide,
    },
  };
};

const updateLiveShow = (state: State, name: String): State => {
  const {media} = state.player;

  name = name.toLowerCase();
  if (state.liveShow !== undefined) {
    if (state.liveShow.name.toLowerCase() === name) {
      return state;
    }
  }

  for (let show of state.shows) {
    if (show.name.toLowerCase() === name) {
      if (media?.url === LIVE_URL) {
        state = {...state, player: {...state.player, show}};
      }
      return {...state, liveShow: show};
    }
  }

  console.error('unknown live show', name);
  return state;
};

const setShows = (state: State, shows: Show[]): State => {
  return {...state, shows};
};

export function stateReducer(state: State, action: Action) {
  if (action instanceof TogglePlayPause) {
    state = togglePlayPause(state);
  } else if (action instanceof ToggleLive) {
    state = toggleLive(state);
  } else if (action instanceof PlayMedia) {
    state = playMedia(state, action);
  } else if (action instanceof UpdatePlayerStatus) {
    state = updatePlayerStatus(state, action);
  } else if (action instanceof Seek) {
    state = seek(state, action);
  } else if (action instanceof SeekDone) {
    state = seekDone(state, action);
  } else if (action instanceof StopPlayer) {
    state = stopPlayer(state, action);
  } else if (action instanceof UpdateLiveShow) {
    state = updateLiveShow(state, action.name);
  } else if (action instanceof SetShows) {
    state = setShows(state, action.shows);
  }

  return state;
}

export type PlaybackState = {
  replay: boolean;
  player: Player;
  seekCookie: number;
  show?: Show;
  episode?: Episode;
  episodeMeta?: EpisodeMeta;
  position?: number;
  duration?: number;
};

export const INITIAL_PLAYBACK_STATE = {
  replay: false,
  player: new Player(),
  seekCookie: 0,
};

export const PlaybackStateContext = createContext<PlaybackState>(
  INITIAL_PLAYBACK_STATE,
);

const playbackPlayMedia = (
  state: PlaybackState,
  action: PlayMedia,
): PlaybackState => {
  let {player, replay} = state;
  const {media, show, episode, episodeMeta, position} = action;

  player?.playUrl(media.url, position && position * 1000, replay);

  return {
    ...state,
    show,
    episode,
    episodeMeta,
    position: position && position * 1000,
    duration: undefined,
    replay: false,
  };
};

const updatePlaybackInfo = (
  state: PlaybackState,
  action: UpdatePlaybackInfo,
): PlaybackState => {
  const {position, duration} = action;

  if (position === state.position && duration === state.duration) {
    return state;
  }

  return {...state, position, duration};
};

const setPlayState = (
  state: PlaybackState,
  action: SetPlayState,
): PlaybackState => {
  const {player, replay} = state;
  const {url, state: playState} = action;
  if (playState === PlayState.PLAYING) {
    player?.playUrl(url, undefined, replay);
  } else if (url === LIVE_URL) {
    player?.stop();
  } else {
    player?.pause();
  }

  return {...state, replay: false};
};

const playbackStopPlayer = (
  state: PlaybackState,
  action: StopPlayer,
): PlaybackState => {
  const {hide} = action;
  let {player, show, episode, episodeMeta} = state;

  player.stop();
  if (hide) {
    show = undefined;
    episode = undefined;
    episodeMeta = undefined;
  }
  return {
    ...state,
    show,
    episode,
    episodeMeta,
    position: undefined,
    replay: !hide,
  };
};

const playbackSeek = (state: PlaybackState, action: Seek): PlaybackState => {
  const {player, position} = state;
  const {position: seekPosition, relative} = action;

  let target = seekPosition * 1000;
  if (relative) {
    if (position === undefined) {
      return state;
    }
    target += position;
  }
  player.seek(target);
  return state;
};

const playbackSeekDone = (
  state: PlaybackState,
  _action: SeekDone,
): PlaybackState => {
  return {...state, seekCookie: state.seekCookie + 1};
};

export function playbackStateReducer(
  state: PlaybackState,
  action: PlaybackAction,
) {
  if (action instanceof PlayMedia) {
    state = playbackPlayMedia(state, action);
  } else if (action instanceof SetPlayState) {
    state = setPlayState(state, action);
  } else if (action instanceof UpdatePlaybackInfo) {
    state = updatePlaybackInfo(state, action);
  } else if (action instanceof StopPlayer) {
    state = playbackStopPlayer(state, action);
  } else if (action instanceof Seek) {
    state = playbackSeek(state, action);
  } else if (action instanceof SeekDone) {
    state = playbackSeekDone(state, action);
  }

  return state;
}
