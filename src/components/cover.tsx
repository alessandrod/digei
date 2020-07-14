import React, {FunctionComponent} from 'react';
import {ImageSourcePropType, ViewStyle} from 'react-native';
import styled from 'styled-components/native';

const Shadow = styled.View`
  shadow-color: #000;
  shadow-radius: 2px;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  background: white;
  elevation: 1;
`;

const Image = styled.Image`
  border-radius: 3px;
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
