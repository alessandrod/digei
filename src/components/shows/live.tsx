import React, {FunctionComponent, useContext} from 'react';
import {Pressable} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';
import {hasNotch} from 'react-native-device-info';

import {Show} from 'state';
import {NavigationProp} from 'navigation';
import {DatabaseContext} from 'db';
import {Cover} from 'components/cover';

const ShowView = styled(Pressable)`
  flex: 1 0;
  flex-direction: row;
  padding-bottom: 15px;
`;

const LiveCover = styled(Cover)`
  flex: 3 0;
  aspect-ratio: 1;
`;

const ShowTextView = styled.View`
  flex: 7 0;
  flex-direction: column;
  margin-left: 10px;
`;

const ShowTitle = styled.Text`
  ${human.title3Object as any}
  ${w.semibold as any}
`;

const ShowDescription = styled.Text`
  min-height: 60px;
  margin-top: 5px;
  ${human.calloutObject as any}
  ${w.light as any}
`;

export const LiveShow: FunctionComponent<{
  show: Show;
  navigation: NavigationProp<'Show'>;
}> = ({show, navigation}) => {
  let {name, cover, description} = show;
  if (name === 'Vic e Marisa' && description.length === 0) {
    // HACK: fix description
    description = ['Marisa Passera e Vic in onda dalle 8 alle 10 del mattino.'];
  }
  const {db} = useContext(DatabaseContext);
  return (
    <ShowView
      onPress={() => {
        db.fetchEpisodeMeta(show.url).then((meta) => {
          navigation.navigate('Show', {show, meta});
        });
      }}>
      <LiveCover source={cover} />
      <ShowTextView>
        <ShowTitle>{name}</ShowTitle>
        <ShowDescription numberOfLines={hasNotch() ? 4 : 3}>
          {description}
        </ShowDescription>
      </ShowTextView>
    </ShowView>
  );
};
