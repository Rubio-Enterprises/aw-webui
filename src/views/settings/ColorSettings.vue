<template lang="pug">
div.d-flex.justify-content-between
  div
    h5.mb-0 {{ $t('settings.color.title') }}
    small.text-muted
      | {{ $t('settings.color.help') }}
  div
    b-form-checkbox(v-model="useColorFallback", switch)
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useSettingsStore } from '~/stores/settings';

export default defineComponent({
  name: 'ColorSettings',
  computed: {
    useColorFallback: {
      get: function () {
        const settingsStore = useSettingsStore();
        return settingsStore.useColorFallback;
      },
      set: function (val: boolean) {
        const settingsStore = useSettingsStore();
        settingsStore.update({ useColorFallback: val });
      },
    },
  },
});
</script>
