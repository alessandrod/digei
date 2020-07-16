import React, {FunctionComponent, useRef, MutableRefObject} from 'react';
import styled from 'styled-components/native';
import {
  Animated,
  PanResponder,
  useWindowDimensions,
  View,
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
  Dimensions,
  Platform,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {hasNotch} from 'react-native-device-info';

import {MiniPlayer} from 'components/player/mini';
import {ExpandedPlayer} from 'components/player/expanded';
import {MusicControls} from 'music-controls';

const PlayerView = styled(Animated.View)`
  position: absolute;
  width: 100%;
  bottom: ${() => -Dimensions.get('window').height};
  height: ${() => Dimensions.get('window').height};
  shadow-color: black;
  shadow-radius: 4px;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.5;
  elevation: 2;
`;

const PlayerViewContainer = styled(Platform.OS === 'ios' ? BlurView : View)`
  flex: 1 0;
  flex-direction: row;
  padding: 10px 15px 0px;
  background: ${Platform.OS === 'ios'
    ? 'transparent'
    : 'rgba(45, 42, 46, 0.99)'};
`;

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

interface SwipeConfig {
  onMoveStart: (
    evt: GestureResponderEvent,
    gs: PanResponderGestureState,
  ) => void;
  onMove: (evt: GestureResponderEvent, gs: PanResponderGestureState) => void;
  onSwipe: (
    evt: GestureResponderEvent,
    gs: PanResponderGestureState,
    direction: Direction,
  ) => void;
  onSwipeAborted: (
    evt: GestureResponderEvent,
    gs: PanResponderGestureState,
    direction: Direction,
  ) => void;
  horizontal?: boolean;
}

const SwipeResponder = (config: SwipeConfig) => {
  const delta_low = 80;
  const delta_hi = useWindowDimensions().height / 3;
  const velocity_treshold = 0.3;
  const click_treshold = 4;

  const is_swipe = (delta: number, velocity: number) => {
    delta = Math.abs(delta);
    return (
      delta > delta_hi ||
      (delta > delta_low && Math.abs(velocity) > velocity_treshold)
    );
  };

  const finishSwipe = (evt, gs) => {
    let {dx, dy, vx, vy} = gs;
    if (config.horizontal) {
      let dir = dx < 0 ? Direction.Left : Direction.Right;
      if (is_swipe(dx, vx)) {
        config.onSwipe(evt, gs, dir);
      } else {
        config.onSwipeAborted(evt, gs, dir);
      }
    } else {
      let dir = dy < 0 ? Direction.Up : Direction.Down;
      if (is_swipe(dy, vy)) {
        config.onSwipe(evt, gs, dir);
      } else {
        config.onSwipeAborted(evt, gs, dir);
      }
    }
  };

  const shouldSetResponder = (evt, gs) => {
    let {dx, dy} = gs;
    const delta = Math.abs(config.horizontal ? dx : dy);
    if (delta > click_treshold) {
      return true;
    }
    return false;
  };

  return PanResponder.create({
    onStartShouldSetPanResponder: shouldSetResponder,
    onMoveShouldSetPanResponder: shouldSetResponder,
    onPanResponderGrant: config.onMoveStart,
    onPanResponderMove: config.onMove,
    onPanResponderRelease: finishSwipe,
    onPanResponderTerminate: finishSwipe,
  });
};

export const Swipeable: FunctionComponent<
  {style?: ViewStyle; horizontal: boolean} & SwipeConfig
> = (props) => {
  const {style, ...methods} = props;
  let resp = useRef(SwipeResponder(methods as SwipeConfig)).current;

  return (
    <View style={style} {...resp.panHandlers}>
      {props.children}
    </View>
  );
};

const PlayerSwipe = styled(Swipeable)`
  flex: 1 0;
`;

class PlayerSwipeConfig implements SwipeConfig {
  readonly pan: MutableRefObject<Animated.Value>;
  private pan_value?: number;
  private pan_listener: string;
  private move_offset?: number;
  private miniOffset: number;
  private height: number;

  constructor(miniOffset: number, height: number) {
    this.pan_value = miniOffset;
    this.miniOffset = miniOffset;
    this.height = height;
    this.pan = useRef(new Animated.Value(miniOffset));
    this.pan_listener = this.pan.current.addListener(({value}) => {
      this.pan_value = value;
    });
  }

  onMoveStart(_evt: GestureResponderEvent, _gs: PanResponderGestureState) {
    this.move_offset = this.pan_value;
  }

  onMove(evt: GestureResponderEvent, gs: PanResponderGestureState) {
    if (this.move_offset === undefined) {
      return;
    }
    let y = Math.min(
      Math.max(this.move_offset + gs.dy, -this.height),
      this.miniOffset,
    );
    this.pan.current.setValue(y);
  }

  onSwipe(
    _evt: GestureResponderEvent,
    _gs: PanResponderGestureState,
    direction: Direction,
  ) {
    this.doSwipe(direction);
  }

  doSwipe(direction: Direction) {
    let target = null;
    if (direction === Direction.Up) {
      target = -this.height;
    } else if (direction === Direction.Down) {
      target = this.miniOffset;
    }
    if (target === null) {
      return;
    }

    let anim = Animated.spring(this.pan.current, {
      toValue: target,
      useNativeDriver: true,
    });
    anim.start();
  }

  onSwipeAborted(
    evt: GestureResponderEvent,
    gs: PanResponderGestureState,
    dir: Direction,
  ) {
    if (this.pan_value === this.miniOffset || this.pan_value === -this.height) {
      return;
    }
    if (dir === Direction.Up) {
      this.onSwipe(evt, gs, Direction.Down);
    } else {
      this.onSwipe(evt, gs, Direction.Up);
    }
  }
}

const MINI_HEIGHT = hasNotch() ? 100 : 70;

export const PlayerComponent: FunctionComponent = () => {
  const height = useWindowDimensions().height;
  const miniOffset = -MINI_HEIGHT;
  const swipe = useRef(new PlayerSwipeConfig(miniOffset, height)).current;
  const pan = swipe.pan.current;
  let miniOpacity = pan.interpolate({
    inputRange: [miniOffset - 10, miniOffset],
    outputRange: [0, 1.0],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  let expOpacity = pan.interpolate({
    inputRange: [miniOffset - 20, miniOffset],
    outputRange: [1, 0],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  let expMarginTop = pan.interpolate({
    inputRange: [miniOffset - 20, miniOffset],
    outputRange: [0, 50], // NOTE: 60px is the height of the MiniPlayer. Needs to be kept in sync.
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let s = swipe;
  let methods: SwipeConfig = {
    onMoveStart: s.onMoveStart.bind(s),
    onMove: s.onMove.bind(s),
    onSwipe: s.onSwipe.bind(s),
    onSwipeAborted: s.onSwipeAborted.bind(s),
  };

  return (
    <PlayerView style={{transform: [{translateY: pan}]}}>
      <PlayerViewContainer blurType="chromeMaterialDark">
        <PlayerSwipe {...methods}>
          <MiniPlayer
            style={{opacity: miniOpacity}}
            onMaximize={() => swipe.doSwipe(Direction.Up)}
          />
          <ExpandedPlayer
            onMinimize={() => swipe.doSwipe(Direction.Down)}
            style={{
              opacity: expOpacity,
              transform: [{translateY: expMarginTop}],
            }}
          />
        </PlayerSwipe>
        <MusicControls />
      </PlayerViewContainer>
    </PlayerView>
  );
};

export const PlayerPadding = styled.View`
  height: ${MINI_HEIGHT};
`;
