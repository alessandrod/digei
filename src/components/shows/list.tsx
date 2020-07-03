import React, {FunctionComponent, useMemo} from 'react';
import styled from 'styled-components/native';
import {NavigationProp} from 'navigation';
import {SectionListData, SectionList} from 'react-native';

import {SectionHeaderView, SectionHeaderText} from 'components/section-list';
import {ListSeparator} from 'components';
import {LiveShow} from 'components/shows/live';
import {ShowCover} from 'components/shows/cover';
import {Show} from 'state';
import {LivePlayPause} from 'components/player/controls';

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

const LiveHeader: FunctionComponent = () => {
  return (
    <SectionHeaderView>
      <SectionHeaderText>Ora in onda</SectionHeaderText>
      <LivePlayPause />
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
      ListFooterComponent={() => <Footer />}
      stickySectionHeadersEnabled={false}
      keyExtractor={(item) => item[0].url}
      sections={sections}
    />
  );
};
