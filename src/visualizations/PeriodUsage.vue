<template lang="pug">
svg
</template>

<style scoped lang="scss">
@import '../style/globals';

svg {
  width: 100%;
  height: 40pt;
  border: 1px solid $lightBorderColor;
  border-radius: 0.5em;
}
</style>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

// NOTE: This is just a Vue.js component wrapper for periodusage.ts
//       Code should generally go in the framework-independent file.

import type { IEvent } from '~/util/interfaces';
import type { TimePeriod } from '~/util/timeperiod';
import periodusage from './periodusage';

export default defineComponent({
  name: 'aw-periodusage',
  props: {
    periodusage_arr: {
      type: Array as PropType<{ period: TimePeriod; events: IEvent[] }[]>,
      default: () => [],
    },
  },
  watch: {
    periodusage_arr: function () {
      periodusage.update(
        this.$el as SVGElement,
        this.periodusage_arr,
        this.onPeriodClicked,
        this.chartLabels(),
      );
    },
  },
  mounted: function () {
    // This component's root element is the <svg>
    periodusage.create(this.$el as SVGElement);
    periodusage.update(
      this.$el as SVGElement,
      this.periodusage_arr,
      this.onPeriodClicked,
      this.chartLabels(),
    );
  },
  methods: {
    chartLabels(): { noData: string; today: string } {
      return {
        noData: this.$t('visualizations.noData') as string,
        today: this.$t('common.today') as string,
      };
    },
    onPeriodClicked: function (period: TimePeriod) {
      this.$emit('update', period);
    },
  },
});
</script>
