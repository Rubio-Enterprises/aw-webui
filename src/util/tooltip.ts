import DOMPurify from 'dompurify';
import _ from 'lodash';
import moment from 'moment';
import type { IEvent } from './interfaces';
import { seconds_to_duration } from './time';

const escapeText = (value: unknown): string => _.escape(value == null ? '' : String(value));

function urlLink(value: unknown): string {
  const text = escapeText(value);
  try {
    const url = new URL(String(value));
    if (['http:', 'https:'].includes(url.protocol)) {
      return `<a href="${escapeText(url.href)}">${text}</a>`;
    }
  } catch {
    // Missing or malformed URLs remain readable as plain text.
  }
  return text;
}

export function buildTooltip(bucket: { type?: string } | null | undefined, e: IEvent): string {
  let inner = 'Unknown bucket type';
  // A bucket with no type, or an event with no data, must still render a
  // tooltip rather than throwing and taking the whole timeline down.
  const data = e?.data || {};
  const type = String(bucket?.type || '');

  // if same day, don't show date
  const startedAt = moment(e.timestamp);
  const stoppedAt = moment(e.timestamp).add(e.duration, 'seconds');
  const timeFormat = startedAt.isSame(stoppedAt, 'day') ? 'HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
  const start = startedAt.format(timeFormat);
  const stop = stoppedAt.format(timeFormat);

  if (type === 'currentwindow') {
    inner = `
      <tr><th>App</th><td>${escapeText(data.app)}</td></tr>
      <tr><th>Title</th><td>${escapeText(data.title)}</td></tr>
      `;
  } else if (type === 'web.tab.current') {
    inner = `
      <tr><th>Title</th><td>${escapeText(data.title)}</td></tr>
      <tr><th>URL</th><td>${urlLink(data.url)}</td></tr>
      `;
  } else if (type.startsWith('app.editor')) {
    inner = `
      <tr><th>Filename</th><td>${escapeText(_.last(String(data.file || '').split('/')))}</td></tr>
      <tr><th>Path</th><td>${escapeText(data.file)}</td></tr>
      <tr><th>Language</th><td>${escapeText(data.language)}</td></tr>
      `;
  } else if (type.startsWith('general.stopwatch')) {
    inner = `
      <tr><th>Label</th><td>${escapeText(data.label)}</td></tr>
      `;
  } else {
    inner = `
      <tr><th>Data</th><td>${escapeText(JSON.stringify(data))}</td></tr>
      `;
  }
  // Escape text in its insertion context, then sanitize the complete markup.
  return DOMPurify.sanitize(`<table>
    <tr></tr>
    <tr><th>Start</th><td>${start}</td></tr>
    <tr><th>Stop</th><td>${stop}</td></tr>
    <tr><th>Duration&nbsp;</th><td>${seconds_to_duration(e.duration)}</td></tr>
    ${inner}
    </table>`);
}
