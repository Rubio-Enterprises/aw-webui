<template lang="pug">
div
  h3 {{ $t('timespiral.title') }}
  b-alert(show, variant="warning")
    | {{ $t('timespiral.wip') }}

  div(v-if="!bucketId")
    p.text-muted
      | {{ $t('timespiral.noAfkBucket') }}
      | #[a(href="https://docs.activitywatch.net/en/latest/watchers.html") aw-watcher-afk]
      | {{ $t('timespiral.noAfkBucketSuffix') }}
  div(v-else)
    p.small.text-muted {{ $t('timespiral.bucketLabel') }} #[code {{ bucketId }}] &middot; {{ $t('timespiral.eventsLabel') }} {{ events.length }}
    Timespiral(:events="events")
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { IEvent } from '~/util/interfaces';
import { useBucketsStore } from '~/stores/buckets';
import Timespiral from '~/visualizations/Timespiral.vue';

export default defineComponent({
  name: 'TimespiralView',
  components: {
    Timespiral,
  },
  data() {
    return {
      events: [] as IEvent[],
      bucketId: '',
    };
  },
  async mounted() {
    const bucketStore = useBucketsStore();
    await bucketStore.ensureLoaded();
    const [firstHost] = bucketStore.hosts;
    const [afkBucket] = firstHost === undefined ? [] : bucketStore.bucketsAFK(firstHost);
    if (afkBucket === undefined) {
      console.warn("Couldn't find suitable bucket");
      return;
    }
    this.bucketId = afkBucket;

    // Show the last week by default. Previously hard-coded to 2022-08-08
    // which left most users staring at an empty chart.
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const bucket = await bucketStore.getBucketWithEvents({
      id: this.bucketId,
      start,
    });
    this.events = bucket.events ?? [];
    console.log('Retrieved events:', this.events);
    console.log('First/last event:', this.events[0], this.events[this.events.length - 1]);
  },
});
</script>
