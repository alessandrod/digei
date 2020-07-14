import React, {useContext, FunctionComponent, useEffect, Dispatch} from 'react';
import {StatusBar} from 'react-native';
import {gql} from 'apollo-boost';
import {useQuery} from '@apollo/react-hooks';
import {Text} from 'react-native';

import {ShowList} from 'components/shows/list';
import {StateContext, Show} from 'state';
import {RouteProp, NavigationProp} from 'navigation';
import {UpdateLiveShow, SetShows, Action} from 'actions';

const refreshLiveShow = (dispatch: Dispatch<Action>) => {
  fetch('https://www.deejay.it/api/broadcast_airplay/?get=now')
    .then((resp) => {
      return resp.json();
    })
    .then((json) => {
      const {programName} = json.result;
      dispatch(new UpdateLiveShow(programName));
    })
    .catch((err) => {
      console.error('error', err);
    });
};

const QUERY_SHOWS = gql`
  query {
    shows {
      url
      name
      cover {
        uri
      }
      description
      hosts
      sortNum
    }
  }
`;

export const ShowsScreen: FunctionComponent<{
  route: RouteProp<'Shows'>;
  navigation: NavigationProp<'Show'>;
}> = ({navigation}) => {
  const {state, dispatch} = useContext(StateContext);
  const {loading, error, data} = useQuery(QUERY_SHOWS);
  useEffect(() => {
    if (data?.shows === undefined) {
      return;
    }
    refreshLiveShow(dispatch);
    const i = setInterval(() => {
      refreshLiveShow(dispatch);
    }, 30000);
    return () => {
      clearTimeout(i);
    };
  }, [data, dispatch]);

  if (error) {
    return <Text>Error {error}</Text>;
  }
  if (loading) {
    return null;
  }

  const shows = data.shows as Show[];
  const show = shows.find((s) => s?.name === 'Deejay Chiama Italia');
  if (show && !show?.hosts) {
    // HACK: omg what are you doing deejay.it people
    show.hosts = 'Linus e Nicola Savino';
  }
  shows.sort((s1, s2) => s1.sortNum - s2.sortNum);
  if (shows !== state.shows) {
    dispatch(new SetShows(shows));
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ShowList
        shows={shows}
        liveShow={state.liveShow}
        navigation={navigation}
      />
    </>
  );
};
