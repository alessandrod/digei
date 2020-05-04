import React, {useContext, FunctionComponent, useEffect, Dispatch} from 'react';
import {StatusBar, SafeAreaView} from 'react-native';
import {gql} from 'apollo-boost';
import {useQuery} from '@apollo/react-hooks';
import {Text} from 'react-native';

import {ShowList} from 'components/shows/list';
import {BaseView} from 'components';
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
    return <Text>loading...</Text>;
  }

  const shows = data.shows as Show[];
  if (shows !== state.shows) {
    dispatch(new SetShows(shows));
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        <BaseView>
          <ShowList
            shows={shows}
            liveShow={state.live_show}
            navigation={navigation}
          />
        </BaseView>
      </SafeAreaView>
    </>
  );
};
