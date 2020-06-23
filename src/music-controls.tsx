import {
  Dispatch,
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from 'react';
import MusicControl from 'react-native-music-control';
import {Command} from 'react-native-music-control/lib/types';

import {Action, TogglePlayPause, Seek} from 'actions';
import {
  Show,
  Episode,
  StateContext,
  PlayState,
  PlaybackStateContext,
} from 'state';
import {episodeTitle} from 'components';

function init(dispatch: Dispatch<Action>) {
  MusicControl.enableBackgroundMode(true);
  MusicControl.handleAudioInterruptions(true);

  MusicControl.enableControl('play', false);
  MusicControl.enableControl('pause', false);
  MusicControl.enableControl('stop', false);
  MusicControl.enableControl('nextTrack', false);
  MusicControl.enableControl('previousTrack', false);
  MusicControl.enableControl('skipForward', false, {interval: 30});
  MusicControl.enableControl('skipBackward', false, {interval: 15});

  MusicControl.on(Command.play, () => {
    dispatch(new TogglePlayPause());
  });

  MusicControl.on(Command.pause, () => {
    dispatch(new TogglePlayPause());
  });

  MusicControl.on(Command.changePlaybackPosition, (pos) => {
    dispatch(new Seek(pos));
  });
  MusicControl.on(Command.skipForward, () => {
    dispatch(new Seek(30, true));
  });
  MusicControl.on(Command.skipBackward, () => {
    dispatch(new Seek(-15, true));
  });
}

function enableSeeking(enable: boolean) {
  MusicControl.enableControl('skipForward', enable, {interval: 30});
  MusicControl.enableControl('skipBackward', enable, {interval: 15});
}

function nowPlaying(show: Show, episode?: Episode) {
  MusicControl.enableControl('changePlaybackPosition', episode !== undefined);
  MusicControl.setNowPlaying({
    title: show.name,
    artwork: show.cover,
    artist: show.hosts,
    album: episode ? episodeTitle(episode) : 'Ora in onda',
    duration: episode?.duration,
  });
}

function updatePlayState(
  state: PlayState,
  loading: boolean,
  position?: number,
  duration?: number,
) {
  const enable = !loading;
  MusicControl.enableControl('play', enable);
  MusicControl.enableControl('pause', enable);
  let info: any = {
    state:
      state === PlayState.PLAYING && !loading
        ? MusicControl.STATE_PLAYING
        : MusicControl.STATE_PAUSED,
    elapsedTime: position !== undefined ? Math.round(position / 1000) : 0,
  };
  if (duration !== undefined) {
    info.duration = duration / 1000;
  }
  console.log('control position', info.elapsedTime, position);
  MusicControl.updatePlayback(info);
}

export function nowPlayingLive(_show: Show) {}

export const MusicControls: FunctionComponent = () => {
  const {state, dispatch} = useContext(StateContext);
  const {position, seekCookie} = useContext(PlaybackStateContext);
  const {show, episode, state: playState, loading, duration} = state.player;
  const [localState, setLocalState] = useState<{
    loading: boolean;
    seekCookie: number;
    show?: Show;
    episode?: Episode;
    state?: PlayState;
    position?: number;
  }>({
    loading: true,
    seekCookie,
  });

  let force = false;

  useEffect(() => {
    init(dispatch);
    return () => {
      MusicControl.stopControl();
    };
  }, [dispatch]);

  if (localState.show !== show || localState.episode !== episode) {
    force = true;
    setLocalState((s) => ({...s, show, episode}));
    if (show !== undefined) {
      nowPlaying(show, episode);
    }
  }

  if (
    // update when the show or episode change
    force ||
    // update when the playback state changes
    localState.state !== playState ||
    // enable the controls when buffering ends
    (localState.loading === true && !loading) ||
    // update the position after a seek
    localState.seekCookie !== seekCookie ||
    // update the position once playback ends
    (localState.position !== undefined && position === undefined)
  ) {
    setLocalState((s) => ({
      ...s,
      state: playState,
      loading,
      seekCookie,
      position,
      duration,
    }));
    if (episode !== undefined && !loading) {
      enableSeeking(true);
    } else {
      enableSeeking(false);
    }

    updatePlayState(playState, loading, position, duration);
  }

  return null;
};
