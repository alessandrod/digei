import Icon from 'react-native-vector-icons/Ionicons';
import styled from 'styled-components/native';
import React, {
  FunctionComponent,
  useContext,
  ReactNodeArray,
  useState,
  useEffect,
} from 'react';

import {Colors} from 'theme';
import {PlayState, StateContext, LIVE_URL} from 'state';
import {ViewStyle, Pressable} from 'react-native';
import {ToggleLive} from 'actions';
import {useStableLoading} from 'utils';
import {Spinner, Centered} from 'components';

const PlayIcon = styled(Icon).attrs(() => ({colors: Colors}))`
  color: ghostwhite;
`;

export const PlayPause: FunctionComponent<{
  style?: ViewStyle;
  onPress: () => void;
  playState: PlayState;
}> = ({style, onPress, playState}) => {
  return (
    <Pressable onPress={onPress}>
      <PlayIcon
        style={style}
        name={
          playState !== PlayState.PLAYING
            ? 'play-circle-outline'
            : 'pause-circle-outline'
        }
      />
    </Pressable>
  );
};

const LoadingContainer = styled(Centered)``;

export const LoadingComponent: FunctionComponent<{
  style?: ViewStyle;
  loading: boolean;
  children: ReactNodeArray;
}> = ({loading, style, children}) => {
  return (
    <LoadingContainer style={style}>
      {loading && children[0]}
      {!loading && children[1]}
    </LoadingContainer>
  );
};

export const LoadingSpinner = styled(Spinner)`
  width: 100%;
  height: 100%;
  transform: scale(1.2);
`;

export const LivePlayPause: FunctionComponent<{
  spinnerSize?: 'small' | 'large';
  style?: ViewStyle;
}> = ({spinnerSize, style}) => {
  let {
    state: {
      player: {state: playerState, loading, media},
    },
    dispatch,
  } = useContext(StateContext);
  loading = useStableLoading(loading);
  const mediaIsLive = media?.url === LIVE_URL;
  return (
    <LoadingComponent loading={mediaIsLive && loading}>
      <LoadingSpinner size={spinnerSize} />
      <PlayPause
        style={style}
        playState={mediaIsLive ? playerState : PlayState.STOPPED}
        onPress={() => {
          dispatch(new ToggleLive());
        }}
      />
    </LoadingComponent>
  );
};

const SkipView = styled(Pressable)`
  justify-content: center;
  align-items: center;
`;

const SkipIcon = styled(Icon)`
  color: ghostwhite;
  opacity: ${(props) => (props.disabled ? '0.2' : '1')};
`;

const SkipLabel = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  opacity: ${(props) => (props.disabled ? '0.2' : '1')};
`;

export const SkipButton: FunctionComponent<{
  disabled?: boolean;
  style?: ViewStyle;
  onPress: () => void;
}> = ({style, disabled, onPress, children}) => {
  return (
    <SkipView disabled={disabled} onPress={onPress}>
      <SkipIcon disabled={disabled} style={style} name="reload-outline" />
      <SkipLabel disabled={disabled}>{children}</SkipLabel>
    </SkipView>
  );
};
