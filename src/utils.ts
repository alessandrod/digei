import {parse, format} from 'date-fns';
import {it} from 'date-fns/locale';
import {useState} from 'react';

export type Time = {
  hours: number;
  minutes: number;
  seconds: number;
};

export const timeFromSeconds = (seconds: number): Time => {
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor((seconds - hours * 60 * 60) / 60);
  seconds = seconds - minutes * 60 - hours * 60 * 60;

  return {hours, minutes, seconds};
};

export const formatTime = (secs: number): string => {
  const {seconds, hours, minutes} = timeFromSeconds(secs);

  let ret = [];
  if (hours > 0) {
    ret.push(hours.toString());
  }
  ret.push(minutes.toString().padStart(2, '0'));
  ret.push(seconds.toString().padStart(2, '0'));

  return ret.join(':');
};

export const formatTimeMillis = (millis: number): string => {
  return formatTime(Math.floor(millis / 1000));
};

export const formatTimeInWords = (secs: number): string => {
  const {hours: h, minutes: m, seconds: s} = timeFromSeconds(Math.round(secs));
  const dur = [];
  if (h > 0) {
    dur.push(h + (h === 1 ? ' ora' : ' ore'));
  }
  if (m > 0) {
    dur.push(m + (m === 1 ? ' minuto' : ' minuti'));
  }
  if (dur.length === 0) {
    dur.push(s + (s === 1 ? ' secondo' : ' secondi'));
  }
  return dur.join(' ');
};

function capitalize(s: String) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const formatDateInWords = (date: string): string => {
  const d = parse(date, 'dd/MM/yyyy', new Date());
  const text = format(d, 'EEEE d MMMM', {locale: it})
    .split(' ')
    .map((t) => capitalize(t))
    .join(' ');

  return text;
};

export const formatDate = (date: number): string => {
  return format(date, 'dd/MM/yyyy');
};

export const tokenizeDescription = (str: string): string[] => {
  const pos = str.search(/\d{3}\/\d{7}/);
  if (pos === -1) {
    return [str, '', ''];
  }

  const ret = [];
  ret.push(str.substring(0, pos));
  ret.push(str.substring(pos, pos + 11));
  ret.push(str.substring(pos + 11));

  return ret;
};

export const useStableLoading = (loading: boolean) => {
  const [local, setLocal] = useState<{loading: boolean; timerId?: any}>({
    loading,
    timerId: undefined,
  });
  if (!loading) {
    if (local.loading || local.timerId !== undefined) {
      if (local.timerId) {
        clearTimeout(local.timerId);
      }
      setLocal({loading: false, timerId: undefined});
    }
    return false;
  }

  if (!local.loading && local.timerId === undefined) {
    const timerId = setTimeout(
      () => setLocal({loading: true, timerId: undefined}),
      1000,
    );
    setLocal((s) => ({...s, timerId}));
  }

  return local.loading;
};
