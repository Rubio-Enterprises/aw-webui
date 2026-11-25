import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import NewReleaseNotification from '~/components/NewReleaseNotification.vue';
import { useSettingsStore } from '~/stores/settings';
import { createClient } from '~/util/awclient';
import { withVm } from '../helpers/vue';

interface ReleaseVm {
  currentVersion: string | null;
  latestVersion: string | null;
  cleanVersionTag: (tag: string) => string;
  getHasNewRelease: () => boolean;
}

describe('hasNewRelease method', () => {
  createTestingPinia();
  const { vm } = withVm<ReleaseVm>(shallowMount(NewReleaseNotification));
  createClient();

  test('should clean and compare version tags properly', () => {
    vm.currentVersion = vm.cleanVersionTag('v0.8.0');
    vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    expect(vm.getHasNewRelease()).toBe(true);

    vm.currentVersion = vm.cleanVersionTag('v0.8.0 (rust)');
    vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    expect(vm.getHasNewRelease()).toBe(true);

    vm.currentVersion = vm.cleanVersionTag('  v0.8.0 (rust)');
    vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    expect(vm.getHasNewRelease()).toBe(true);

    vm.currentVersion = vm.cleanVersionTag('v0.9.1 (rust)');
    vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    expect(vm.getHasNewRelease()).toBe(true);

    vm.currentVersion = vm.cleanVersionTag('v0.9.2 (rust)');
    vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    expect(vm.getHasNewRelease()).toBe(false);

    // vm.currentVersion = vm.cleanVersionTag('v0.8.dev+c6433ea');
    // vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    // expect(vm.getHasNewRelease()).toBe(true);

    // vm.currentVersion = vm.cleanVersionTag('v0.8.0b1');
    // vm.latestVersion = vm.cleanVersionTag('v0.9.2');
    // expect(vm.getHasNewRelease()).toBe(true);
  });
});

describe('disabling the release check (strict-typing regression)', () => {
  test('hides the reminder, shows the follow-up and saves the setting', async () => {
    createTestingPinia();
    const settingsStore = useSettingsStore();
    const { vm } = withVm<{
      isVisible: boolean;
      isFollowUpVisible: boolean;
      disableCheck: () => Promise<void> | void;
    }>(shallowMount(NewReleaseNotification));
    vm.isVisible = true;

    // The handler used to call a saveData() method that no longer exists
    await vm.disableCheck();

    expect(vm.isVisible).toBe(false);
    expect(vm.isFollowUpVisible).toBe(true);
    expect(settingsStore.update).toHaveBeenCalledWith({
      newReleaseCheckData: expect.objectContaining({ isEnabled: false }),
    });
  });
});
