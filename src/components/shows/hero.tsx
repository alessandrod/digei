import React, {FunctionComponent, useContext} from 'react';
import {Linking} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {BlurView, VibrancyView} from '@react-native-community/blur';
import {Show, StateContext} from 'state';
import {tokenizeDescription} from 'utils';
import {LivePlayPause} from 'components/player/controls';

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

const LiveCallOutView = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

const LiveCallOutLeft = styled.View`
  flex: 1 0;
`;
const LiveCallOutRight = styled(VibrancyView)`
  flex-direction: row;
  align-items: center;
  margin: 15px 15px 10px 0;
`;

const LiveCallOutRightInner = styled.View`
  flex-direction: row;
  align-items: center;
  border: 2px rgb(245, 26, 0);
  padding: 0 15px;
`;

const LiveCallOutText = styled.Text`
  ${human.headlineObject as any};
  color: rgb(245, 26, 0);
`;

const LiveCallOut: FunctionComponent = () => {
  return (
    <LiveCallOutView>
      <LiveCallOutLeft />
      <LiveCallOutRight blurType="xlight">
        <LiveCallOutRightInner>
          <LiveCallOutText>Ora in onda</LiveCallOutText>
          <LivePlayPause />
        </LiveCallOutRightInner>
      </LiveCallOutRight>
    </LiveCallOutView>
  );
};

export const ShowHero: FunctionComponent<{show: Show}> = ({show}) => {
  const {name, cover, description} = show;
  const {
    state: {liveShow},
  } = useContext(StateContext);
  const live = show.url === liveShow?.url;
  return (
    <ShowView>
      <ShowImage source={cover}>
        {live && <LiveCallOut />}
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
