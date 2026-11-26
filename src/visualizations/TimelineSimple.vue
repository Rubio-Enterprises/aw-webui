<template lang="pug">
svg
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
// NOTE: This is just a Vue.js component wrapper for timeline-simple.js
//       Code should generally go in the framework-independent file.

import timeline_simple from './timeline-simple';

export default defineComponent({
  name: 'aw-timeline',
  props: {
    type: String,
    event_type: String,
    events: Array as PropType<IEvent[]>,
  },
  watch: {
    events: function () {
      if (!this.events || this.event_type === undefined) return;
      timeline_simple.update(
        this.$el as SVGElement,
        this.events,
        this.event_type,
        this.$t('visualizations.noData') as string,
      );
    },
  },
  mounted: function () {
    timeline_simple.create(this.$el as SVGElement);
  },
});
</script>
