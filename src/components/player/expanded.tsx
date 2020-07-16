import React, {FunctionComponent, useContext, useState} from 'react';
import styled from 'styled-components/native';
import {Animated, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';
import {hasNotch} from 'react-native-device-info';

import {
  PlayPause,
  SkipButton,
  LoadingComponent,
} from 'components/player/controls';
import {StateContext, PlaybackStateContext} from 'state';
import {TogglePlayPause, Seek} from 'actions';
import {formatTimeMillis, formatDate, useStableLoading} from 'utils';
import {episodeTitle, Spinner} from 'components';
import {DatabaseContext} from 'db';
import {setPlayDate} from 'components/show/episode';
import {Cover} from 'components/cover';
import {CurrentTrack} from './current-track';

const ExpandedPlayerView = styled(Animated.View)`
  flex: 1 0;
  position: absolute;
  top: ${hasNotch() ? 35 : 10}px;
  bottom: 0px;
  width: 100%;
`;

const Header = styled.View`
  flex: -1 0;
  flex-direction: column;
  min-height: 50px;
  justify-content: flex-start;
`;

const MinimizeIcon = styled(Icon)`
  color: ghostwhite;
  font-size: 34px;
`;

const HeaderTitle = styled.Text`
  ${human.title2Object as any};
  ${!hasNotch() && (human.headlineObject as any)}
  color: ghostwhite;
  ${w.bold as any};
  margin-top: -${hasNotch() ? 30 : 25}px;
  align-self: center;
  max-width: 80%;
`;

const ShowCover = styled(Cover)`
  flex: 12 0;
  margin: auto;
  max-width: 100%;
  aspect-ratio: 1;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: transparent;
`;

const Bottom = styled.View`
  flex: 2 0;
  justify-content: center;
`;

const Info = styled.View`
  flex: 3 0;
  padding-top: 10px;
`;

const Title2 = styled.Text`
  ${human.title2Object as any};
  ${w.bold as any};
  color: ghostwhite;
`;

const Subtitle = styled.Text`
  ${human.bodyObject as any};
  color: ghostwhite;
  padding-top: 5px;
`;

const LiveTrackContainer = styled.View`
  flex: 4 0;
`;

const LiveTrack = styled(CurrentTrack)`
  max-height: 80px;
`;

const SeekView = styled.View`
  flex: 2 0;
`;

const SeekBar = styled(Slider)`
  width: 100%;
  height: 14px;
`;

const TimeInfo = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  color: ghostwhite;
`;

const SeekPosition = styled.Text`
  ${human.caption2Object as any}
  color: ghostwhite;
`;

const Buttons = styled.View`
  flex: 4 0;
  flex-direction: row;
  align-items: flex-start;
  min-width: 80%;
`;

const ButtonsInner = styled.View`
  width: 100%;
  height: 80px;
  flex-direction: row;
  justify-content: space-around;
`;

const CenterButton = styled(LoadingComponent)`
  /* give explicit sizes to contain both PlayPause and the Spinner */
  width: 80px;
  height: 80px;
`;

const ExpandedPlayPause = styled(PlayPause)`
  font-size: 80px;
  line-height: 80px;
`;

const ExpandedLoading = styled(Spinner)`
  transform: scale(
    1.6
  ); /* Large spinner is 36px, scale up to ExpandedPlayPause size */
`;

const SkipBack = styled(SkipButton)`
  color: ghostwhite;
  font-size: 56px;
  transform: rotateY(180deg);
`;

const SkipBackText = styled.Text`
  font-size: 16px;
  margin-left: 6px;
  color: ghostwhite;
`;

const SkipForward = styled(SkipButton)`
  color: ghostwhite;
  font-size: 56px;
`;

const SkipForwardText = styled.Text`
  font-size: 16px;
  margin-left: -5px;
  color: ghostwhite;
`;

const SeekDuration = SeekPosition;

export const ExpandedPlayer: FunctionComponent<{
  style?: any;
  onMinimize: () => void;
}> = ({style, onMinimize}) => {
  const {db} = useContext(DatabaseContext);
  let {state, dispatch} = useContext(StateContext);
  const {liveTrack} = state;
  let {state: playState, duration, loading} = state.player;
  const {show, episode, episodeMeta, position, seekCookie} = useContext(
    PlaybackStateContext,
  );
  loading = useStableLoading(loading);

  let [seekPosition, setSeekPosition] = useState<number | null>(null);
  const [lastSeekCookie, setLastSeekCookie] = useState(seekCookie);
  if (seekCookie !== lastSeekCookie) {
    setLastSeekCookie(seekCookie);
    setSeekPosition(null);
  }
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

  if (
    show &&
    episode &&
    episodeMeta !== undefined &&
    (position === undefined || (position > 0 && position % 10000 < 100))
  ) {
    if (position !== undefined) {
      episodeMeta.playPosition = position / 1000;
      db.updateEpisodePlayPosition(
        episode.url,
        show.url,
        episodeMeta.playPosition,
      );
    } else if (!loading) {
      // position is undefined when playback ends, so we reset the play position
      setPlayDate(db, episodeMeta, formatDate(Date.now()), true);
    }
  }

  return (
    <ExpandedPlayerView style={style}>
      <Header>
        <Pressable onPress={onMinimize}>
          <MinimizeIcon name="chevron-down-sharp" />
        </Pressable>
        <HeaderTitle>{title1}</HeaderTitle>
      </Header>
      <ShowCover source={show?.cover} />
      <Info>
        <Title2>{title2}</Title2>
        <Subtitle>{subtitle}</Subtitle>
      </Info>
      {!isLive && (
        <SeekView>
          <SeekBar
            minimumValue={0}
            maximumValue={duration}
            disabled={duration === undefined}
            value={pos}
            minimumTrackTintColor="rgb(245, 26, 0)"
            maximumTrackTintColor="gainsboro"
            onValueChange={(value: number) => {
              setSeekPosition(Math.floor(value));
            }}
            onSlidingComplete={(value: number) => {
              if (show && episode && episodeMeta) {
                episodeMeta.playPosition = value / 1000;
                db.updateEpisodePlayPosition(
                  episode.url,
                  show.url,
                  value / 1000,
                );
              }
              dispatch(new Seek(value / 1000));
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
      {isLive && liveTrack !== undefined && (
        <LiveTrackContainer>
          <LiveTrack
            cover={liveTrack.cover}
            artist={liveTrack.artist}
            title={liveTrack.title}
          />
        </LiveTrackContainer>
      )}
      <Buttons>
        <ButtonsInner>
          <SkipBack
            disabled={isLive || loading}
            onPress={() => dispatch(new Seek(-15, true))}>
            <SkipBackText>15</SkipBackText>
          </SkipBack>
          <CenterButton loading={loading}>
            <ExpandedLoading size="large" color="white" />
            <ExpandedPlayPause
              playState={playState}
              onPress={() => dispatch(new TogglePlayPause())}
            />
          </CenterButton>
          <SkipForward
            disabled={isLive || loading}
            onPress={() => dispatch(new Seek(30, true))}>
            <SkipForwardText>30</SkipForwardText>
          </SkipForward>
        </ButtonsInner>
      </Buttons>
    </ExpandedPlayerView>
  );
};
