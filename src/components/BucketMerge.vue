<template lang="pug">
div
  h3 {{ $t('ui.bucketMerge.title') }}
  p.small
    | {{ $t('ui.bucketMerge.intro') }}

  // TODO: select which buckets to merge
  b-row
    b-col
      h4 {{ $t('ui.bucketMerge.from') }}
      b-form-select(v-model="bucket_from" :options="buckets" :disabled="buckets.length === 0")
      p.small
        | {{ $t('ui.bucketMerge.fromHelp') }}
      p.small(v-if="events_from !== null")
        | {{ $t('ui.bucketMerge.events') }}: {{ events_from.length }}
    b-col
      h4 {{ $t('ui.bucketMerge.to') }}
      b-form-select(v-model="bucket_to" :options="buckets" :disabled="buckets.length === 0")
      p.small
        | {{ $t('ui.bucketMerge.toHelp') }}
      p.small(v-if="events_to !== null")
        | {{ $t('ui.bucketMerge.events') }}: {{ events_to.length }}

  // TODO: check for overlapping events
  div(v-if="overlappingEvents !== null && overlappingEvents.length > 0")
    h3 {{ $t('ui.bucketMerge.overlapping') }}
    p
      | {{ $t('ui.bucketMerge.overlapFound', { count: overlappingEvents.length }) }}
      ul
        li(v-for="event in overlappingEvents")
          | {{ event[0].start }} - {{ event[0].end }} ({{ event[0].event.id }})
          | {{ $t('ui.bucketMerge.overlapsWith') }}
          | {{ event[1].start }} - {{ event[1].end }} ({{ event[1].event.id }})

  // TODO: confirm dialog
  b-button(variant="success" :disabled="!validate" @click="merge()") {{ $t('ui.bucketMerge.merge') }}

  // TODO: delete old bucket? (ask user to backup their db if they want to be able to restore after delete)
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getClient } from '~/util/awclient';
import { overlappingEvents } from '~/util/transforms';
import type { IEvent } from '~/util/interfaces';
import type { IEvent as AWEvent } from 'aw-client';

export default defineComponent({
  name: 'aw-bucket-merge',
  data() {
    return {
      buckets: [] as { value: string; text: string }[],
      bucket_from: null as string | null,
      bucket_to: null as string | null,
      events_from: null as IEvent[] | null,
      events_to: null as IEvent[] | null,
    };
  },
  computed: {
    validate() {
      const set = this.bucket_from !== null && this.bucket_to !== null;
      const not_same = this.bucket_from !== this.bucket_to;
      const not_overlapping =
        this.overlappingEvents !== null && this.overlappingEvents.length === 0;
      return set && not_same && not_overlapping;
    },
    overlappingEvents() {
      if (this.events_from === null || this.events_to === null) {
        return null;
      }
      return overlappingEvents(this.events_from, this.events_to);
    },
  },
  watch: {
    bucket_from: async function (new_bucket_id: string | null) {
      this.events_from = new_bucket_id === null ? null : await this.getEvents(new_bucket_id);
    },
    bucket_to: async function (new_bucket_id: string | null) {
      this.events_to = new_bucket_id === null ? null : await this.getEvents(new_bucket_id);
    },
  },
  mounted() {
    this.getBuckets();
  },
  methods: {
    merge: async function () {
      const client = getClient();
      const events = this.events_from;
      const bucket_id = this.bucket_to;
      // The merge button is only enabled once both buckets are chosen and loaded
      if (bucket_id === null || events === null) throw new Error('Choose both buckets to merge');
      // The events came from the JSON API, whose timestamps are strings.
      const result = await client.insertEvents(bucket_id, events as unknown as AWEvent[]);
      console.log('result', result);
    },
    getBuckets: async function () {
      const client = getClient();
      const buckets = await client.getBuckets();
      this.buckets = Object.keys(buckets).map((bucket_id) => {
        return { value: bucket_id, text: bucket_id };
      });
    },
    getEvents: async function (bucket_id: string): Promise<IEvent[]> {
      const client = getClient();
      // aw-client types event timestamps as Date, but the JSON response carries ISO strings.
      return (await client.getEvents(bucket_id)) as unknown as IEvent[];
    },
  },
});
</script>
