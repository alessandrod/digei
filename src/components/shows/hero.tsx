import React, {FunctionComponent} from 'react';
import {Text, Linking} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {BlurView} from '@react-native-community/blur';
import {Show} from 'state';
import {tokenizeDescription} from 'utils';

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

const DescriptionText = styled.Text`
  margin-top: 5px;
  ${human.subheadObject as any}
  ${w.light as any};
  color: white;
`;

const Link = styled(DescriptionText)`
  color: rgb(245, 26, 0);
  text-decoration-line: underline;
`;

let ShowDescription: FunctionComponent<{text: string}> = ({text}) => {
  const [pre, num, suff] = tokenizeDescription(text);
  let link = null;
  if (num.length > 0) {
    const [prefix, number] = num.split('/', 2);
    if (prefix && number) {
      link = (
        <Link
          onPress={() =>
            Linking.openURL('https://wa.me/+39' + prefix + number)
          }>
          {prefix + ' '}
          {number}
        </Link>
      );
    }
  }

  return (
    <DescriptionText numberOfLines={8} ellipsizeMode="tail">
      {pre}
      {link}
      {suff}
    </DescriptionText>
  );
};

export const ShowHero: FunctionComponent<{show: Show}> = ({show}) => {
  const {name, cover, description} = show;
  return (
    <ShowView>
      <ShowImage source={cover}>
        <BlurView blurType="dark">
          <ShowTextView>
            <ShowTitle>{name}</ShowTitle>
            {description.length > 0 && (
              <ShowDescription text={description.join('\n\n')} />
            )}
          </ShowTextView>
        </BlurView>
      </ShowImage>
    </ShowView>
  );
};
