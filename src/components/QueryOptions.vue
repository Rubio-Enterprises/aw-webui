<template lang="pug">
div
  b-form-group(:label="$t('ui.queryOptions.hostname')" label-cols=2)
    b-form-select(v-model="queryOptionsData.hostname")
      option(v-for="hostname in hostnameChoices")
        | {{hostname}}
  b-form-group(:label="$t('query.start')" label-cols=2)
    input.form-control(type="date" v-model="queryOptionsData.start")
  b-form-group(:label="$t('query.end')" label-cols=2)
    input.form-control(type="date" v-model="queryOptionsData.stop")
  b-form-group(:label="$t('ui.queryOptions.toggles')" label-cols=2)
    b-form-checkbox(type="checkbox" v-model="queryOptionsData.filter_afk" :label="$t('activity.excludeAfk')" description="")
      label {{ $t('ui.queryOptions.excludeAfkHelp') }}
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import moment from 'moment';
import { useBucketsStore } from '~/stores/buckets';
import { preferKnownHostnames } from '~/util/hostnames';

// The options the parent edits; every field is filled in once this has mounted
interface QueryOptionsData {
  hostname: string;
  start: string;
  stop: string;
  filter_afk: boolean;
}

export default defineComponent({
  name: 'QueryOptions',
  props: {
    queryOptions: {
      type: Object as PropType<Partial<QueryOptionsData>>,
    },
  },
  data() {
    return {
      bucketsStore: useBucketsStore(),

      queryOptionsData: {
        hostname: '',
        start: moment().subtract(1, 'day').format('YYYY-MM-DD'),
        stop: moment().add(1, 'day').format('YYYY-MM-DD'),
        filter_afk: true,
      } as QueryOptionsData,
    };
  },

  computed: {
    hostnameChoices(): string[] {
      return preferKnownHostnames(this.bucketsStore.hosts);
    },
  },

  watch: {
    queryOptionsData: {
      handler(value) {
        this.$emit('input', value);
      },
      deep: true,
    },
  },

  async mounted() {
    await this.bucketsStore.ensureLoaded();
    this.queryOptionsData = {
      ...this.queryOptionsData,
      // Without any known host the field stays empty
      hostname: this.hostnameChoices[0] ?? '',
      ...this.queryOptions,
    };
    this.$emit('input', this.queryOptionsData);
  },
});
</script>
