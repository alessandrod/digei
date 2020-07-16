import React, {FunctionComponent} from 'react';
import {ImageSourcePropType, ViewStyle} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {Cover} from 'components/cover';

const Container = styled.View`
  flex: 1 0;
  flex-direction: row;
  align-items: center;
`;

const CoverImage = styled(Cover)`
  height: 100%;
  aspect-ratio: 1;
  background: black;
`;

const TextContainer = styled.View`
  flex: 1 0;
  padding-left: 15px;
`;

const Artist = styled.Text`
  ${human.calloutObject as any}
  color: ghostwhite;
`;

const Title = styled.Text`
  ${human.title3Object as any}
  ${w.semibold as any};
  color: ghostwhite;
  padding-top: 4px;
`;

export const CurrentTrack: FunctionComponent<{
  cover: ImageSourcePropType;
  artist: string;
  title: string;
  style?: ViewStyle;
}> = ({cover, artist, title, style}) => {
  return (
    <Container style={style}>
      <CoverImage source={cover} />
      <TextContainer>
        <Artist numberOfLines={1}>{artist}</Artist>
        <Title numberOfLines={1}>{title}</Title>
      </TextContainer>
    </Container>
  );
};
