import React, {FunctionComponent, useContext, useState} from 'react';
import styled from 'styled-components/native';
import {Animated, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {Colors} from 'theme';
import {PlayPause, SkipButton} from 'components/player/controls';
import {StateContext, PlaybackStateContext} from 'state';
import {TogglePlayPause, UpdatePlayerStatus} from 'actions';
import {formatTimeMillis} from 'utils';
import {episodeTitle} from 'components';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {DatabaseContext} from 'db';
import {setPlayDate} from 'components/show/episode';

const ExpandedPlayerView = styled(Animated.View).attrs(() => ({
  colors: Colors,
}))`
  flex: 1 0;
  padding: 40px 0px;
`;

const Header = styled.View`
  flex: 0 0;
  flex-direction: column;
  min-height: 30px;
  justify-content: flex-start;
`;

const MinimizeIcon = styled(Icon).attrs(() => ({colors: Colors}))`
  color: ghostwhite;
  font-size: 30px;
  height: 30px;
`;

const Title1 = styled.Text.attrs(() => ({
  colors: Colors,
}))`
  ${human.title2Object as any};
  color: ghostwhite;
  font-weight: 600;
  margin-top: -30px;
  align-self: center;
  max-width: 80%;
`;

const CoverContainer = styled.View`
  flex: 3 0;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.15;
  shadow-radius: 2px;
`;

const CoverImage = styled.Image`
  aspect-ratio: 1;
  max-height: 400px;
  width: 100%;
  border-radius: 4px;
`;

const Controls = styled.View`
  flex: 2 0;
  justify-content: flex-start;
`;

const Title2 = styled.Text.attrs(() => ({
  colors: Colors,
}))`
  ${human.title2Object as any};
  ${w.semibold as any};
  color: ghostwhite;
`;

const Subtitle = styled.Text.attrs(() => ({
  colors: Colors,
}))`
  ${human.headlineObject as any};
  color: ghostwhite;
  padding-top: 5px;
`;

const SeekBar = styled(Slider)`
  width: 100%;
`;

const Buttons = styled.View`
  flex: 1 0;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  min-width: 80%;
  margin-bottom: 40px;
`;

const ExpandedPlayPause = styled(PlayPause)`
  font-size: 70px;
`;

const ExpandedLoading = styled(ActivityIndicator)`
  transform: scale(3.5);
`;

const SkipBack = styled(SkipButton)`
  transform: rotateY(180deg);
  font-size: 40px;
`;

const SkipBackText = styled.Text`
  font-size: 12px;
  margin-left: 6px;
  margin-top: -5px;
  color: ghostwhite;
`;

const SkipForward = styled(SkipButton)`
  font-size: 40px;
`;

const SkipForwardText = styled.Text`
  font-size: 12px;
  margin-left: -5px;
  margin-top: -5px;
  color: ghostwhite;
`;

const SeekView = styled.View`
  flex: 1 0;
  justify-content: center;
`;

const TimeInfo = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  color: ghostwhite;
`;

const SeekPosition = styled.Text`
  font-size: 14px;
  color: ghostwhite;
`;

const SeekDuration = SeekPosition;

export const ExpandedPlayer: FunctionComponent<{
  style?: any;
  onMinimize: () => void;
  onSeek: (pos: number) => void;
}> = ({style, onMinimize, onSeek}) => {
  const db = useContext(DatabaseContext);
  let {state, dispatch} = useContext(StateContext);
  const {state: playState, duration, show, episode, loading} = state.player;
  const {position, episodeMeta} = useContext(PlaybackStateContext);

  let [seekPosition, setSeekPosition] = useState<number | null>(null);
  const pos = seekPosition != null ? seekPosition : position;

  let title1;
  let title2;
  let subtitle;
  const isLive = episode === undefined;
  if (episode === undefined) {
    title1 = 'Ora in onda';
    title2 = show?.name;
  } else {
    title1 = show?.name;
    title2 = episodeTitle(episode);
  }
  subtitle = show?.hosts;

  if (db && show && episode && position && position % 10000 < 100) {
    db.updateEpisodePlayPosition(episode.url, show.url, position / 1000);
  }

  if (db && episodeMeta && pos !== undefined && pos > 0 && duration) {
    if (pos >= duration - 10000) {
      if (!episodeMeta.playDate) {
        setPlayDate(db, episodeMeta, '1/1/2021');
      }
    } else if (episodeMeta.playDate) {
      setPlayDate(db, episodeMeta, undefined);
    }
  }

  return (
    <ExpandedPlayerView style={style}>
      <Header>
        <TouchableOpacity onPress={onMinimize}>
          <MinimizeIcon name="chevron-down-outline" />
        </TouchableOpacity>
        <Title1>{title1}</Title1>
      </Header>
      <CoverContainer>
        <CoverImage source={show?.cover} />
      </CoverContainer>
      <Controls>
        <Title2>{title2}</Title2>
        <Subtitle>{subtitle}</Subtitle>
        {duration !== undefined && (
          <SeekView>
            <SeekBar
              minimumValue={0}
              maximumValue={duration}
              value={pos}
              minimumTrackTintColor={'rgb(245, 26, 0)'}
              onValueChange={(value: number) => {
                setSeekPosition(Math.floor(value));
              }}
              onSlidingComplete={(value: number) => {
                if (db && show && episode && pos !== undefined) {
                  console.log('updating position', pos / 1000);
                  db.updateEpisodePlayPosition(
                    episode.url,
                    show.url,
                    pos / 1000,
                  );
                }
                setSeekPosition(null);
                dispatch(new UpdatePlayerStatus(false, value, duration));
                onSeek(value);
              }}
              thumbImage={require('../../../img/circle.png')}
            />
            <TimeInfo>
              {pos !== undefined && (
                <SeekPosition>{formatTimeMillis(pos)}</SeekPosition>
              )}

              {duration !== undefined && pos !== undefined && (
                <SeekDuration>
                  {'-' + formatTimeMillis(duration - pos)}
                </SeekDuration>
              )}
            </TimeInfo>
          </SeekView>
        )}
        <Buttons>
          <SkipBack
            disabled={isLive || loading}
            icon="reload-outline"
            onPress={() => {
              if (pos !== undefined) {
                onSeek(pos - 15 * 1000);
              }
            }}>
            <SkipBackText>15</SkipBackText>
          </SkipBack>
          {loading && <ExpandedLoading />}
          {!loading && (
            <ExpandedPlayPause
              playState={playState}
              onPress={() => dispatch(new TogglePlayPause())}
            />
          )}
          <SkipForward
            disabled={isLive || loading}
            icon="reload-outline"
            onPress={() => {
              if (pos !== undefined) {
                onSeek(pos + 30 * 1000);
              }
            }}>
            <SkipForwardText>30</SkipForwardText>
          </SkipForward>
        </Buttons>
      </Controls>
    </ExpandedPlayerView>
  );
};
