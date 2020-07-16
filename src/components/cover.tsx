import React, {FunctionComponent} from 'react';
import {ImageSourcePropType, ViewStyle} from 'react-native';
import styled from 'styled-components/native';

const Shadow = styled.View`
  shadow-color: black;
  shadow-radius: 2px;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  background: white;
  border-radius: 8px;
  elevation: 1; /* android specific, can be set to any int, won't respect offset and opacity */
`;

const Image = styled.Image`
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 1;
  resize-mode: cover;
`;

export const Cover: FunctionComponent<{
  source: ImageSourcePropType;
  style?: ViewStyle;
}> = ({source, style}) => {
  return (
    <Shadow style={style}>
      <Image source={source} />
    </Shadow>
  );
};
