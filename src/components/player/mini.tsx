import React, {FunctionComponent, useContext} from 'react';
import styled from 'styled-components/native';
import {Animated, ActivityIndicator} from 'react-native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';
import {iOSColors as clr} from 'react-native-typography';

import {Colors} from 'theme';
import {PlayPause, SkipButton} from 'components/player/controls';
import {StateContext, PlaybackStateContext} from 'state';
import {TogglePlayPause} from 'actions';
import {episodeTitle} from 'components';
import {TouchableOpacity} from 'react-native-gesture-handler';

const Touchable = styled(TouchableOpacity)`
  min-height: 50px;
`;

const MiniPlayerView = styled(Animated.View)`
  flex: 0 0;
  flex-direction: row;
  min-height: 50px;
  align-items: center;
`;

const CoverImage = styled.Image`
  flex: 1 0;
  aspect-ratio: 1;
  max-width: 50px;
  border-radius: 2px;
`;

const PlayerText = styled.View`
  flex: 1 0;
  flex-direction: column;
  padding-left: 15px;
`;

const Subtitle = styled.Text.attrs(() => ({
  colors: Colors,
}))`
  ${human.footnoteObject as any}
  color: ghostwhite;
`;

const Title = styled.Text.attrs(() => ({
  colors: Colors,
}))`
  ${human.subheadObject as any}
  ${w.semibold as any};
  color: ghostwhite;
  padding-top: 4px;
`;

const MiniPlayPause = styled(PlayPause)`
  font-size: 30px;
  margin: 0px 25px;
`;

const MiniLoading = styled(ActivityIndicator)`
  margin: 0px 30px;
  transform: scale(1.5);
`;

const SkipBack = styled(SkipButton)`
  transform: rotateY(180deg);
  font-size: 30px;
`;

const SkipBackText = styled.Text`
  font-size: 9px;
  margin-left: 6px;
  margin-top: -4px;
  color: ghostwhite;
`;

export const MiniPlayer: FunctionComponent<{
  style?: any;
  onMaximize: () => void;
  onSeek: (pos: number) => void;
}> = ({style, onMaximize, onSeek}) => {
  const {state, dispatch} = useContext(StateContext);
  const {position} = useContext(PlaybackStateContext);
  let {show, episode, state: playState, loading} = state.player;

  const isLive = episode === undefined;
  let title;
  let subtitle;
  if (episode === undefined) {
    title = show?.name;
    subtitle = 'Ora in onda';
  } else {
    title = episodeTitle(episode);
    subtitle = show?.name;
  }
  return (
    <Touchable onPress={onMaximize}>
      <MiniPlayerView style={style}>
        <CoverImage source={show?.cover} />
        <PlayerText>
          <Subtitle>{subtitle}</Subtitle>
          <Title>{title}</Title>
        </PlayerText>
        {loading && <MiniLoading />}
        {!loading && (
          <MiniPlayPause
            playState={playState}
            onPress={() => dispatch(new TogglePlayPause())}
          />
        )}
        <SkipBack
          disabled={isLive || loading}
          icon="reload-outline"
          onPress={() => {
            if (position !== undefined) {
              onSeek(position - 15 * 1000);
            }
          }}>
          <SkipBackText>15</SkipBackText>
        </SkipBack>
      </MiniPlayerView>
    </Touchable>
  );
};
