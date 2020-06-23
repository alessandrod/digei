import {parse, format} from 'date-fns';
import {it} from 'date-fns/locale';

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
  const {hours: h, minutes: m, seconds: s} = timeFromSeconds(secs);
  const dur = [];
  if (h > 0) {
    dur.push(h + ' hr');
  }
  if (m > 0) {
    dur.push(m + ' min');
  }
  if (dur.length === 0) {
    dur.push(Math.round(s) + ' s');
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
