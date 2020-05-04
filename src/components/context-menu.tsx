import React, {PropsWithChildren} from 'react';
import BaseContextMenu, {
  ContextMenuProps as BaseContextMenuProps,
  ContextMenuAction,
} from 'react-native-context-menu-view';

export interface ContextMenuProps<T extends ContextMenuAction>
  extends Omit<BaseContextMenuProps, 'actions'> {
  actions?: Array<T>;
}

export function ContextMenu<T extends ContextMenuAction>(
  props: PropsWithChildren<ContextMenuProps<T>>,
): JSX.Element {
  return <BaseContextMenu {...props} />;
}

export type {ContextMenuAction} from 'react-native-context-menu-view';
