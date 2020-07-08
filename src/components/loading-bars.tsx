import React, {FunctionComponent, useRef, useEffect, useMemo} from 'react';
import {Animated, ViewStyle} from 'react-native';
import styled from 'styled-components/native';

export type AnimatedBar = {
  from: number;
  to: number;
  duration: number;
};

const buildBarAnimation = (
  transformY: Animated.Value,
  playing: boolean,
  anim: AnimatedBar,
) => {
  const {from: from, to: to, duration} = anim;
  const anims = [];
  if (playing) {
    anims.push(
      Animated.timing(transformY, {
        toValue: to,
        duration,
        isInteraction: false,
        useNativeDriver: true,
      }),
    );
  }
  anims.push(
    Animated.timing(transformY, {
      toValue: from,
      duration,
      isInteraction: false,
      useNativeDriver: true,
    }),
  );

  return Animated.sequence(anims);
};

const buildAnimation = (
  vals: Animated.Value[],
  animations: AnimatedBar[],
  playing: boolean,
) => {
  let anims = animations.map((anim, i) =>
    buildBarAnimation(vals[i], playing, anim),
  );
  if (playing) {
    anims = anims.map((anim) => Animated.loop(anim));
  }

  return Animated.parallel(anims);
};

const AnimationView = styled.View`
  flex-direction: row;
  overflow: hidden;
`;

export const LoadingBars: FunctionComponent<{
  playing: boolean;
  animations: AnimatedBar[];
  BarComponent: React.ComponentType<any>;
  style?: ViewStyle;
}> = ({playing, animations, style, BarComponent}) => {
  const vals = useRef<Animated.Value[]>([]).current;
  useEffect(() => {
    vals.length = 0;
    vals.push(...animations.map((bar) => new Animated.Value(bar.from)));
  }, [vals, animations]);

  useEffect(() => {
    const anim = buildAnimation(vals, animations, playing);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [vals, animations, playing]);

  return (
    <AnimationView style={style}>
      {vals.map((val) => (
        <BarComponent style={{transform: [{translateY: val}]}} />
      ))}
    </AnimationView>
  );
};

const SmallBar = styled(Animated.View)`
  width: 4px;
  margin-right: 1px;
  height: 14px;
  background: rgb(245, 26, 0);
`;

export const SmallLoadingBars: FunctionComponent<{
  playing: boolean;
  style?: ViewStyle;
}> = (props) => {
  const animations: AnimatedBar[] = useMemo(
    () => [
      {from: 12, to: 5, duration: 550},
      {from: 12, to: 2, duration: 500},
      {from: 12, to: 0, duration: 350},
      {from: 12, to: 4, duration: 450},
    ],
    [],
  );

  return (
    <LoadingBars animations={animations} BarComponent={SmallBar} {...props} />
  );
};
