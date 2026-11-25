import { createTestingPinia } from '@pinia/testing';
import { shallowMount, type Wrapper } from '@vue/test-utils';
import type Vue from 'vue';
import HomeComponent from '~/views/Home.vue';
import { optionsApi, withVm } from '../helpers/vue';

const Home = optionsApi(HomeComponent);

describe('Home supporter nudge', () => {
  test('does not show after another tab snoozes during async evaluation', () => {
    const vm = {
      isSupporter: jest.fn().mockReturnValue(false),
      isSupporterNudgeSnoozed: jest.fn().mockReturnValue(true),
      supporterNudgeSrc: '',
      supporterNudgeVisible: false,
    };

    Home.methods.showSupporterNudge.call(vm, 'inapp-tenure');

    expect(vm.supporterNudgeSrc).toBe('');
    expect(vm.supporterNudgeVisible).toBe(false);
  });

  test('hides a visible nudge when another tab snoozes it', () => {
    const listeners: Record<string, (event: StorageEvent) => void> = {};
    const addEventListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type, listener) => {
        listeners[type] = listener as (event: StorageEvent) => void;
      });
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const vm = {
      isSupporter: jest.fn().mockReturnValue(false),
      isSupporterNudgeSnoozed: jest.fn().mockReturnValue(true),
      supporterNudgeVisible: true,
    };

    Home.methods.startSupporterStorageSync.call(vm);
    listeners.storage({ key: 'aw-supporter-nudge-dismissed-until' } as StorageEvent);

    expect(vm.supporterNudgeVisible).toBe(false);

    Home.methods.stopSupporterStorageSync.call(vm);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', listeners.storage);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});

describe('Home subscribe CTA src', () => {
  let wrapper: Wrapper<Vue> | null = null;

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
    }
  });

  function mountHome(isAndroid: boolean) {
    createTestingPinia();
    const mounted = withVm<{ subscribeUrl: string }>(
      shallowMount(HomeComponent, {
        mocks: { $isAndroid: isAndroid },
        stubs: ['b-alert', 'b-button', 'router-link'],
      }),
    );
    wrapper = mounted;
    return mounted;
  }

  function subscribeHref(vmWrapper: Wrapper<Vue>): string {
    const link = vmWrapper
      .findAll('a')
      .wrappers.find((a) => a.text().includes('Support ActivityWatch'));
    expect(link).toBeTruthy();
    return link.attributes('href');
  }

  test('desktop href uses inapp-home', () => {
    const mounted = mountHome(false);
    expect(mounted.vm.subscribeUrl).toBe('https://activitywatch.net/go/?src=inapp-home');
    expect(subscribeHref(mounted)).toBe('https://activitywatch.net/go/?src=inapp-home');
  });

  test('android href uses inapp-home-android', () => {
    const mounted = mountHome(true);
    expect(mounted.vm.subscribeUrl).toBe('https://activitywatch.net/go/?src=inapp-home-android');
    expect(subscribeHref(mounted)).toBe('https://activitywatch.net/go/?src=inapp-home-android');
  });
});
