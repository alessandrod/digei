import React, {PropsWithChildren, FunctionComponent} from 'react';

import {ContextMenu, ContextMenuAction} from 'components/context-menu';

enum MenuActionType {
  MARK_AS_PLAYED,
  MARK_AS_UNPLAYED,
  DOWNLOAD,
  REMOVE_DOWNLOAD,
  COPY_LINK,
}

interface MenuAction extends ContextMenuAction {
  type: MenuActionType;
}

export const EpisodeContextMenu: FunctionComponent<PropsWithChildren<{
  played: boolean;
  downloading: boolean;
  downloaded: boolean;
  onMarkAsPlayed: (played: boolean) => void;
  onDownload: () => void;
  onRemoveDownload: () => void;
  onCopyLink: () => void;
}>> = ({
  played,
  downloading,
  downloaded,
  onMarkAsPlayed,
  onDownload,
  onRemoveDownload,
  onCopyLink,
  children,
}) => {
  const actions: MenuAction[] = [];
  if (played) {
    actions.push({
      type: MenuActionType.MARK_AS_UNPLAYED,
      title: 'Segna da ascoltare',
      systemIcon: 'checkmark.square',
    });
  } else {
    actions.push({
      type: MenuActionType.MARK_AS_PLAYED,
      title: 'Segna come ascoltato',
      systemIcon: 'checkmark.square',
    });
  }
  if (!downloading) {
    if (!downloaded) {
      actions.push({
        type: MenuActionType.DOWNLOAD,
        title: 'Download',
        systemIcon: 'square.and.arrow.down',
      });
    } else {
      actions.push({
        type: MenuActionType.REMOVE_DOWNLOAD,
        title: 'Rimuovi download',
        systemIcon: 'square.and.arrow.down',
      });
    }
  }
  actions.push({
    type: MenuActionType.COPY_LINK,
    title: 'Copia il link',
    systemIcon: 'link',
  });

  return (
    <ContextMenu
      actions={actions}
      onPress={(e) => {
        const {index} = e.nativeEvent;
        const action = actions[index];

        if (action.type === MenuActionType.MARK_AS_PLAYED) {
          onMarkAsPlayed(true);
        } else if (action.type === MenuActionType.MARK_AS_UNPLAYED) {
          onMarkAsPlayed(false);
        } else if (action.type === MenuActionType.DOWNLOAD) {
          onDownload();
        } else if (action.type === MenuActionType.REMOVE_DOWNLOAD) {
          onRemoveDownload();
        } else if (action.type === MenuActionType.COPY_LINK) {
          onCopyLink();
        }
      }}>
      {children}
    </ContextMenu>
  );
};
