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
import {PlaybackAction, UpdatePlayerStatus, PlayerFinished} from 'actions';

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
  db: Database;
  playbackState: PlaybackState;
  playbackDispatch: Dispatch<PlaybackAction>;
}> = ({db, playbackState, playbackDispatch}) => {
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
        dispatch(new PlayerFinished());
      },
    });
  }, [player]);
  const onSeek = useCallback(
    (pos) => {
      player.seek(pos);
    },
    [player],
  );

  const client = useRef(
    new ApolloClient({
      uri:
        'https://nxgg2qrpibfttmusvaqfocal4e.appsync-api.ap-southeast-2.amazonaws.com/graphql',
      headers: {
        'x-api-key': 'da2-b47wm53ppbaq3bezhuzzfpfskq',
      },
    }),
  );

  return useMemo(() => {
    console.log('state changed, re-rendering app');

    return (
      <DatabaseContext.Provider value={db}>
        <StateContext.Provider value={{state, dispatch}}>
          <ApolloProvider client={client.current}>
            <NavigationContainer>
              <MainStackScreen />
            </NavigationContainer>
            {state.player.visible && <PlayerComponent onSeek={onSeek} />}
          </ApolloProvider>
        </StateContext.Provider>
      </DatabaseContext.Provider>
    );
  }, [db, state, dispatch, onSeek]);
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
        db={db}
        playbackState={playbackState}
        playbackDispatch={playbackDispatch}
      />
    </PlaybackStateContext.Provider>
  );
}
