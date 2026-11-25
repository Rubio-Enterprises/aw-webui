import type { IBucket, IEvent } from './interfaces';

export interface IndexedEvent {
  id: string;
  bucket: IBucket;
  event: IEvent & { id?: number };
  start: number;
  end: number;
  members?: IndexedEvent[];
}

function groupTimelineEntries(entries: IndexedEvent[], threshold: number): IndexedEvent[] {
  const grouped: IndexedEvent[] = [];
  let members: IndexedEvent[] = [];
  const flush = () => {
    const [first] = members;
    const last = members[members.length - 1];
    if (first !== undefined && last !== undefined && members.length > 1) {
      grouped.push({
        ...first,
        id: JSON.stringify([first.bucket.id, 'group', members.map((item) => item.id)]),
        event: {
          ...first.event,
          duration: members.reduce((total, item) => total + item.event.duration, 0),
          data: {},
        },
        end: last.end,
        members,
      });
    } else if (first !== undefined) {
      grouped.push(first);
    }
    members = [];
  };
  // Process barriers before valid intervals at the same timestamp.
  entries.sort(
    (a, b) =>
      a.start - b.start ||
      Number(a.event.duration > 0 && Number.isFinite(a.end)) -
        Number(b.event.duration > 0 && Number.isFinite(b.end)),
  );
  for (const item of entries) {
    // Invalid intervals still split runs, even though they cannot be rendered.
    if (!Number.isFinite(item.end) || item.event.duration <= 0) {
      flush();
      continue;
    }
    if (item.event.duration >= threshold) {
      flush();
      grouped.push(item);
      continue;
    }
    // Date truncates microsecond timestamps to milliseconds, while durations retain
    // their precision. Treat differences below that resolution as adjacent.
    const lastMember = members[members.length - 1];
    if (lastMember !== undefined && Math.abs(item.start - lastMember.end) >= 1) flush();
    members.push(item);
    if (item.end - (members[0] ?? item).start >= threshold * 1000) flush();
  }
  flush();
  return grouped;
}

export function indexTimelineEvents(
  buckets: IBucket[],
  filterShort: boolean | ((bucket: IBucket) => boolean) = true,
  displayEvent: (bucketId: string, event: IEvent) => IEvent = (_bucketId, event) => event,
  groupingSeconds: number | ((bucket: IBucket) => number) = 0,
  expandedGroups: readonly string[] = [],
) {
  const entries: IndexedEvent[] = [];
  const expanded = expandedGroups.length ? new Set(expandedGroups) : undefined;
  for (const bucket of buckets) {
    const dropShort = typeof filterShort === 'function' ? filterShort(bucket) : filterShort;
    const threshold =
      typeof groupingSeconds === 'function' ? groupingSeconds(bucket) : groupingSeconds;
    const group = Number.isFinite(threshold) && threshold > 0;
    const bucketEntries: IndexedEvent[] = group ? [] : entries;
    let invalidTimestamp = false;
    (bucket.events || []).forEach((sourceEvent, index) => {
      const event = displayEvent(bucket.id, sourceEvent);
      if (dropShort && event.duration <= 1) return;
      const start = new Date(event.timestamp).getTime();
      const end = start + event.duration * 1000;
      if (!Number.isFinite(start)) {
        invalidTimestamp = true;
        return;
      }
      if (!(group || Number.isFinite(end))) return;
      bucketEntries.push({
        id: JSON.stringify([bucket.id, event.id ?? [event.timestamp, index]]),
        bucket,
        event,
        start,
        end,
      });
    });
    if (!group) continue;
    // An invalid timestamp cannot be placed safely between chronological members.
    const grouped = !invalidTimestamp
      ? groupTimelineEntries(bucketEntries, threshold)
      : bucketEntries.filter((item) => Number.isFinite(item.end) && item.event.duration > 0);
    for (const item of grouped) {
      if (item.members && expanded?.has(item.id)) {
        for (const member of item.members) entries.push(member);
      } else entries.push(item);
    }
  }
  entries.sort((a, b) => a.start - b.start);
  let maxEnd = -Infinity;
  const ends = entries.map((e) => (maxEnd = Math.max(maxEnd, e.end)));
  return { entries, ends, groups: new Set(entries.map((item) => item.bucket.id)) };
}

// Prefix maximum ends keep events that begin before the viewport but overlap it.
export function visibleTimelineEvents(
  index: ReturnType<typeof indexTimelineEvents>,
  start: number,
  end: number,
): IndexedEvent[] {
  let low = 0;
  let high = index.ends.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    const endAtMid = index.ends[mid];
    if (endAtMid !== undefined && endAtMid < start) low = mid + 1;
    else high = mid;
  }
  const result: IndexedEvent[] = [];
  for (let i = low; i < index.entries.length; i++) {
    const entry = index.entries[i];
    if (entry === undefined || entry.start > end) break;
    if (entry.end >= start) result.push(entry);
  }
  return result;
}

// DataSet updates notify vis-timeline. Avoid notifications for unchanged items.
type DatasetId = string | number;

/** The part of a vis-data DataSet that syncTimelineData uses. */
export interface SyncableDataset<T extends { id?: DatasetId }> {
  getIds(): DatasetId[];
  get(id: DatasetId): T | null;
  remove(ids: DatasetId[]): unknown;
  update(items: T[]): unknown;
}

export function syncTimelineData<T extends { id?: DatasetId }>(
  dataset: SyncableDataset<T>,
  next: (T & { id: DatasetId })[],
): void {
  const ids = new Set(next.map((item) => item.id));
  const removed = dataset.getIds().filter((id) => !ids.has(id));
  if (removed.length) dataset.remove(removed);
  const changed = next.filter((item) => {
    const previous = dataset.get(item.id);
    return (
      !previous ||
      Object.keys(item).some((key) => Reflect.get(item, key) !== Reflect.get(previous, key))
    );
  });
  if (changed.length) dataset.update(changed);
}
