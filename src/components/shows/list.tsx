import React, {FunctionComponent, useContext, useMemo} from 'react';
import styled from 'styled-components/native';
import {NavigationProp} from 'navigation';
import {SectionListData, SectionList, ActivityIndicator} from 'react-native';

import {SectionHeaderView, SectionHeaderText} from 'components/section-list';
import {ListSeparator} from 'components';
import {LiveShow} from 'components/shows/live';
import {ShowCover} from 'components/shows/cover';
import {Show, StateContext, LIVE_URL, PlayState} from 'state';
import {PlayPause} from 'components/player/controls';
import {ToggleLive} from 'actions';

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

const LivePlayPause = styled(PlayPause)`
  font-size: 40px;
  color: rgb(245, 26, 0);
`;

const LiveLoading = styled(ActivityIndicator)`
  transform: scale(1.5);
  margin-right: 10px;
`;

const LiveHeader: FunctionComponent = () => {
  const {
    state: {
      player: {state: playerState, loading, media},
    },
    dispatch,
  } = useContext(StateContext);
  return (
    <SectionHeaderView>
      <SectionHeaderText>Ora in onda</SectionHeaderText>
      {loading && <LiveLoading />}
      {!loading && (
        <LivePlayPause
          playState={media?.url === LIVE_URL ? playerState : PlayState.STOPPED}
          onPress={() => {
            dispatch(new ToggleLive());
          }}
        />
      )}
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

const Footer = styled.View`
  height: 70px;
`;

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
    <SectionList
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
      ListFooterComponent={() => <Footer />}
      stickySectionHeadersEnabled={false}
      keyExtractor={(item) => item[0].url}
      sections={sections}
    />
  );
};
