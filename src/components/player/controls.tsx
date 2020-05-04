import Icon from 'react-native-vector-icons/Ionicons';
import styled from 'styled-components/native';
import React, {FunctionComponent} from 'react';

import {Colors} from 'theme';
import {PlayState} from 'state';
import {ViewStyle} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

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
