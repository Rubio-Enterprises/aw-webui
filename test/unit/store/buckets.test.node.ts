import { createPinia, setActivePinia } from 'pinia';

import { useBucketsStore } from '~/stores/buckets';
import { useServerStore } from '~/stores/server';
import { createClient, getClient } from '~/util/awclient';
import type { IBucket } from '~/util/interfaces';

function bucket(partial: Partial<IBucket> & { id: string }): IBucket {
  return {
    hostname: 'erb-m2',
    type: 'currentwindow',
    data: {},
    last_updated: new Date('2026-09-16T00:00:00Z'),
    first_seen: new Date('2026-09-16T00:00:00Z'),
    ...partial,
  } as IBucket;
}

describe('bucketsByDevice', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useServerStore().$patch({
      info: {
        hostname: 'erb-m2',
        device_id: 'local-uuid',
        version: '0.14.0',
        testing: true,
      },
    });
  });

  test('falls back to hostname when data.device_id is missing', () => {
    const store = useBucketsStore();
    store.update_buckets([bucket({ id: 'aw-watcher-window_erb-m2' })]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.hostname).toBe('erb-m2');
    expect(device.device_id).toBe('erb-m2');
    expect(device.device_ids).toEqual(['erb-m2']);
    expect((device as { id?: string }).id).toBeUndefined();
  });

  test('exposes data.device_id when it differs from hostname', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({
        id: 'aw-watcher-window_erb-m2',
        data: { device_id: 'dev-uuid-1' },
      }),
    ]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.hostname).toBe('erb-m2');
    expect(device.device_id).toBe('dev-uuid-1');
    expect(device.hostname !== device.device_id).toBe(true);
    expect((device as { id?: string }).id).toBeUndefined();
  });

  test('prefers real UUID over hostname fallback in mixed group', () => {
    // A group where one bucket has no data.device_id (falls back to hostname)
    // and another has a real UUID. The group device_id must be the UUID so
    // the Buckets view label is visible (hostname !== device_id guard).
    const store = useBucketsStore();
    store.update_buckets([
      // Older bucket without device_id — would produce hostname fallback
      bucket({ id: 'aw-watcher-afk_erb-m2', type: 'afkstatus' }),
      // Newer bucket with a real UUID
      bucket({
        id: 'aw-watcher-window_erb-m2',
        data: { device_id: 'real-uuid-xyz' },
      }),
    ]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.hostname).toBe('erb-m2');
    expect(device.device_id).toBe('real-uuid-xyz');
    expect(device.hostname !== device.device_id).toBe(true);
  });

  test('hostname fallback loses to real UUID even when data.hostname differs in case', () => {
    // Regression guard: the UUID-vs-hostname comparison must be
    // case-insensitive against every hostname in the group.
    const store = useBucketsStore();
    store.update_buckets([
      bucket({
        id: 'aw-watcher-afk_erb-m2',
        type: 'afkstatus',
        data: { hostname: 'ERB-M2' }, // case-mismatched data.hostname
      }),
      bucket({
        id: 'aw-watcher-window_erb-m2',
        data: { device_id: 'real-uuid-xyz' },
      }),
    ]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.device_id).toBe('real-uuid-xyz');
    expect(device.hostname !== device.device_id).toBe(true);
  });

  test('UUID-shaped device_id wins even over a non-group hostname-like id', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({
        id: 'aw-watcher-afk_erb-m2',
        type: 'afkstatus',
        data: { device_id: 'other-host' }, // hostname-like, but not this group's hostname
      }),
      bucket({
        id: 'aw-watcher-window_erb-m2',
        data: { device_id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' },
      }),
    ]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.device_id).toBe('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
  });

  test('collects several device_ids on the same host', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({
        id: 'aw-watcher-window_erb-m2',
        data: { device_id: 'uuid-a' },
      }),
      bucket({
        id: 'aw-watcher-afk_erb-m2',
        type: 'afkstatus',
        data: { device_id: 'uuid-b' },
      }),
    ]);

    const device = Object.values(store.bucketsByDevice)[0];
    expect(device.device_ids).toEqual(expect.arrayContaining(['uuid-a', 'uuid-b']));
    expect(device.device_ids).toHaveLength(2);
  });
});

describe('desktopBucketIds', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('returns the real ids of buckets synced from another device', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({ id: 'aw-watcher-window_erb-m2' }),
      bucket({ id: 'aw-watcher-afk_erb-m2', type: 'afkstatus' }),
      bucket({
        id: 'aw-watcher-window_home-desktop-synced-from-home-desktop',
        hostname: 'home-desktop',
      }),
      bucket({
        id: 'aw-watcher-afk_home-desktop-synced-from-home-desktop',
        hostname: 'home-desktop',
        type: 'afkstatus',
      }),
    ]);

    expect(store.desktopBucketIds('home-desktop')).toEqual({
      bid_window: 'aw-watcher-window_home-desktop-synced-from-home-desktop',
      bid_afk: 'aw-watcher-afk_home-desktop-synced-from-home-desktop',
    });
    expect(store.desktopBucketIds('erb-m2')).toEqual({
      bid_window: 'aw-watcher-window_erb-m2',
      bid_afk: 'aw-watcher-afk_erb-m2',
    });
  });

  test('falls back to the conventional ids when no bucket is loaded', () => {
    const store = useBucketsStore();
    expect(store.desktopBucketIds('laptop')).toEqual({
      bid_window: 'aw-watcher-window_laptop',
      bid_afk: 'aw-watcher-afk_laptop',
    });
  });
});

describe('strict-typing regressions', () => {
  beforeAll(() => {
    createClient();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    useServerStore().$patch({
      info: { hostname: 'erb-m2', device_id: 'local-uuid', version: '0.14.0', testing: true },
    });
  });

  test('bucketsByDevice copes with buckets that have neither device_id nor hostname', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({ id: 'orphan', hostname: undefined, data: {} }),
      bucket({ id: 'aw-watcher-window_erb-m2', data: { device_id: 'real-uuid-xyz' } }),
    ]);
    // Old code: `toLowerCase` of an undefined device id threw while building the group
    const devices = store.bucketsByDevice;
    expect(devices['erb-m2']?.device_id).toBe('real-uuid-xyz');
  });

  test('bucketsByDevice copes with a group whose buckets all lack ids', () => {
    const store = useBucketsStore();
    store.update_buckets([bucket({ id: 'orphan', hostname: undefined, data: {} })]);
    const groups = Object.values(store.bucketsByDevice);
    expect(groups).toHaveLength(1);
    expect(groups[0].device_ids).toEqual([]);
    expect(groups[0].device_id).toBeUndefined();
  });

  test('hosts leaves out buckets that carry no hostname', () => {
    const store = useBucketsStore();
    store.update_buckets([
      bucket({ id: 'orphan', hostname: undefined, data: {} }),
      bucket({ id: 'aw-watcher-window_erb-m2' }),
    ]);
    // toEqual would treat an undefined entry as a match for a missing one
    expect(store.hosts).toHaveLength(1);
    expect(store.hosts).toStrictEqual(['erb-m2']);
  });

  test('getBucketWithEvents rejects an unknown bucket id without querying events', async () => {
    const store = useBucketsStore();
    store.update_buckets([bucket({ id: 'aw-watcher-window_erb-m2' })]);
    // ensureLoaded() skips loading because buckets are present
    const getEvents = jest.spyOn(getClient(), 'getEvents').mockResolvedValue([]);
    await expect(store.getBucketWithEvents({ id: 'does-not-exist' })).rejects.toThrow(
      /does-not-exist/,
    );
    expect(getEvents).not.toHaveBeenCalled();
    getEvents.mockRestore();
  });

  test('getBucketWithEvents returns a copy of a known bucket with its events', async () => {
    const store = useBucketsStore();
    store.update_buckets([bucket({ id: 'aw-watcher-window_erb-m2' })]);
    const events = [{ timestamp: '2026-09-16T00:00:00Z', duration: 1, data: { app: 'x' } }];
    const getEvents = jest
      .spyOn(getClient(), 'getEvents')
      .mockResolvedValue(
        events as unknown as Awaited<ReturnType<ReturnType<typeof getClient>['getEvents']>>,
      );
    const result = await store.getBucketWithEvents({ id: 'aw-watcher-window_erb-m2' });
    expect(result.events).toEqual(events);
    expect(store.getBucket('aw-watcher-window_erb-m2')?.events).toBeUndefined();
    getEvents.mockRestore();
  });
});
