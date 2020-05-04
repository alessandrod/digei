import React, {FunctionComponent, useRef, MutableRefObject} from 'react';
import styled from 'styled-components/native';
import {
  Animated,
  PanResponder,
  useWindowDimensions,
  View,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';

import {MiniPlayer} from 'components/player/mini';
import {ExpandedPlayer} from 'components/player/expanded';

const PlayerView = styled(Animated.View)`
  position: absolute;
  bottom: -100%;
  width: 100%;
  height: 100%;
`;

const PlayerViewContainer = styled(BlurView)`
  flex: 1 0;
  flex-direction: row;
  padding: 10px 15px 0px;
`;

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

interface SwipeMethods {
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
}

interface SwipeConfig extends SwipeMethods {
  style?: any;
  horizontal: boolean;
}

type SwipeableProps = SwipeConfig;

const SwipeResponder = (config_ref: MutableRefObject<SwipeConfig>) => {
  const delta_low = 80;
  const delta_hi = useWindowDimensions().height / 3;
  const velocity_treshold = 0.3;

  const is_swipe = (delta: number, velocity: number) => {
    delta = Math.abs(delta);
    return (
      delta > delta_hi ||
      (delta > delta_low && Math.abs(velocity) > velocity_treshold)
    );
  };

  return PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: config_ref.current.onMoveStart,
    onPanResponderMove: config_ref.current.onMove,
    onPanResponderRelease: (evt, gs) => {
      let {dx, dy, vx, vy} = gs;
      let config = config_ref.current;
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
    },
  });
};

export const Swipeable: FunctionComponent<SwipeableProps> = (props) => {
  let config = useRef(props as SwipeConfig);
  let resp = useRef(SwipeResponder(config)).current;

  return (
    <View style={props.style} {...resp.panHandlers}>
      {props.children}
    </View>
  );
};

const PlayerSwipe = styled(Swipeable)`
  flex: 1 0;
`;

class PlayerSwipeMethods implements SwipeMethods {
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
      useNativeDriver: false,
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

export const PlayerComponent: FunctionComponent<{
  onSeek: (pos: number) => void;
}> = ({onSeek}) => {
  const height = useWindowDimensions().height;
  const miniOffset = -75;
  const swipe = useRef(new PlayerSwipeMethods(miniOffset, height)).current;
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
    outputRange: [-60, 0], // NOTE: 60px is the height of the MiniPlayer. Needs to be kept in sync.
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let s = swipe;
  let methods: SwipeMethods = {
    onMoveStart: s.onMoveStart.bind(s),
    onMove: s.onMove.bind(s),
    onSwipe: s.onSwipe.bind(s),
    onSwipeAborted: s.onSwipeAborted.bind(s),
  };

  return (
    <PlayerView style={{transform: [{translateY: pan}]}}>
      <PlayerViewContainer blurType="thickMaterialDark">
        <PlayerSwipe {...methods}>
          <MiniPlayer
            style={{opacity: miniOpacity}}
            onSeek={onSeek}
            onMaximize={() => swipe.doSwipe(Direction.Up)}
          />
          <ExpandedPlayer
            onMinimize={() => swipe.doSwipe(Direction.Down)}
            onSeek={onSeek}
            style={{opacity: expOpacity, marginTop: expMarginTop}}
          />
        </PlayerSwipe>
      </PlayerViewContainer>
    </PlayerView>
  );
};
