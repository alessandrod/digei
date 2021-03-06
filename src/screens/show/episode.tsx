import React, {FunctionComponent, useContext, useState} from 'react';
import {View, ViewStyle, Pressable} from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {human} from 'react-native-typography';
import AnimatedProgressWheel from 'react-native-progress-wheel';
import {
  documentDirectory,
  makeDirectoryAsync,
  deleteAsync,
  DownloadResult,
} from 'expo-file-system';
import {URL} from 'react-native-url-polyfill';
import Clipboard from '@react-native-community/clipboard';

import {episodeTitle} from 'components';
import {
  Show,
  StateContext,
  Episode,
  PlaybackStateContext,
  PlayState,
} from 'state';
import {PlayMedia, StopPlayer} from 'actions';
import {formatTimeInWords, formatDateInWords, formatDate} from 'utils';
import {EpisodeMeta, DatabaseContext, Database} from 'db';
import {useDownload} from 'download';
import {EpisodeContextMenu} from 'screens/show/episode-context-menu';
import {SmallLoadingBars} from 'components/loading-bars';

const EpisodeView = styled.View`
  flex: 1 0;
  flex-direction: row;
  padding: 10px 15px;
`;

const LeftView = styled.View`
  flex: 1 0;
`;

const TitleView = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Title = styled.Text`
  ${human.title3Object as any}
  line-height: 30px;
  padding-right: 10px;
`;

const DetailsView = styled.View`
  flex: 1 0;
  flex-direction: row;
  align-items: center;
  margin-right: 10px;
`;

const DurationView = styled.Text`
  ${human.subheadObject as any};
  margin-right: 10px;
`;

const PlayedIcon = styled(Icon)`
  color: gray;
  font-size: 18px;
`;

const PlayedText = styled.Text`
  ${human.subheadObject as any};
  color: gray;
  margin-right: 10px;
`;

const Played: FunctionComponent<{date: string}> = ({date}) => {
  return (
    <>
      <PlayedIcon name="md-checkmark" />
      <PlayedText> Ascoltato {date}</PlayedText>
    </>
  );
};

const ProgressOuter = styled.View`
  flex: 1 0;
  background: lightgray;
  max-width: 100px;
  height: 5px;
  border-radius: 4px;
  margin-right: 10px;
`;

const ProgressInner = styled.View<{playing: boolean}>`
  background: ${(props) => (props.playing ? 'rgb(245, 26, 0)' : 'gray')};
  height: 5px;
  border-radius: 4px;
`;

const Progress: FunctionComponent<{playing: boolean; value: number}> = ({
  playing,
  value,
}) => {
  return (
    <ProgressOuter>
      <ProgressInner playing={playing} style={{width: value * 100 + '%'}} />
    </ProgressOuter>
  );
};

const DownloadIcon = styled(Icon)`
  color: gray;
  font-size: 30px;
  width: 28px;
  text-align: center;
  align-self: center;
`;

const StopRect = styled(View)`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgb(245, 26, 0);
  width: 12px;
  height: 12px;
  border-radius: 2px;
`;

let DownloadProgress: FunctionComponent<{
  value: number;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({value, style, onPress}) => {
  return (
    <Pressable style={style} onPress={onPress}>
      <AnimatedProgressWheel
        backgroundColor="lightgray"
        color="gray"
        fullColor="rgb(245, 26, 0)"
        size={32}
        width={3}
        progress={value}
      />
      <StopRect />
    </Pressable>
  );
};

DownloadProgress = styled(DownloadProgress)`
  align-self: center;
  transform: rotate(-90deg);
`;

export const EpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeMeta: EpisodeMeta;
}> = ({show, episode, episodeMeta}) => {
  const {
    state: {
      player: {episode: playingEpisode},
    },
  } = useContext(StateContext);
  if (episode.url === playingEpisode?.url) {
    return (
      <PlayingEpisodeComponent
        show={show}
        episode={episode}
        episodeMeta={episodeMeta}
      />
    );
  }
  return (
    <StoppedEpisodeComponent
      show={show}
      episode={episode}
      episodeMeta={episodeMeta}
    />
  );
};

const StoppedEpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeMeta: EpisodeMeta;
}> = ({show, episode, episodeMeta}) => {
  return (
    <EpisodeComponentImpl
      show={show}
      episode={episode}
      episodeMeta={episodeMeta}
    />
  );
};

const PlayingEpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeMeta: EpisodeMeta;
}> = ({show, episode, episodeMeta}) => {
  const {loading} = useContext(StateContext).state.player;
  let {position, duration, episode: playingEpisode} = useContext(
    PlaybackStateContext,
  );

  const playContextReady = playingEpisode?.url === episode?.url;
  if (playContextReady) {
    if (position !== undefined) {
      position = position / 1000;
    } else if (!loading) {
      // we were playing and now the position is undefined. This means the track ended.
      position = 0;
      // we let the player do the actual db update. We set this so the current
      // render cycle renders the episode as played.
      episodeMeta.playDate = formatDate(Date.now());
    } else {
      position = episodeMeta.playPosition;
    }
  } else {
    position = episodeMeta.playPosition;
    duration = undefined;
  }

  return (
    <EpisodeComponentImpl
      show={show}
      episode={episode}
      episodeMeta={episodeMeta}
      playPosition={position}
      duration={duration && duration / 1000}
    />
  );
};

const Details: FunctionComponent<{
  isPlaying: boolean;
  duration?: number;
  playPosition?: number;
  playDate?: string;
}> = ({isPlaying, playPosition, duration, playDate}) => {
  const details = [];

  if (
    playDate &&
    (!isPlaying || playPosition === 0 || playPosition >= duration - 1)
  ) {
    details.push(<Played date={formatDateInWords(playDate)} />);
  } else if (duration) {
    let durText;
    if (playPosition !== undefined && playPosition > 0) {
      details.push(
        <Progress playing={isPlaying} value={playPosition / duration} />,
      );
      durText = formatTimeInWords(duration - playPosition) + ' rimanenti';
    } else {
      durText = formatTimeInWords(duration);
    }
    details.push(<DurationView>{durText}</DurationView>);
  }

  return <DetailsView>{details}</DetailsView>;
};

export const setPlayDate = (
  db: Database,
  meta: EpisodeMeta,
  date?: string,
  resetPlayPosition = false,
) => {
  const {url, showUrl} = meta;
  console.log('setting play date', url, date, resetPlayPosition);
  meta.playDate = date;
  db.updateEpisodePlayDate(url, showUrl, meta.playDate);
  if (resetPlayPosition) {
    meta.playPosition = 0;
    db.updateEpisodePlayPosition(url, showUrl, 0);
  }
};

const EpisodeComponentImpl: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeMeta: EpisodeMeta;
  playPosition?: number;
  duration?: number;
  style?: ViewStyle;
}> = ({show, episode, episodeMeta, playPosition, duration, style}) => {
  const {db} = useContext(DatabaseContext);
  const {
    dispatch,
    state: {
      player: {state: playState},
    },
  } = useContext(StateContext);
  const {media} = episode;
  if (duration === undefined) {
    duration = episode.duration;
  }

  const [, doRerender] = useState(0);
  const rerender = () => doRerender((i) => i + 1);

  const downloadMediaUrl = media[0].url;
  const downloadUrl = downloadUrlForEpisode(
    episode.url,
    show.url,
    downloadMediaUrl,
  );

  const {download, startDownload, stopDownload} = useDownload(
    downloadMediaUrl,
    downloadUrl.url,
    (res?: DownloadResult) => {
      if (res) {
        episodeMeta.localFile = downloadUrl.url;
        db.updateEpisodeLocalFile(episode.url, show.url, downloadUrl.url);
      } else {
        episodeMeta.localFile = undefined;
      }
      rerender();
    },
  );

  const playing = playPosition !== undefined;
  if (playPosition === undefined && episodeMeta.playPosition > 10) {
    playPosition = episodeMeta.playPosition;
  }

  return (
    <EpisodeContextMenu
      played={!!episodeMeta.playDate}
      downloading={download !== undefined}
      downloaded={!!(download === undefined && episodeMeta.localFile)}
      onMarkAsPlayed={(played) => {
        setPlayDate(
          db,
          episodeMeta,
          played ? formatDate(Date.now()) : undefined,
          true,
        );
        if (playing) {
          dispatch(new StopPlayer(true));
        } else {
          rerender();
        }
      }}
      onDownload={() => {
        makeDirectoryAsync(downloadUrl.directory, {
          intermediates: true,
        }).then(() => {
          startDownload && startDownload();
        });
      }}
      onRemoveDownload={() => {
        episodeMeta.localFile = undefined;
        db.updateEpisodeLocalFile(episode.url, show.url, undefined);
        deleteAsync(downloadUrl.url);
        rerender();
      }}
      onCopyLink={() => {
        Clipboard.setString(episode.url);
      }}>
      <Pressable
        onLongPress={() => {}} // workaround for ContextMenu not being integrated with the responder system
        onPress={() => {
          if (download !== undefined) {
            return;
          }
          if (episodeMeta.playDate) {
            setPlayDate(db, episodeMeta, undefined, true);
          }
          let m;
          if (episodeMeta.localFile) {
            m = {url: episodeMeta.localFile};
          } else {
            m = media[0];
          }
          dispatch(
            new PlayMedia(
              m,
              episodeMeta.playPosition,
              show,
              episode,
              episodeMeta,
            ),
          );
        }}>
        <EpisodeView style={style}>
          <LeftView>
            <TitleView>
              <Title>{episodeTitle(episode)}</Title>
              {playing && (
                <SmallLoadingBars playing={playState === PlayState.PLAYING} />
              )}
            </TitleView>
            <Details
              isPlaying={playing}
              playPosition={playPosition}
              duration={duration}
              playDate={episodeMeta.playDate}
            />
          </LeftView>
          {download !== undefined && (
            <DownloadProgress
              key="dl"
              value={download.progress * 100}
              onPress={() => {
                stopDownload && stopDownload();
              }}
            />
          )}
          {episodeMeta.localFile && download === undefined && (
            <DownloadIcon name="download-outline" />
          )}
        </EpisodeView>
      </Pressable>
    </EpisodeContextMenu>
  );
};

const downloadUrlForEpisode = (
  _url: string,
  showUrl: string,
  mediaUrl: string,
) => {
  let parts = new URL(showUrl).pathname
    .split('/')
    .filter((p: string) => p.length > 0);
  const showName = parts.pop();

  parts = new URL(mediaUrl).pathname.split('/');
  const mediaBaseName = parts.pop();

  const directory = `${documentDirectory}/media/${showName}`;

  return {directory, url: `${directory}/${mediaBaseName}`};
};
