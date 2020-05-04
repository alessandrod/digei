import React, {FunctionComponent, useContext, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {human} from 'react-native-typography';
import {ContextMenu, ContextMenuAction} from 'components/context-menu';

import {BaseView, episodeTitle} from 'components';
import {Colors} from 'theme';
import {Show, StateContext, Episode, PlaybackStateContext} from 'state';
import {PlayMedia} from 'actions';
import {formatTimeInWords, formatDateInWords} from 'utils';
import {EpisodeInfo, DatabaseContext, Database} from 'db';

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

/*
const DownloadIcon = styled(Icon).attrs(() => ({colors: Colors}))`
  color: ${(p) => p.colors.gray};
  font-size: 30px;
  align-self: center;
`;
*/

export const EpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeInfo: EpisodeInfo;
}> = ({show, episode, episodeInfo}) => {
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
        episodeInfo={episodeInfo}
      />
    );
  }
  return (
    <StoppedEpisodeComponent
      show={show}
      episode={episode}
      episodeInfo={episodeInfo}
    />
  );
};

const StoppedEpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeInfo: EpisodeInfo;
}> = ({show, episode, episodeInfo}) => {
  return (
    <EpisodeComponentImpl
      show={show}
      episode={episode}
      episodeInfo={episodeInfo}
    />
  );
};

const PlayingEpisodeComponent: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeInfo: EpisodeInfo;
}> = ({show, episode, episodeInfo}) => {
  let {position} = useContext(PlaybackStateContext);

  if (position !== undefined) {
    position = position / 1000;
    episodeInfo.playPosition = position;
  } else {
    position = episodeInfo.playPosition;
  }

  return (
    <EpisodeComponentImpl
      show={show}
      episode={episode}
      episodeInfo={episodeInfo}
      playPosition={position}
    />
  );
};

enum MenuActionType {
  MARK_AS_PLAYED,
  MARK_AS_UNPLAYED,
  DOWNLOAD,
  COPY_LINK,
}

interface MenuAction extends ContextMenuAction {
  type: MenuActionType;
}

const setPlayDate = (db: Database, info: EpisodeInfo, date?: string) => {
  const {url, showUrl} = info;
  info.playDate = date;
  info.playPosition = 0;
  db.updateEpisodePlayDate(url, showUrl, info.playDate);
  db.updateEpisodePlayPosition(url, showUrl, info.playPosition);
};

const EpisodeComponentImpl: FunctionComponent<{
  show: Show;
  episode: Episode;
  episodeInfo: EpisodeInfo;
  playPosition?: number;
}> = ({show, episode, episodeInfo, playPosition}) => {
  const db = useContext(DatabaseContext);
  const {dispatch} = useContext(StateContext);
  const {media, duration} = episode;

  const [, rerender] = useState(0);

  const titleText = episodeTitle(episode);

  if (playPosition === undefined && episodeInfo.playPosition > 10) {
    playPosition = episodeInfo.playPosition;
  }

  let details = [<DetailsButton>Dettagli</DetailsButton>];
  details = [];
  if (episodeInfo.playDate) {
    details.push(<Played date={formatDateInWords(episodeInfo.playDate)} />);
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
  if (episodeInfo.playDate) {
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
  actions.push({
    type: MenuActionType.DOWNLOAD,
    title: 'Scarica',
    systemIcon: 'square.and.arrow.down',
  });
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
            setPlayDate(db, episodeInfo, '1/1/2021');
            rerender((i) => i + 1);
          } else if (action.type === MenuActionType.MARK_AS_UNPLAYED) {
            setPlayDate(db, episodeInfo, undefined);
            rerender((i) => i + 1);
          }
        }
      }}>
      <TouchableOpacity
        onPress={() => {
          if (db) {
            setPlayDate(db, episodeInfo, undefined);
          }
          dispatch(new PlayMedia(media[0], playPosition, show, episode));
        }}>
        <EpisodeView>
          <LeftView>
            <Title>{titleText}</Title>
            <Details>{details}</Details>
          </LeftView>
        </EpisodeView>
      </TouchableOpacity>
    </ContextMenu>
  );
};
