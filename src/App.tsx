import 'react-native-gesture-handler';
import React, {
  useReducer,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
  FunctionComponent,
  Dispatch,
} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from '@apollo/react-hooks';
import {enableScreens} from 'react-native-screens';
import {createNativeStackNavigator} from 'react-native-screens/native-stack';

import {MainStackParamList} from 'navigation';
import {ShowsScreen} from 'screens/shows';
import {ShowScreen} from 'screens/show';
import {PlayerComponent} from 'components/player';
import {
  StateContext,
  stateReducer,
  INITIAL_STATE,
  playbackStateReducer,
  INITIAL_PLAYBACK_STATE,
  PlaybackStateContext,
  PlaybackState,
} from 'state';
import {DatabaseContext, Database} from 'db';
import {PlaybackAction, UpdatePlayerStatus, StopPlayer} from 'actions';
import {
  DownloadContext,
  downloadStateReducer,
  INITIAL_DOWNLOAD_STATE,
} from 'download';

Icon.loadFont();

enableScreens();
const MainStack = createNativeStackNavigator<MainStackParamList>();
function MainStackScreen() {
  return (
    <MainStack.Navigator
      initialRouteName="Shows"
      screenOptions={{
        gestureEnabled: false,
        headerStyle: {
          backgroundColor: 'rgb(245, 26, 0)',
        },
        headerTintColor: 'white',
      }}>
      <MainStack.Screen
        name="Shows"
        component={ShowsScreen}
        options={{title: 'Radio Deejay'}}
      />
      <MainStack.Screen
        name="Show"
        component={ShowScreen}
        options={{title: ''}}
      />
    </MainStack.Navigator>
  );
}

const AppInner: FunctionComponent<{
  database: Database;
  playbackState: PlaybackState;
  playbackDispatch: Dispatch<PlaybackAction>;
}> = ({database, playbackState, playbackDispatch}) => {
  const [state, dispatch] = useReducer(stateReducer, {
    ...INITIAL_STATE,
    playbackDispatch,
  });

  const {player} = playbackState;
  useEffect(() => {
    player.setOptions({
      onStatusUpdate: ({loading, position, duration}) => {
        dispatch(new UpdatePlayerStatus(loading, position, duration));
      },
      onPlaybackEnded: () => {
        dispatch(new StopPlayer(false));
      },
    });
  }, [player]);

  const client = useRef(
    new ApolloClient({
      uri:
        'https://nxgg2qrpibfttmusvaqfocal4e.appsync-api.ap-southeast-2.amazonaws.com/graphql',
      headers: {
        'x-api-key': 'da2-b47wm53ppbaq3bezhuzzfpfskq',
      },
    }),
  );

  const [downloadState, downloadDispatch] = useReducer(
    downloadStateReducer,
    INITIAL_DOWNLOAD_STATE,
  );
  return useMemo(() => {
    console.log('state changed, re-rendering app');

    return (
      <DownloadContext.Provider
        value={{state: downloadState, dispatch: downloadDispatch}}>
        <DatabaseContext.Provider value={{db: database}}>
          <StateContext.Provider value={{state, dispatch}}>
            <ApolloProvider client={client.current}>
              <NavigationContainer>
                <MainStackScreen />
              </NavigationContainer>
              {state.player.visible && <PlayerComponent />}
            </ApolloProvider>
          </StateContext.Provider>
        </DatabaseContext.Provider>
      </DownloadContext.Provider>
    );
  }, [database, downloadState, downloadDispatch, state, dispatch]);
};

export default function App() {
  const [db, setDatabase] = useState<Database | undefined>(undefined);
  useEffect(() => {
    Database.open().then((d) => setDatabase(d));
  }, []);

  const [playbackState, playbackDispatch] = useReducer(
    playbackStateReducer,
    INITIAL_PLAYBACK_STATE,
  );

  const playDispatch = useCallback(
    (action) => {
      return setTimeout(() => playbackDispatch(action), 0);
    },
    [playbackDispatch],
  );

  const player = playbackState.player;
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  useEffect(() => {
    player.init().then(() => {
      setPlayerReady(true);
    });

    return () => {
      if (player) {
        player.stop();
      }
    };
  }, [player, setPlayerReady]);

  if (!playerReady) {
    return null;
  }

  if (db === undefined) {
    return null;
  }

  return (
    <PlaybackStateContext.Provider value={playbackState}>
      <AppInner
        database={db}
        playbackState={playbackState}
        playbackDispatch={playDispatch}
      />
    </PlaybackStateContext.Provider>
  );
}
