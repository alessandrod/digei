import React, {FunctionComponent, useContext} from 'react';
import {Linking, Text} from 'react-native';
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

const ShowDescription: FunctionComponent<{text: string}> = ({text}) => {
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

const LiveButtonView = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

const LiveButtonRight = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  background: rgb(245, 26, 0);
  padding: 4px 10px;
`;

const LiveButtonText = styled.Text`
  ${human.headlineObject as any};
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

const LiveButton: FunctionComponent = () => {
  return (
    <LiveButtonView>
      <LiveButtonRight>
        <LiveButtonText>Ora in onda</LiveButtonText>
        <PlayPauseContainer>
          <LivePlay spinnerColor="white" />
        </PlayPauseContainer>
      </LiveButtonRight>
    </LiveButtonView>
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
        {live && <LiveButton />}
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
