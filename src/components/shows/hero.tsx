import React, {FunctionComponent} from 'react';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {Colors} from 'theme';
import {BlurView} from '@react-native-community/blur';
import {Show} from 'state';

const ShowView = styled.View`
  flex: 1 0;
  min-width: 100%;
  justify-content: space-between;
`;

const ShowImage = styled.ImageBackground`
  flex: 1 0;
  aspect-ratio: 1;
  width: 100%;
  justify-content: flex-end;
`;

const ShowTextView = styled.View`
  padding: 15px;
`;

const ShowTitle = styled.Text`
  ${human.title2Object as any}
  color: white;
`;

const ShowDescription = styled.Text.attrs(() => ({colors: Colors}))`
  margin-top: 5px;
  ${human.subheadObject as any}
  ${w.light as any};
  color: white;
`;

export const ShowHero: FunctionComponent<{show: Show}> = ({show}) => {
  let {name, cover, description} = show;
  let desc = description.join('\n\n');
  return (
    <ShowView>
      <ShowImage source={cover}>
        <BlurView blurType="dark">
          <ShowTextView>
            <ShowTitle>{name}</ShowTitle>
            {desc !== '' && (
              <ShowDescription numberOfLines={7} ellipsizeMode="tail">
                {desc}
              </ShowDescription>
            )}
          </ShowTextView>
        </BlurView>
      </ShowImage>
    </ShowView>
  );
};
