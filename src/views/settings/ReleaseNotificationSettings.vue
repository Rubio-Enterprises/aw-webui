<template lang="pug">
div
  div.d-flex.justify-content-between.align-items-center
    div
      h5.mb-0 {{ $t('settings.releaseNotification.title') }}
    div
      b-form-checkbox(v-model="isEnabled" switch)
  small.text-muted
    | {{ $t('settings.releaseNotification.help') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useSettingsStore } from '~/stores/settings';

export default defineComponent({
  computed: {
    isEnabled: {
      get() {
        const settingsStore = useSettingsStore();
        return settingsStore.newReleaseCheckData.isEnabled;
      },
      set(value: boolean) {
        const settingsStore = useSettingsStore();
        const data = settingsStore.newReleaseCheckData;
        settingsStore.update({
          newReleaseCheckData: { ...data, isEnabled: value },
        });
      },
    },
  },
});
</script>
