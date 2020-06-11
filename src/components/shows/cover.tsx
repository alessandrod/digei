import React, {FunctionComponent, useContext} from 'react';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';

import {Show} from 'state';
import {NavigationProp} from 'navigation';
import {DatabaseContext} from 'db';

const CoverWrapper = styled.View`
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 2px;
`;

const Cover = styled.Image`
  border-radius: 3px;
  flex: 1 0;
  aspect-ratio: 1;
  min-width: 100%;
  resize-mode: cover;
  height: 0;
  padding-bottom: 100%; /* % padding is relative to width, so this will fill up to 100% */
`;

const Title = styled.Text`
  ${human.calloutObject as any};
  padding-top: 5px;
`;

const CoverView = styled.TouchableOpacity`
  flex: 1 0;
  max-width: 182px;
`;

export const ShowCover: FunctionComponent<{
  show: Show;
  navigation: NavigationProp<'Show'>;
}> = ({show, navigation}) => {
  let {name, cover} = show;
  const db = useContext(DatabaseContext);
  return (
    <CoverView
      onPress={() => {
        db?.fetchEpisodeMeta(show.url).then((meta) => {
          navigation.navigate('Show', {show, meta});
        });
      }}>
      <CoverWrapper>
        <Cover source={cover} />
      </CoverWrapper>
      <Title>{name}</Title>
    </CoverView>
  );
};
