import React, {FunctionComponent, useContext} from 'react';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';
import {Pressable} from 'react-native';

import {Show} from 'state';
import {NavigationProp} from 'navigation';
import {DatabaseContext} from 'db';
import {hasNotch} from 'react-native-device-info';

const ShowView = styled(Pressable)`
  flex: 1 0;
  flex-direction: row;
  padding-bottom: 15px;
`;

const CoverWrapper = styled.View`
  flex: 3 0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 2px;
  background: white;
`;

const Cover = styled.Image`
  aspect-ratio: 1;
  resize-mode: cover;
  border-radius: 3px;
`;

const ShowTextView = styled.View`
  flex: 7 0;
  flex-direction: column;
  margin-left: 10px;
`;

const ShowTitle = styled.Text`
  ${human.title3Object as any}
`;

const ShowDescription = styled.Text`
  min-height: 60px;
  margin-top: 5px;
  ${human.subheadObject as any}
  ${w.light as any};
`;

export const LiveShow: FunctionComponent<{
  show: Show;
  navigation: NavigationProp<'Show'>;
}> = ({show, navigation}) => {
  let {name, cover, description} = show;
  const {db} = useContext(DatabaseContext);
  return (
    <ShowView
      onPress={() => {
        db.fetchEpisodeMeta(show.url).then((meta) => {
          navigation.navigate('Show', {show, meta});
        });
      }}>
      <CoverWrapper>
        <Cover source={cover} />
      </CoverWrapper>
      <ShowTextView>
        <ShowTitle>{name}</ShowTitle>
        <ShowDescription numberOfLines={hasNotch() ? 4 : 3}>
          {description}
        </ShowDescription>
      </ShowTextView>
    </ShowView>
  );
};
