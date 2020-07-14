import React, {FunctionComponent} from 'react';
import styled from 'styled-components/native';
import {ActivityIndicator, StyleSheet, ViewStyle} from 'react-native';
import {Episode} from 'state';

import {Colors} from 'theme';
import {formatDateInWords} from 'utils';

export const BaseView = styled.View.attrs(() => ({
  colors: Colors,
}))`
  background-color: white;
  padding: 0 15px;
`;

export const ListSeparator = styled.View`
  border-bottom-color: gainsboro;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
`;

export const episodeTitle = (episode: Episode): String => {
  const {date, title} = episode;
  let titleText;
  if (date) {
    titleText = formatDateInWords(date);
  } else {
    titleText = title;
  }

  return titleText;
};

export const Spinner: FunctionComponent<{
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}> = ({size, color, style}) => {
  return (
    <ActivityIndicator
      size={size ? size : 'small'}
      color={color ? color : 'black'}
      style={style}
    />
  );
};

export const Centered = styled.View`
  justify-content: center;
  align-items: center;
`;
