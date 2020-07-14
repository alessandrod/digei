import React, {FunctionComponent, useContext} from 'react';
import {Linking, Platform, View} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {BlurView} from '@react-native-community/blur';
import {Show, StateContext} from 'state';
import {tokenizeDescription} from 'utils';
import {LivePlayPause} from 'components/player/controls';
import {Centered} from 'components';

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
  border: none; /* this fixes a layout bug in BlurView in android. Without this, the title and the description overlap */
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
const LiveCallOutRight = styled(Platform.OS === 'ios' ? View : View)`
  flex-direction: row;
  align-items: center;
  background: ${Platform.OS === 'ios' ? 'transparent' : 'white'};
  background: rgb(245, 26, 0);
  padding: 4px 0;
`;

const LiveCallOutRightInner = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 0 10px;
`;

const LiveCallOutText = styled.Text`
  ${human.headlineObject as any};
  color: rgb(245, 26, 0);
  color: white;
`;

const PlayPauseContainer = styled(Centered)`
  height: 40px;
  width: 30px;
  margin-left: 5px;
`;

const RedLivePlayPause = styled(LivePlayPause)`
  color: white;
  font-size: 30px;
`;

const BlurWrapper = styled.View`
  overflow: hidden;
`;

const LiveCallOut: FunctionComponent = () => {
  return (
    <LiveCallOutView>
      <LiveCallOutLeft />
      <LiveCallOutRight blurType="xlight">
        <LiveCallOutRightInner>
          <LiveCallOutText>Ora in onda</LiveCallOutText>
          <PlayPauseContainer>
            <RedLivePlayPause />
          </PlayPauseContainer>
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
        <BlurWrapper>
          <BlurView blurType="dark">
            <ShowTextView>
              <ShowTitle>{name}</ShowTitle>
              {description.length > 0 && (
                <ShowDescription text={description.join('\n\n')} />
              )}
            </ShowTextView>
          </BlurView>
        </BlurWrapper>
      </ShowImage>
    </ShowView>
  );
};
