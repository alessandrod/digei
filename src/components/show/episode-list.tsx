import React, {FunctionComponent, useMemo} from 'react';
import {SectionList, SectionListData} from 'react-native';
import styled from 'styled-components/native';
import {human} from 'react-native-typography';
import {systemWeights as w} from 'react-native-typography';

import {ListSeparator} from 'components';
import {Show, Episode} from 'state';
import {ShowHero} from 'components/shows/hero';
import {EpisodeMeta} from 'db';
import {EpisodeComponent} from 'components/show/episode';
import {PlayerPadding} from 'components/player';

const MonthHeader = styled.Text`
  ${human.headlineObject as any};
  ${w.bold as any};
  background: ghostwhite;

  padding: 15px;
`;

interface Section extends SectionListData<Episode> {
  month?: String;
}

const List = styled(SectionList)`
  background: white;
`;

export const EpisodeList: FunctionComponent<{
  show: Show;
  episodes: Episode[];
  episodeMetas: Map<string, EpisodeMeta>;
  refreshing: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
}> = ({show, episodes, episodeMetas, refreshing, onRefresh, onEndReached}) => {
  const sections = useMemo(() => {
    console.log('rebuilding sections', episodes.length);
    const months: Section[] = [];
    let monthEpisodes = [];
    let currentMonth = '';
    for (const episode of episodes) {
      if (!episode.date) {
        // HACK: fix actual dates
        continue;
      }
      const month = episodeMonth(episode);
      if (month !== currentMonth) {
        if (monthEpisodes.length > 0) {
          months.push({month: currentMonth, data: monthEpisodes});
        }
        currentMonth = month;
        monthEpisodes = [];
      }

      monthEpisodes.push(episode);
    }
    if (monthEpisodes.length > 0) {
      months.push({month: currentMonth, data: monthEpisodes});
    }
    return months;
  }, [episodes]);

  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    return (
      <List
        ListHeaderComponent={() => <ShowHero show={show} />}
        ListFooterComponent={() => <PlayerPadding />}
        renderSectionHeader={({section: {month}}) => {
          if (month === undefined) {
            return <ShowHero show={show} />;
          }

          let year: number | string = parseInt(month.substring(2), 10);
          if (year === currentYear) {
            year = '';
          }

          month = parseInt(month.substring(0, 2), 10);
          month = MONTHS[month];

          return (
            <MonthHeader>
              {month}
              {' ' + year}
            </MonthHeader>
          );
        }}
        renderItem={({item}) => {
          let meta = episodeMetas.get(item.url);
          if (meta === undefined) {
            meta = {
              url: item.url,
              showUrl: show.url,
              favourite: 0,
              playPosition: 0,
            };
            episodeMetas.set(item.url, meta);
          }
          return (
            <EpisodeComponent show={show} episode={item} episodeMeta={meta} />
          );
        }}
        ItemSeparatorComponent={ListSeparator}
        stickySectionHeadersEnabled={true}
        keyExtractor={(item) => item.url}
        onEndReached={() => onEndReached && onEndReached()}
        sections={sections}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  }, [show, episodeMetas, sections, refreshing, onRefresh, onEndReached]);
};

const episodeMonth = (episode: Episode): string => {
  const date = episode.date;
  const [, m, y] = date.split('/', 3);
  return m + y;
};

const MONTHS = [
  null,
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];
