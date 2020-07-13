import {
  DownloadResumable,
  createDownloadResumable,
  DownloadResult,
  deleteAsync,
  FileSystemSessionType,
} from 'expo-file-system';
import {
  createContext,
  Dispatch,
  useState,
  useContext,
  useCallback,
} from 'react';

export type Download = {
  handle: DownloadResumable;
  progress: number;
  onProgress?: (download: Download) => void;
  onComplete: (res?: DownloadResult) => void;
};

export type DownloadState = {
  downloads: Map<string, Download>;
};

export class StartDownload {
  constructor(
    public readonly url: string,
    public readonly dest: string,
    public readonly onProgress?: (download: Download) => void,
    public readonly onComplete?: (res?: DownloadResult) => void,
  ) {}
}

export class StopDownload {
  constructor(public readonly url: string, public readonly dest: string) {}
}

type DownloadAction = StartDownload | StopDownload;

const startDownload = (
  state: DownloadState,
  action: StartDownload,
): DownloadState => {
  const {url, dest, onProgress, onComplete} = action;
  const download = {progress: 0, onProgress, onComplete} as Download;
  const handle = createDownloadResumable(
    url,
    dest,
    {sessionType: FileSystemSessionType.BACKGROUND},
    (status) => {
      download.progress =
        status.totalBytesWritten / status.totalBytesExpectedToWrite;
      if (download.onProgress !== undefined) {
        download.onProgress(download);
      }
    },
  );
  download.handle = handle;

  handle.downloadAsync().then((res) => {
    state.downloads.delete(url);
    if (download.onComplete !== undefined) {
      // downloadAsync is supposed to return DownloadResult | undefined but
      // when cancelled, actually returns null.
      download.onComplete(res || undefined);
    }
    return res;
  });

  state.downloads.set(url, download);
  return {...state};
};

const stopDownload = (
  state: DownloadState,
  action: StopDownload,
): DownloadState => {
  const {url, dest} = action;
  const download = state.downloads.get(url);
  if (download === undefined) {
    return state;
  }
  download.handle.pauseAsync().then(() => {
    deleteAsync(dest);
  });

  state.downloads.delete(url);

  return {...state};
};

export function downloadStateReducer(
  state: DownloadState,
  action: DownloadAction,
) {
  if (action instanceof StartDownload) {
    state = startDownload(state, action);
  } else if (action instanceof StopDownload) {
    state = stopDownload(state, action);
  }

  return state;
}

export const INITIAL_DOWNLOAD_STATE = {downloads: new Map()};

export const DownloadContext = createContext<{
  state: DownloadState;
  dispatch: Dispatch<DownloadAction>;
}>({
  state: INITIAL_DOWNLOAD_STATE,
  dispatch: () => {},
});

export const useDownload = (
  url: string,
  dest: string,
  onComplete: (res?: DownloadResult) => void,
) => {
  const {state, dispatch} = useContext(DownloadContext);
  const [dl, setDownload] = useState<{
    download?: Download;
  }>({download: state.downloads.get(url)});

  const onProgress = useCallback((d) => {
    setDownload({download: d});
  }, []);

  const onCompleteWrapper = useCallback(
    (res?: DownloadResult) => {
      setDownload({download: undefined});
      onComplete(res);
    },
    [onComplete],
  );

  if (dl.download !== undefined) {
    dl.download.onProgress = onProgress;
    dl.download.onComplete = onCompleteWrapper;
  }

  const {download} = dl;

  let doStartDownload: Function | undefined = useCallback(() => {
    dispatch(new StartDownload(url, dest, onProgress, onComplete));
  }, [url, dest, dispatch, onProgress, onComplete]);

  let doStopDownload: Function | undefined = useCallback(() => {
    dispatch(new StopDownload(url, dest));
  }, [url, dest, dispatch]);

  if (download === undefined) {
    doStopDownload = undefined;
  } else {
    doStartDownload = undefined;
  }

  return {
    download,
    startDownload: doStartDownload,
    stopDownload: doStopDownload,
  };
};
