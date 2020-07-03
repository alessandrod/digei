import Icon from 'react-native-vector-icons/Ionicons';
import styled, {css} from 'styled-components/native';
import React, {FunctionComponent, useContext} from 'react';

import {Colors} from 'theme';
import {PlayState, StateContext, LIVE_URL} from 'state';
import {ViewStyle, ActivityIndicator, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {ToggleLive} from 'actions';

const PlayIcon = styled(Icon).attrs(() => ({colors: Colors}))`
  color: ghostwhite;
`;

export const PlayPause: FunctionComponent<{
  style?: ViewStyle;
  onPress: () => void;
  playState: PlayState;
}> = ({style, onPress, playState}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <PlayIcon
        style={style}
        name={
          playState !== PlayState.PLAYING
            ? 'play-circle-outline'
            : 'pause-circle-outline'
        }
      />
    </TouchableOpacity>
  );
};

const IconStyle = css`
  width: 34px;
  height: 40px;
  padding-top: 2px;
  margin-left: 10px;
  color: rgb(245, 26, 0);
  font-size: 34px;
`;

const LivePlayPauseView = styled(PlayPause)`
  ${IconStyle};
`;

const LiveLoading = styled(ActivityIndicator)`
  ${IconStyle};
  transform: scale(1.4);
`;

export const LivePlayPause: FunctionComponent<{style?: ViewStyle}> = ({
  style,
}) => {
  const {
    state: {
      player: {state: playerState, loading, media},
    },
    dispatch,
  } = useContext(StateContext);
  const mediaIsLive = media?.url === LIVE_URL;
  let indicator = mediaIsLive && loading && <LiveLoading style={style} />;
  return (
    <View>
      {indicator}
      {!indicator && (
        <LivePlayPauseView
          style={style}
          playState={mediaIsLive ? playerState : PlayState.STOPPED}
          onPress={() => {
            dispatch(new ToggleLive());
          }}
        />
      )}
    </View>
  );
};

const SkipView = styled(TouchableOpacity)`
  flex: 1 0;
  justify-content: center;
  align-items: center;
`;

const SkipIcon = styled(Icon)`
  color: ghostwhite;
  opacity: ${(props) => (props.disabled ? '0.2' : '1')};
`;

const SkipLabel = styled.View`
  flex: 1 0;
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
