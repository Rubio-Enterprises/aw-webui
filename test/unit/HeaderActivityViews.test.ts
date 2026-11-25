import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Header from '~/components/Header.vue';
import type { IBucket } from '~/util/interfaces';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve));
const passthroughStub = { template: '<div><slot /></div>' };

let mockBuckets: IBucket[] = [];
jest.mock('~/stores/buckets', () => ({
  useBucketsStore: () => ({
    ensureLoaded: jest.fn().mockResolvedValue(undefined),
    get buckets() {
      return mockBuckets;
    },
  }),
}));

type HeaderVm = { activityViews: { hostname: string; pathUrl: string }[] | null };

describe('Header activity menu (strict-typing regression)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('a bucket without a hostname does not add a device called "undefined"', async () => {
    mockBuckets = [
      { id: 'aw-watcher-window_host1', type: 'currentwindow', hostname: 'host1' },
      { id: 'aw-watcher-afk_host1', type: 'afkstatus', hostname: 'host1' },
      // Imported or hand-made buckets can lack a hostname
      { id: 'orphan-bucket', type: 'custom' },
    ] as IBucket[];

    const wrapper = shallowMount(Header, {
      mocks: { $isAndroid: false, $t: (key: string) => key },
      stubs: {
        'b-navbar': passthroughStub,
        'b-navbar-nav': passthroughStub,
        'b-navbar-brand': passthroughStub,
        'b-navbar-toggle': passthroughStub,
        'b-collapse': passthroughStub,
        'b-nav-item': passthroughStub,
        'b-nav-item-dropdown': passthroughStub,
        'b-dropdown-item': passthroughStub,
        'b-badge': passthroughStub,
        'b-sidebar': true,
        icon: passthroughStub,
      },
    });
    await flushPromises();

    const views = (wrapper.vm as unknown as HeaderVm).activityViews;
    expect(views?.map((v) => v.hostname)).toEqual(['host1']);
  });
});
