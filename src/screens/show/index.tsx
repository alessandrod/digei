import React, {FunctionComponent, useCallback} from 'react';
import {StatusBar, Text} from 'react-native';
import {useQuery} from '@apollo/react-hooks';
import {gql, NetworkStatus} from 'apollo-boost';

import {RouteProp, NavigationProp} from 'navigation';
import {Episode} from 'state';
import {EpisodeList} from 'screens/show/episode-list';

const EPISODES_QUERY = gql`
  query Episodes($showName: String!, $nextToken: String) {
    episodes(showName: $showName, nextToken: $nextToken) {
      nextToken
      episodes {
        url
        title
        date
        duration
        media {
          url
        }
      }
    }
  }
`;

type QueryResult = {
  episodes: {episodes: Episode[]; nextToken: String; __typename: String};
};

export const ShowScreen: FunctionComponent<{
  route: RouteProp<'Show'>;
  navigation: NavigationProp<'Show'>;
}> = ({route}) => {
  let {show, meta} = route.params;

  const {loading, error, networkStatus, data, fetchMore, refetch} = useQuery(
    EPISODES_QUERY,
    {
      variables: {showName: show.name, nextToken: null},
      notifyOnNetworkStatusChange: true,
    },
  );

  const onRefresh = useCallback(() => {
    refetch({showName: show.name, nextToken: null});
  }, [refetch, show]);

  const onEndReached = useCallback(() => {
    const nextToken = data?.episodes?.nextToken;
    if (nextToken === null || loading) {
      return;
    }
    fetchMore({
      query: EPISODES_QUERY,
      variables: {showName: show.name, nextToken},
      updateQuery: (prevResult: QueryResult, {fetchMoreResult}) => {
        fetchMoreResult = fetchMoreResult as QueryResult;
        const {episodes: prevEpisodes, __typename} = prevResult.episodes;
        const {
          episodes: newEpisodes,
          nextToken: newNextToken,
        } = fetchMoreResult.episodes;
        return {
          episodes: {
            nextToken: newNextToken,
            episodes: [...prevEpisodes, ...newEpisodes],
            __typename,
          },
        };
      },
    });
  }, [show, data, loading, fetchMore]);

  if (error) {
    return <Text>Error {error}</Text>;
  }

  if (data === undefined) {
    return null;
  }

  const {episodes} = data.episodes;

  return (
    <>
      <StatusBar barStyle="light-content" />
      <EpisodeList
        show={show}
        episodes={episodes as Episode[]}
        episodeMetas={meta}
        refreshing={networkStatus === NetworkStatus.refetch}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
      />
    </>
  );
};
