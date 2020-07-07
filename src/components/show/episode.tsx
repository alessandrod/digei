import React, {FunctionComponent, useContext, useState} from 'react';
import {
  View,
  ViewStyle,
  TouchableOpacity,
  TouchableNativeFeedback,
  Text,
} from 'react-native';
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
import {Colors} from 'theme';
import {Show, StateContext, Episode, PlaybackStateContext} from 'state';
import {PlayMedia, StopPlayer} from 'actions';
import {formatTimeInWords, formatDateInWords, formatDate} from 'utils';
import {EpisodeMeta, DatabaseContext, Database} from 'db';
import {useDownload} from 'download';
import {EpisodeContextMenu} from 'components/show/episode-context-menu';

const EpisodeView = styled.View`
  flex: 1 0;
  flex-direction: row;
  padding: 10px 15px;
`;

const LeftView = styled.View`
  flex: 1 0;
`;

const Title = styled.Text`
  font-size: 20px;
  line-height: 30px;
`;

const DetailsView = styled.View`
  flex: 1 0;
  flex-direction: row;
  align-items: center;
  margin-right: 10px;
`;

const DetailsButton = styled.Text`
  font-size: 14px;
  line-height: 20px;
  ${human.footnoteObject as any};
`;

const DurationView = styled.Text`
  ${human.footnoteObject as any};
`;

const PlayedIcon = styled(Icon).attrs(() => ({colors: Colors}))`
  color: ${(p) => p.colors.gray};
  font-size: 18px;
`;

const PlayedText = styled.Text.attrs(() => ({colors: Colors}))`
  ${human.footnoteObject as any};
  color: ${(p) => p.colors.gray};
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

const ProgressInner = styled.View`
  background: gray;
  height: 5px;
  border-radius: 4px;
`;

const Progress: FunctionComponent<{value: number}> = ({value}) => {
  return (
    <ProgressOuter>
      <ProgressInner style={{width: value * 100 + '%'}} />
    </ProgressOuter>
  );
};

const DownloadIcon = styled(Icon)`
  color: gray;
  font-size: 24px;
  width: 28px;
  text-align: center;
  align-self: center;
`;

const StopRect = styled(View)`
  position: absolute;
  top: 9px;
  left: 9px;
  background: rgb(245, 26, 0);
  width: 10px;
  height: 10px;
  border-radius: 2px;
`;

let DownloadProgress: FunctionComponent<{
  value: number;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({value, style, onPress}) => {
  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <AnimatedProgressWheel
        backgroundColor="lightgray"
        color="gray"
        fullColor="rgb(245, 26, 0)"
        size={28}
        width={3}
        progress={value}
      />
      <StopRect />
    </TouchableOpacity>
  );
};

DownloadProgress = styled(DownloadProgress)`
  align-self: center;
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
  let {position, duration} = useContext(PlaybackStateContext);

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
  let details = [<DetailsButton>Dettagli</DetailsButton>];
  details = [];

  if (
    playDate &&
    (!isPlaying || playPosition === 0 || playPosition >= duration - 1)
  ) {
    details.push(<Played date={formatDateInWords(playDate)} />);
  } else if (duration) {
    let durText;
    if (playPosition !== undefined && playPosition > 0) {
      details.push(<Progress value={playPosition / duration} />);
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
  const {dispatch} = useContext(StateContext);
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
      <TouchableOpacity
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
            <Title>{episodeTitle(episode)}</Title>
            <Details
              isPlaying={playing}
              playPosition={playPosition}
              duration={duration}
              playDate={episodeMeta.playDate}
            />
          </LeftView>
          {download !== undefined && (
            <DownloadProgress
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
      </TouchableOpacity>
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
