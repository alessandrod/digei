import styled from 'styled-components/native';
import {StyleSheet} from 'react-native';
import {Episode} from 'state';

import {Colors} from 'theme';
import {formatDateInWords} from 'utils';

export const BaseView = styled.View.attrs(() => ({
  colors: Colors,
}))`
  background-color: white;
  padding: 0 15px;
`;

export const ListSeparator = styled.View.attrs(() => ({colors: Colors}))`
  border-bottom-color: ${(p) => p.colors.lighter};
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
