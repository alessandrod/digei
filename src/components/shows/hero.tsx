import React, {FunctionComponent, useContext} from 'react';
import {Linking, Platform, View, Text} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';
import Icon from 'react-native-vector-icons/Ionicons';

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
  ${w.semibold as any}
  color: ghostwhite;
`;

const DescriptionText = styled.Text`
  margin-top: 5px;
  ${human.calloutObject as any}
  ${w.light as any}
  color: ghostwhite;
`;

const Link = styled.Text`
  color: #25d366;
  ${w.regular as any}
`;

const WhatsAppLogo = styled(Icon)`
  font-size: 20px;
  color: #25d366;
`;

let ShowDescription: FunctionComponent<{text: string}> = ({text}) => {
  const [pre, num, suff] = tokenizeDescription(text);
  let link = null;
  if (num.length > 0) {
    const [prefix, number] = num.split('/', 2);
    if (prefix && number) {
      link = (
        <Text>
          <WhatsAppLogo name="logo-whatsapp" />
          <Link
            onPress={() =>
              Linking.openURL('https://wa.me/+39' + prefix + number)
            }>
            {` ${prefix} ${number}`}
          </Link>
        </Text>
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
  width: 36px;
  margin-left: 6px;
`;

const LivePlay = styled(LivePlayPause)`
  font-size: 36px;
`;

const BlurWrapper = styled.View`
  overflow: hidden;
`;

const LiveCallOut: FunctionComponent = () => {
  return (
    <LiveCallOutView>
      <LiveCallOutLeft />
      <LiveCallOutRight>
        <LiveCallOutRightInner>
          <LiveCallOutText>Ora in onda</LiveCallOutText>
          <PlayPauseContainer>
            <LivePlay spinnerColor="white" />
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
