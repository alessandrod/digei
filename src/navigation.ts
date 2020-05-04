import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp as RNRouteProp} from '@react-navigation/native';

import {EpisodeInfo} from 'db';

import {Show} from 'state';

export type MainStackParamList = {
  Shows: undefined;
  Show: {show: Show; info: Map<string, EpisodeInfo>};
};

export type NavigationProp<
  Route extends keyof MainStackParamList
> = StackNavigationProp<MainStackParamList, Route>;

export type RouteProp<Route extends keyof MainStackParamList> = RNRouteProp<
  MainStackParamList,
  Route
>;
