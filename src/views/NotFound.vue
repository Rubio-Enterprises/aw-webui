<template lang="pug">
div
  h3 {{ $t('notFound.title') }}
  p.mb-0
    | {{ $t('notFound.hint') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  name: 'NotFound',
});
</script>
