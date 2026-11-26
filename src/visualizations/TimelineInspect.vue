<template lang="pug">
div
</template>

<style scoped lang="scss">
svg {
  border: 1px solid #999;
  border-radius: 0.5em;
}
</style>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { IEvent } from '~/util/interfaces';
// NOTE: This is just a Vue.js component wrapper for timeline.ts
//       Code should generally go in the framework-independent file.

import timeline from './timeline';

export default defineComponent({
  name: 'aw-timeline',
  props: {
    chunks: { type: Array as PropType<IEvent[] | null> },
    show_afk: { type: Boolean },
    chunkfunc: { type: Function as PropType<(event: IEvent) => string> },
    eventfunc: { type: Function as PropType<(subevent: IEvent) => string> },
  },
  watch: {
    chunks: function () {
      this.update();
    },
    show_afk: function () {
      this.update();
    },
  },
  mounted: function () {
    timeline.create(this.$el as HTMLElement);
    this.update();
  },
  methods: {
    update: function () {
      const el = this.$el as HTMLElement;
      if (this.chunks == null) {
        timeline.set_status(el, this.$t('common.loading') as string);
      } else if (this.chunkfunc && this.eventfunc) {
        timeline.update(
          el,
          this.chunks,
          this.show_afk,
          this.chunkfunc,
          this.eventfunc,
          this.$t('visualizations.noData') as string,
        );
      }
    },
  },
});
</script>
