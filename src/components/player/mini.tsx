import React, {FunctionComponent, useContext} from 'react';
import styled from 'styled-components/native';
import {Animated, Pressable} from 'react-native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {
  PlayPause,
  SkipButton,
  LoadingComponent,
  LoadingSpinner,
} from 'components/player/controls';
import {StateContext} from 'state';
import {TogglePlayPause, Seek} from 'actions';
import {episodeTitle} from 'components';
import {useStableLoading} from 'utils';

const Touchable = styled(Pressable)`
  height: 60px;
`;

const MiniPlayerView = styled(Animated.View)`
  flex: 1 0;
  flex-direction: row;
  align-items: center;
`;

const CoverImage = styled.Image`
  height: 100%;
  aspect-ratio: 1;
  border-radius: 2px;
`;

const PlayerText = styled.View`
  flex: 1 0;
  flex-direction: column;
  padding-left: 15px;
`;

const Subtitle = styled.Text`
  ${human.footnoteObject as any}
  color: ghostwhite;
`;

const Title = styled.Text`
  ${human.subheadObject as any}
  ${w.semibold as any};
  color: ghostwhite;
  padding-top: 4px;
`;

const PlayPauseContainer = styled(LoadingComponent)`
  width: 38px;
  height: 42px;
  margin: 0 25px;
`;

const MiniLoadingSpinner = styled(LoadingSpinner)`
  transform: scale(1);
`;

const MiniPlayPause = styled(PlayPause)`
  font-size: 44px;
  margin-top: -4px;
  margin-left: -4px;
`;

const SkipBack = styled(SkipButton)`
  transform: rotateY(180deg);
  font-size: 40px;
`;

const SkipBackText = styled.Text`
  font-size: 12px;
  margin-left: 6px;
  margin-top: -2px;
  color: ghostwhite;
`;

export const MiniPlayer: FunctionComponent<{
  style?: any;
  onMaximize: () => void;
}> = ({style, onMaximize}) => {
  const {state, dispatch} = useContext(StateContext);
  let {show, episode, state: playState, loading} = state.player;

  loading = useStableLoading(loading);

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
        <PlayPauseContainer loading={loading}>
          <MiniLoadingSpinner size="large" color="white" />
          <MiniPlayPause
            spinnerSize="large"
            playState={playState}
            onPress={() => dispatch(new TogglePlayPause())}
          />
        </PlayPauseContainer>
        <SkipBack
          disabled={isLive || loading}
          icon="reload-outline"
          onPress={() => dispatch(new Seek(-15, true))}>
          <SkipBackText>15</SkipBackText>
        </SkipBack>
      </MiniPlayerView>
    </Touchable>
  );
};
