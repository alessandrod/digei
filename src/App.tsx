import 'react-native-gesture-handler';
import React, {
  useReducer,
  useRef,
  useEffect,
  MutableRefObject,
  useMemo,
  useCallback,
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
} from 'state';
import {Player} from 'player';
import {DatabaseContext, Database} from 'db';

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

export default function App() {
  const [playbackState, playbackDispatch] = useReducer(
    playbackStateReducer,
    INITIAL_PLAYBACK_STATE,
  );
  const [state, dispatch] = useReducer(stateReducer, {
    ...INITIAL_STATE,
    playbackDispatch,
  });

  const playerRef: MutableRefObject<Player | null> = useRef(null);
  useEffect(() => {
    const player = new Player(dispatch);
    player.init().then(() => {
      playerRef.current = player;
    });
    return () => {
      if (playerRef.current !== null) {
        playerRef.current.stop();
        playerRef.current = null;
      }
    };
  }, []);

  const onSeek = useCallback((pos: number) => {
    if (playerRef.current) {
      playerRef.current.seek(pos);
    }
  }, []);

  const db = useRef<Database | null>(null);
  useEffect(() => {
    Database.open().then((d) => (db.current = d));
  }, []);

  const client = useRef(
    new ApolloClient({
      uri:
        'https://nxgg2qrpibfttmusvaqfocal4e.appsync-api.ap-southeast-2.amazonaws.com/graphql',
      headers: {
        'x-api-key': 'da2-b47wm53ppbaq3bezhuzzfpfskq',
      },
    }),
  );

  return (
    <PlaybackStateContext.Provider value={playbackState}>
      {useMemo(() => {
        console.log('state changed, re-rendering app');

        return (
          <ApolloProvider client={client.current}>
            <DatabaseContext.Provider value={db.current}>
              <StateContext.Provider value={{state, dispatch}}>
                <NavigationContainer>
                  <MainStackScreen />
                </NavigationContainer>
                {state.player.visible && <PlayerComponent onSeek={onSeek} />}
              </StateContext.Provider>
            </DatabaseContext.Provider>
          </ApolloProvider>
        );
      }, [state, dispatch, onSeek])}
    </PlaybackStateContext.Provider>
  );
}
