<template lang="pug">
div
  h3 {{ $t('ui.dev.title') }}
  | {{ $t('ui.dev.intro') }}

  p
  | {{ $t('ui.dev.empty') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'aw-dev',
});
</script>
