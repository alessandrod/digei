import React, {FunctionComponent, useContext, useState} from 'react';
import {TouchableOpacity, View, ViewStyle} from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {human} from 'react-native-typography';
import AnimatedProgressWheel from 'react-native-progress-wheel';
import {
  documentDirectory,
  createDownloadResumable,
  DownloadResumable,
  makeDirectoryAsync,
  deleteAsync,
} from 'expo-file-system';
import {URL} from 'react-native-url-polyfill';

import {BaseView, episodeTitle} from 'components';
import {ContextMenu, ContextMenuAction} from 'components/context-menu';
import {Colors} from 'theme';
import {Show, StateContext, Episode, PlaybackStateContext} from 'state';
import {PlayMedia} from 'actions';
import {formatTimeInWords, formatDateInWords} from 'utils';
import {EpisodeMeta, DatabaseContext, Database} from 'db';

const EpisodeView = styled(BaseView)`
  flex: 1 0;
  flex-direction: row;
  padding-top: 10px;
  padding-bottom: 10px;
`;

const LeftView = styled.View`
  flex: 1 0;
`;

const Title = styled.Text`
  font-size: 20px;
  line-height: 30px;
`;

const Details = styled.View`
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
  let {position} = useContext(PlaybackStateContext);

  if (position !== undefined) {
    position = position / 1000;
    episodeMeta.playPosition = position;
  } else {
    position = episodeMeta.playPosition;
  }

  return (
    <EpisodeComponentImpl
      show={show}
      episode={episode}
      episodeMeta={episodeMeta}
      playPosition={position}
    />
  );
};

enum MenuActionType {
  MARK_AS_PLAYED,
  MARK_AS_UNPLAYED,
  DOWNLOAD,
  REMOVE_DOWNLOAD,
  COPY_LINK,
}

interface MenuAction extends ContextMenuAction {
  type: MenuActionType;
}

const setPlayDate = (db: Database, meta: EpisodeMeta, date?: string) => {
  const {url, showUrl} = meta;
  meta.playDate = date;
  meta.playPosition = 0;
  db.updateEpisodePlayDate(url, showUrl, meta.playDate);
  db.updateEpisodePlayPosition(url, showUrl, meta.playPosition);
};

const EpisodeComponentImpl: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeMeta: EpisodeMeta;
  playPosition?: number;
}> = ({show, episode, episodeMeta, playPosition}) => {
  const db = useContext(DatabaseContext);
  const {dispatch} = useContext(StateContext);
  const {media, duration} = episode;

  const [, rerender] = useState(0);
  const [
    {progress: downloadProgress, handle: downloadHandle},
    setDownload,
  ] = useState<{
    progress?: number;
    handle?: DownloadResumable;
  }>({
    progress: undefined,
    handle: undefined,
  });
  const downloadMediaUrl = media[0].url;
  const downloadUrl = downloadUrlForEpisode(
    episode.url,
    show.url,
    downloadMediaUrl,
  );

  const titleText = episodeTitle(episode);

  if (playPosition === undefined && episodeMeta.playPosition > 10) {
    playPosition = episodeMeta.playPosition;
  }

  let details = [<DetailsButton>Dettagli</DetailsButton>];
  details = [];
  if (episodeMeta.playDate) {
    details.push(<Played date={formatDateInWords(episodeMeta.playDate)} />);
  } else if (duration) {
    let durText;
    if (playPosition !== undefined) {
      details.push(<Progress value={playPosition / duration} />);
      durText = formatTimeInWords(duration - playPosition) + ' rimanenti';
    } else {
      durText = formatTimeInWords(duration);
    }
    details.push(<DurationView>{durText}</DurationView>);
  }

  const actions: MenuAction[] = [];
  if (episodeMeta.playDate) {
    actions.push({
      type: MenuActionType.MARK_AS_UNPLAYED,
      title: 'Segna da ascoltare',
      systemIcon: 'checkmark.square',
    });
  } else {
    actions.push({
      type: MenuActionType.MARK_AS_PLAYED,
      title: 'Segna come ascoltato',
      systemIcon: 'checkmark.square',
    });
  }
  if (downloadProgress === undefined && !episodeMeta.localFile) {
    actions.push({
      type: MenuActionType.DOWNLOAD,
      title: 'Download',
      systemIcon: 'square.and.arrow.down',
    });
  } else if (downloadProgress === undefined) {
    actions.push({
      type: MenuActionType.REMOVE_DOWNLOAD,
      title: 'Rimuovi download',
      systemIcon: 'square.and.arrow.down',
    });
  }
  actions.push({
    type: MenuActionType.COPY_LINK,
    title: 'Copia il link',
    systemIcon: 'link',
  });

  return (
    <ContextMenu
      actions={actions}
      onPress={(e) => {
        const {index} = e.nativeEvent;
        const action = actions[index];
        if (db) {
          if (action.type === MenuActionType.MARK_AS_PLAYED) {
            setPlayDate(db, episodeMeta, '1/1/2021');
            rerender((i) => i + 1);
          } else if (action.type === MenuActionType.MARK_AS_UNPLAYED) {
            setPlayDate(db, episodeMeta, undefined);
            rerender((i) => i + 1);
          } else if (action.type === MenuActionType.DOWNLOAD) {
            setDownload((d) => ({...d, progress: 0}));
            makeDirectoryAsync(downloadUrl.directory, {
              intermediates: true,
            }).then(() => {
              const handle = createDownloadResumable(
                downloadMediaUrl,
                downloadUrl.url,
                {},
                (download) => {
                  const progress =
                    download.totalBytesWritten /
                    download.totalBytesExpectedToWrite;
                  setDownload((d) => ({...d, progress: progress * 100}));
                },
              );
              setDownload((d) => ({...d, handle}));
              handle.downloadAsync().then((res) => {
                if (res) {
                  episodeMeta.localFile = downloadUrl.url;
                  setDownload({progress: undefined, handle: undefined});
                }
              });
            });
          } else if (action.type === MenuActionType.REMOVE_DOWNLOAD) {
            episodeMeta.localFile = undefined;
            deleteAsync(downloadUrl.url);
            setDownload({progress: undefined, handle: undefined});
          }
        }
      }}>
      <TouchableOpacity
        onPress={() => {
          if (downloadProgress !== undefined) {
            return;
          }
          if (db) {
            setPlayDate(db, episodeMeta, undefined);
          }
          let m;
          if (episodeMeta.localFile) {
            m = {url: episodeMeta.localFile};
          } else {
            m = media[0];
          }
          dispatch(new PlayMedia(m, playPosition, show, episode));
        }}>
        <EpisodeView>
          <LeftView>
            <Title>{titleText}</Title>
            <Details>{details}</Details>
          </LeftView>
          {downloadProgress !== undefined && (
            <DownloadProgress
              value={downloadProgress}
              onPress={() => {
                if (downloadHandle !== undefined) {
                  downloadHandle.pauseAsync().then(() => {
                    episodeMeta.localFile = undefined;
                    deleteAsync(downloadUrl.url);
                    setDownload({progress: undefined, handle: undefined});
                  });
                }
              }}
            />
          )}
          {episodeMeta.localFile && <DownloadIcon name="download-outline" />}
        </EpisodeView>
      </TouchableOpacity>
    </ContextMenu>
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
