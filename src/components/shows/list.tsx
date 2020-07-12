import React, {FunctionComponent, useMemo, useContext} from 'react';
import styled from 'styled-components/native';
import {NavigationProp} from 'navigation';
import {SectionListData, SectionList, Animated, ViewStyle} from 'react-native';

import {SectionHeaderView, SectionHeaderText} from 'components/section-list';
import {ListSeparator} from 'components';
import {LiveShow} from 'components/shows/live';
import {ShowCover} from 'components/shows/cover';
import {Show, StateContext, PlayState, LIVE_URL} from 'state';
import {LivePlayPause} from 'components/player/controls';
import {
  LoadingBars,
  SmallLoadingBars,
  AnimatedBar,
} from 'components/loading-bars';
import {PlayerPadding} from 'components/player';

interface ShowListData extends SectionListData<Show[]> {
  ListHeaderComponent: FunctionComponent;
  ListFooterComponent?: FunctionComponent;
  ItemComponent: FunctionComponent<{
    show: Show;
    navigation: NavigationProp<'Show'>;
  }>;
}

const ShowContainerView = styled.View`
  flex: 0 0;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding-bottom: 20px;
  /* padding is needed for the shadow, see cover#CoverWrapper */
  padding-left: 2px;
  padding-right: 2px;
`;

const BigLivePlayPause = styled(LivePlayPause)`
  width: 54px;
  height: 60px;
  padding-top: 2px;
  margin-left: 10px;
  color: rgb(245, 26, 0);
  font-size: 54px;
`;

const LiveBar = styled(Animated.View)`
  width: 5px;
  margin-right: 1px;
  height: 20px;
  background: rgb(245, 26, 0);
`;

let LiveLoadingBars: FunctionComponent<{
  playing: boolean;
  style?: ViewStyle;
}> = (props) => {
  const animations: AnimatedBar[] = useMemo(
    () => [
      {from: 16, to: 10, duration: 550},
      {from: 16, to: 2, duration: 500},
      {from: 16, to: 0, duration: 350},
      {from: 16, to: 6, duration: 450},
    ],
    [],
  );

  return (
    <LoadingBars animations={animations} BarComponent={LiveBar} {...props} />
  );
};

LiveLoadingBars = styled(LiveLoadingBars)`
  flex: 1 0;
  margin-left: 10px;
`;

const LiveHeader: FunctionComponent = () => {
  const {
    state: {
      player: {media, state: playState},
    },
  } = useContext(StateContext);
  return (
    <SectionHeaderView>
      <SectionHeaderText>Ora in onda</SectionHeaderText>
      {media?.url === LIVE_URL && (
        <LiveLoadingBars playing={playState === PlayState.PLAYING} />
      )}
      <BigLivePlayPause />
    </SectionHeaderView>
  );
};

const ShowsHeader: FunctionComponent = () => {
  return (
    <SectionHeaderView>
      <SectionHeaderText>Programmi</SectionHeaderText>
    </SectionHeaderView>
  );
};

export function group<T>(n: number, items: T[]): T[][] {
  return items.reduce(
    (accum, item) => {
      let inner: T[] = accum[accum.length - 1];
      if (inner.length === n) {
        inner = [];
        accum.push(inner);
      }
      inner.push(item);
      return accum;
    },
    [[]] as T[][],
  );
}

const List = styled(SectionList)`
  padding: 0 15px;
  background: white;
`;

export const ShowList: FunctionComponent<{
  liveShow?: Show;
  shows: Show[];
  navigation: NavigationProp<'Show'>;
}> = ({liveShow, shows, navigation}) => {
  const sections = useMemo(() => {
    const showPairs: Show[][] = group(2, shows);

    const secs: ShowListData[] = [
      {
        ListHeaderComponent: ShowsHeader,
        ItemComponent: ShowCover,
        data: showPairs,
      },
    ];
    if (liveShow !== undefined) {
      secs.unshift({
        ListHeaderComponent: LiveHeader,
        ListFooterComponent: ListSeparator,
        ItemComponent: LiveShow,
        data: [[liveShow]],
      });
    }

    return secs;
  }, [liveShow, shows]);
  return (
    <List
      renderSectionHeader={({section}) => (
        <section.ListHeaderComponent {...section} />
      )}
      renderSectionFooter={({section}) => {
        if (section.ListFooterComponent) {
          return <section.ListFooterComponent {...section} />;
        }
        return null;
      }}
      renderItem={({item, section}) => {
        if (item.length === 1) {
          return (
            <section.ItemComponent navigation={navigation} show={item[0]} />
          );
        }
        return (
          <ShowContainerView>
            {item.map((i) => {
              return <section.ItemComponent navigation={navigation} show={i} />;
            })}
          </ShowContainerView>
        );
      }}
      ListFooterComponent={() => <PlayerPadding />}
      stickySectionHeadersEnabled={false}
      keyExtractor={(item) => item[0].url}
      sections={sections}
    />
  );
};
