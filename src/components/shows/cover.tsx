import React, {FunctionComponent, useContext} from 'react';
import {Pressable, ViewStyle} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {Show} from 'state';
import {NavigationProp} from 'navigation';
import {DatabaseContext} from 'db';
import {Cover} from 'components/cover';

const Title = styled.Text`
  ${human.calloutObject as any};
  ${w.semibold as any};
  padding-top: 5px;
`;

const CoverView = styled(Pressable)`
  flex: 1 0;
  max-width: 49%;
`;

export const ShowCover: FunctionComponent<{
  show: Show;
  navigation: NavigationProp<'Show'>;
  style?: ViewStyle;
}> = ({show, navigation, style}) => {
  let {name, cover} = show;
  const {db} = useContext(DatabaseContext);
  return (
    <CoverView
      style={style}
      onPress={() => {
        db?.fetchEpisodeMeta(show.url).then((meta) => {
          navigation.navigate('Show', {show, meta});
        });
      }}>
      <Cover source={cover} />
      <Title>{name}</Title>
    </CoverView>
  );
};
