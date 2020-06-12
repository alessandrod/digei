import {Audio} from 'expo-av';
import {INTERRUPTION_MODE_IOS_DO_NOT_MIX} from 'expo-av/build/Audio';
import {Dispatch} from 'react';

import {Action, UpdatePlayerStatus, PlayerReady} from 'actions';

export class Player {
  private player?: Audio.Sound;
  private cookie: number;
  private isLoading: boolean;
  private url?: string;
  private operations: Array<() => Promise<any> | undefined>;
  private currentOperation?: Promise<any>;
  private disableUpdates: boolean;

  constructor(private dispatch: Dispatch<Action>) {
    this.cookie = 0;
    this.isLoading = false;
    this.operations = [];
    this.disableUpdates = false;
  }

  init(): Promise<unknown> {
    return Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    }).then(() => {
      this.player = new Audio.Sound();

      this.player.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          if (status.error) {
            console.error('error playing media', status.error);
          }
        } else if (!this.disableUpdates) {
          const {positionMillis, durationMillis} = status;
          const loading = status.shouldPlay && status.isBuffering;
          this.dispatch(
            new UpdatePlayerStatus(loading, positionMillis, durationMillis),
          );
        }
      });

      this.dispatch(new PlayerReady(this));
    });
  }

  maybeCancel<T>(): (res: T) => T {
    const that = this;
    const cookie = this.cookie;
    return (res: T) => {
      if (cookie !== that.cookie) {
        throw Error('player operation cancelled: ' + cookie);
      }

      return res;
    };
  }

  queueOperation<T>(op: () => Promise<T> | undefined) {
    this.cookie += 1;
    this.operations.push(op);
    this.maybeStartOperations();
  }

  maybeStartOperations() {
    if (this.currentOperation) {
      return;
    }

    const op = this.operations.shift();
    if (op === undefined) {
      return;
    }
    const ret = op();
    if (ret !== undefined) {
      this.currentOperation = ret
        .catch((e) => {
          console.warn('operation failed:', e);
          return e;
        })
        .finally(() => {
          this.currentOperation = undefined;
          this.maybeStartOperations();
        });
    }
  }

  playUrl(url: string, position?: number, replay?: boolean) {
    this.queueOperation(() => {
      this.disableUpdates = true;
      return this.player
        ?.getStatusAsync()
        .then(this.maybeCancel())
        .then((status) => {
          if ((this.isLoading || status.isLoaded) && this.url !== url) {
            console.log('unloading player', this.url);
            this.isLoading = false;
            replay = false;
            return this.player?.unloadAsync().then((res) => {
              console.log('unloaded', this.url);
              return res;
            });
          }
          return status;
        })
        .then(this.maybeCancel())
        .then((status) => {
          if (!status?.isLoaded && !this.isLoading) {
            this.isLoading = true;
            this.url = url;
            console.log('loading player', url);
            return this.player
              ?.loadAsync({uri: url}, {shouldPlay: false})
              .then((res) => {
                console.log('loaded player', url);
                return res;
              });
          }
          return status;
        })
        .then((res) => {
          this.isLoading = false;
          return res;
        })
        .then(this.maybeCancel())
        .then(() => {
          console.log('playing');
          if (position !== undefined) {
            return this.player?.playFromPositionAsync(position);
          } else if (replay) {
            return this.player?.replayAsync();
          } else {
            return this.player?.playAsync();
          }
        })
        .then(this.maybeCancel())
        .then((res) => {
          console.log('player playing');
          this.disableUpdates = false;
          return res;
        });
    });
  }

  pause() {
    this.queueOperation(() => {
      console.log('pausing');
      return this.player
        ?.pauseAsync()
        .then(this.maybeCancel())
        .then(() => {
          console.log('player paused');
        });
    });
  }

  stop() {
    this.queueOperation(() => {
      console.log('stopping');
      return this.player
        ?.stopAsync()
        .then(this.maybeCancel())
        .then(() => {
          console.log('player stopped');
        });
    });
  }

  seek(position: number) {
    this.player?.setPositionAsync(position);
  }
}
