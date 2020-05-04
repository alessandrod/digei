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
  PlayerReady,
  SetPlayState,
} from 'actions';
import {Player} from 'player';

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
  episodes: Episode[];
};

export type State = {
  shows: Show[];
  live_show?: Show;
  player: PlayerState;
  playbackDispatch: Dispatch<PlaybackAction>;
};

export const INITIAL_STATE: State = {
  shows: [],
  live_show: undefined,
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
  const {player, live_show} = state;

  if (live_show === undefined) {
    return state;
  }

  if (player.media?.url === LIVE_URL) {
    return togglePlayPause(state);
  }

  return playMedia(state, new PlayMedia({url: LIVE_URL}, undefined, live_show));
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
  const {show, episode} = player;
  const {loading, position, duration} = action;

  playbackDispatch(new UpdatePlaybackInfo(position, duration, show, episode));

  if (duration === player.duration && loading === player.loading) {
    return state;
  }

  return {
    ...state,
    player: {...player, duration, loading},
  };
};

const updateLiveShow = (state: State, name: String): State => {
  name = name.toLowerCase();
  if (state.live_show !== undefined) {
    if (state.live_show.name.toLowerCase() === name) {
      return state;
    }
  }

  for (let show of state.shows) {
    if (show.name.toLowerCase() === name) {
      return {...state, live_show: show};
    }
  }

  console.error('unknown live show', name);
  return state;
};

const setShows = (state: State, shows: Show[]): State => {
  return {...state, shows};
};

const playerReady = (state: State, action: PlayerReady): State => {
  state.playbackDispatch(action);
  return state;
};

export function stateReducer(state: State, action: Action) {
  if (action instanceof PlayerReady) {
    state = playerReady(state, action);
  } else if (action instanceof TogglePlayPause) {
    state = togglePlayPause(state);
  } else if (action instanceof ToggleLive) {
    state = toggleLive(state);
  } else if (action instanceof PlayMedia) {
    state = playMedia(state, action);
  } else if (action instanceof UpdatePlayerStatus) {
    state = updatePlayerStatus(state, action);
  } else if (action instanceof UpdateLiveShow) {
    state = updateLiveShow(state, action.name);
  } else if (action instanceof SetShows) {
    state = setShows(state, action.shows);
  }

  return state;
}

export type PlaybackState = {
  player?: Player;
  show?: Show;
  episode?: Episode;
  position?: number;
};

export const INITIAL_PLAYBACK_STATE = {};

export const PlaybackStateContext = createContext<PlaybackState>(
  INITIAL_PLAYBACK_STATE,
);

const setPlayer = (state: PlaybackState, action: PlayerReady) => {
  return {...state, player: action.player};
};

const updatePlaybackPlayMedia = (
  state: PlaybackState,
  action: PlayMedia,
): PlaybackState => {
  let {player} = state;
  const {media, show, episode, position} = action;

  player?.playUrl(media.url, position && position * 1000);

  return {...state, show, episode, position: position && position * 1000};
};

const updatePlaybackInfo = (
  state: PlaybackState,
  action: UpdatePlaybackInfo,
): PlaybackState => {
  const {position} = action;

  if (position === state.position) {
    return state;
  }

  return {...state, position};
};

const setPlayState = (
  state: PlaybackState,
  action: SetPlayState,
): PlaybackState => {
  const {player} = state;
  const {url, state: playState} = action;
  if (playState === PlayState.PLAYING) {
    player?.playUrl(url);
  } else if (url === LIVE_URL) {
    player?.stop();
  } else {
    player?.pause();
  }

  return state;
};

export function playbackStateReducer(
  state: PlaybackState,
  action: PlaybackAction,
) {
  if (action instanceof PlayerReady) {
    state = setPlayer(state, action);
  } else if (action instanceof PlayMedia) {
    state = updatePlaybackPlayMedia(state, action);
  } else if (action instanceof SetPlayState) {
    state = setPlayState(state, action);
  } else if (action instanceof UpdatePlaybackInfo) {
    state = updatePlaybackInfo(state, action);
  }

  return state;
}
