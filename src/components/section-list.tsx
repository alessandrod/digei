import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

export const SectionHeaderView = styled.View`
  flex: 1 0;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const SectionHeaderText = styled.Text`
  ${human.title1Object as any};
  ${w.bold as any};

  padding-top: 10px;
  padding-bottom: 10px;
`;
