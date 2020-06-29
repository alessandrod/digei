import React, {FunctionComponent, useContext} from 'react';
import {TouchableOpacity} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {Colors} from 'theme';
import {Show} from 'state';
import {NavigationProp} from 'navigation';
import {DatabaseContext} from 'db';

const ShowView = styled.View`
  flex: 1 0;
  flex-direction: row;
  min-width: 100%;
  justify-content: space-between;
  padding-bottom: 15px;
`;

const ShowTextView = styled.View`
  flex: 3 0;
  padding-left: 10px;
`;

const ShowTitle = styled.Text`
  ${human.title3Object as any}
`;

const ShowDescription = styled.Text.attrs(() => ({colors: Colors}))`
  color: ${(p) => p.colors.light};
  margin-top: 5px;
  ${human.subheadObject as any}
  ${w.light as any};
`;

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
  resize-mode: cover;
`;

export const LiveShow: FunctionComponent<{
  show: Show;
  navigation: NavigationProp<'Show'>;
}> = ({show, navigation}) => {
  let {name, cover, description} = show;
  const {db} = useContext(DatabaseContext);
  return (
    <TouchableOpacity
      onPress={() => {
        db.fetchEpisodeMeta(show.url).then((meta) => {
          navigation.navigate('Show', {show, meta});
        });
      }}>
      <ShowView>
        <CoverWrapper>
          <Cover source={cover} />
        </CoverWrapper>
        <ShowTextView>
          <ShowTitle>{name}</ShowTitle>
          <ShowDescription numberOfLines={3}>{description}</ShowDescription>
        </ShowTextView>
      </ShowView>
    </TouchableOpacity>
  );
};
