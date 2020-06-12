import {Show, Media, Episode, PlayState} from 'state';
import {EpisodeMeta} from 'db';
import {Player} from 'player';

export class PlayerReady {
  constructor(public readonly player: Player) {}
}

export class TogglePlayPause {}

export class ToggleLive {}

export class PlayMedia {
  constructor(
    public readonly media: Media,
    public readonly position?: number,
    public readonly show?: Show,
    public readonly episode?: Episode,
    public readonly episodeMeta?: EpisodeMeta,
  ) {}
}

export class UpdatePlayerStatus {
  constructor(
    public readonly loading: boolean,
    public readonly position: number,
    public readonly duration?: number,
  ) {}
}

export class PlayerFinished {
  constructor() {}
}

export class UpdateLiveShow {
  constructor(public readonly name: String) {}
}

export class SetShows {
  constructor(public readonly shows: Show[]) {}
}

export type Action =
  | PlayerReady
  | PlayMedia
  | TogglePlayPause
  | ToggleLive
  | UpdatePlayerStatus
  | PlayerFinished
  | UpdateLiveShow
  | SetShows;

export class SetPlayState {
  constructor(public readonly url: string, public readonly state: PlayState) {}
}

export class UpdatePlaybackInfo {
  constructor(
    public readonly position: number,
    public readonly duration?: number,
    public readonly show?: Show,
    public readonly episode?: Episode,
  ) {}
}

export type PlaybackAction =
  | PlayerReady
  | SetPlayState
  | UpdatePlaybackInfo
  | PlayerFinished
  | PlayMedia;
