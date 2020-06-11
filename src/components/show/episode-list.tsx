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

const MonthHeader = styled.Text`
  ${human.headlineObject as any};
  ${w.bold as any};
  background: ghostwhite;

  padding: 15px;
`;

interface Section extends SectionListData<Episode> {
  month?: String;
}

export const EpisodeList: FunctionComponent<{
  show: Show;
  episodes: Episode[];
  episodeMetas: Map<string, EpisodeMeta>;
  onEndReached?: () => void;
}> = React.memo(({show, episodes, episodeMetas, onEndReached}) => {
  console.log('rendering episode list');
  const sections = useMemo(() => {
    const months: Section[] = [{data: [] as Episode[]}];
    let monthEpisodes = [];
    let currentMonth = '';
    for (const episode of episodes) {
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

  return (
    <SectionList
      renderSectionHeader={({section: {month}}) => {
        if (month === undefined) {
          return <ShowHero show={show} />;
        }

        let year: number | string = parseInt(month.substring(2), 10);
        if (year === new Date().getFullYear()) {
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
    />
  );
});

const episodeMonth = (episode: Episode): string => {
  const date = episode.date || '1/1/2049';
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
