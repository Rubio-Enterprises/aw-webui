<template lang="pug">
div
  h3 {{ $t('timeline.title') }}

  input-timeinterval(v-model="daterange", :defaultDuration="timeintervalDefaultDuration", :maxDuration="maxDuration").mb-3

  // Toolbar: filters (primary), display kebab (swimlanes etc.), event count,
  // and keyboard hint. Flex-wrap so it doesn't overlap at narrow widths.
  div.timeline-toolbar.d-flex.flex-wrap.align-items-center
    details.timeline-filters.mr-2(ref="filtersDetails")
      summary.timeline-chip.timeline-chip--clickable
        icon.mr-1(name="filter")
        b {{ $t('ui.timeline.filters') }}: {{ filter_summary }}
      div.timeline-filters-panel.shadow-sm
        table
          tr
            th.pt-2.pr-3
              label(for="timeline-filter-host") {{ $t('ui.timeline.host') }}
            td
              select#timeline-filter-host.form-control.form-control-sm(v-model="filter_hostname")
                option(:value='null') {{ $t('ui.timeline.all') }}
                option(v-for="host in hosts", :value="host") {{ host }}
          tr
            th.pt-2.pr-3
              label(for="timeline-filter-client") {{ $t('ui.timeline.client') }}
            td
              select#timeline-filter-client.form-control.form-control-sm(v-model="filter_client")
                option(:value='null') {{ $t('ui.timeline.all') }}
                option(v-for="client in clients", :value="client") {{ client }}
          tr
            th.pt-2.pr-3
              label(for="timeline-filter-duration") {{ $t('ui.timeline.duration') }}
            td
              select#timeline-filter-duration.form-control.form-control-sm(v-model="filter_duration")
                option(:value='null') {{ $t('ui.timeline.all') }}
                option(:value='2') {{ $t('ui.timeline.seconds', { count: 2 }) }}
                option(:value='5') {{ $t('ui.timeline.seconds', { count: 5 }) }}
                option(:value='10') {{ $t('ui.timeline.seconds', { count: 10 }) }}
                option(:value='30') {{ $t('ui.timeline.seconds', { count: 30 }) }}
                option(:value='1 * 60') {{ $t('ui.timeline.minutes', { count: 1 }) }}
                option(:value='2 * 60') {{ $t('ui.timeline.minutes', { count: 2 }) }}
                option(:value='3 * 60') {{ $t('ui.timeline.minutes', { count: 3 }) }}
                option(:value='10 * 60') {{ $t('ui.timeline.minutes', { count: 10 }) }}
                option(:value='30 * 60') {{ $t('ui.timeline.minutes', { count: 30 }) }}
                option(:value='1 * 60 * 60') {{ $t('ui.timeline.hours', { count: 1 }) }}
                option(:value='2 * 60 * 60') {{ $t('ui.timeline.hours', { count: 2 }) }}
          tr
            th.pt-2.pr-3
              label {{ $t('activity.excludeAfk') }}：
            td
              b-form-checkbox(v-model="filter_afk" size="sm" switch)
                | {{ $t('timeline.filterAfk') }}
          tr
            th.pt-2.pr-3
              label {{ $t('ui.timeline.merge') }}：
            td
              b-form-checkbox(v-model="filter_merge_similar" size="sm" switch)
                | {{ $t('timeline.mergeByApp') }}
          tr
            th.pt-2.pr-3
              label(for="timeline-filter-categories") {{ $t('ui.timeline.categories') }}
            td
              select#timeline-filter-categories.form-control.form-control-sm(@change="onCategorySelect($event)", :value="''")
                option(value="" disabled) {{ filter_categories.length > 0 ? $t('ui.workReport.addCategory') : $t('ui.timeline.all') }}
                option(v-for="cat in category_options", :key="cat.text", :value="cat.text") {{ cat.text }}
              div.mt-1(v-if="filter_categories.length > 0")
                span.badge.badge-info.mr-1(v-for="(cat, idx) in filter_categories", :key="idx")
                  | {{ cat.join(' > ') }}
                  button.ml-1.close.small(@click="removeCategory(idx)", type="button", :aria-label="$t('ui.workReport.removeCategory')", style="font-size: 0.85rem; line-height: 1") &times;

    // Display options (swimlanes, future visual toggles) tucked behind a
    // ghost kebab so they don't compete visually with Filters.
    b-dropdown.kebab-dropdown.mr-2(
      size="sm"
      variant="outline-secondary"
      toggle-class="border-0"
      no-caret
      right
      :title="$t('ui.timeline.displayOptions')"
      :aria-label="$t('ui.timeline.displayOptions')"
    )
      template(v-slot:button-content="")
        icon(name="ellipsis-v")
      b-dropdown-header {{ $t('ui.timeline.swimlanes') }}
      b-dropdown-item-button(
        v-for="opt in swimlaneOptions"
        :key="String(opt.value)"
        :active="swimlane === opt.value"
        @click="swimlane = opt.value"
      ) {{ opt.text }}

    div.timeline-chip.mr-2.text-muted
      | {{ num_events }} {{ $t('timeline.eventsShown') }}

    small.text-muted.ml-auto
      | {{ $t('timeline.scrollHint') }}

  b-alert.mb-2(v-if="buckets !== null && num_events === 0", variant="warning", show)
    | {{ $t('timeline.noEvents') }}

  b-alert.mb-2(v-if="categoryError", variant="warning", show)
    | Categorized timeline unavailable. Raw bucket events are still shown.

  div(v-if="buckets !== null")
    vis-timeline(:buckets="buckets", :categorizedEvents="categorizedEvents", :showRowLabels='true', :queriedInterval="daterange", :swimlane="swimlane", :groupGranularity="timelineGroupGranularity", :updateTimelineWindow='updateTimelineWindow', @event-saved="onEventSaved")

    aw-devonly(:reason="$t('ui.devOnly.timelineExperiment')")
      aw-calendar(:buckets="buckets")
  div(v-else)
    h1.aw-loading {{ $t('common.loading') }}
</template>

<script lang="ts">
import type { Moment } from 'moment';
import { defineComponent } from 'vue';
import 'vue-awesome/icons/filter';
import 'vue-awesome/icons/ellipsis-v';
import _ from 'lodash';
import { mapState } from 'pinia';
import { canonicalEvents, querystr_to_array } from '~/queries';
import { useBucketsStore } from '~/stores/buckets';
import { useCategoryStore } from '~/stores/categories';
import { useSettingsStore } from '~/stores/settings';
import { getClient } from '~/util/awclient';
import { matchString } from '~/util/classes';
import { getCategorizationStringFromEvent } from '~/util/color';
import type { IBucket, IEvent } from '~/util/interfaces';
import { seconds_to_duration } from '~/util/time';
import { categoryTimelineQuery, mergeCategoryIntervals } from '~/util/timelineCategories';

export default defineComponent({
  name: 'Timeline',
  data() {
    return {
      all_buckets: null as readonly IBucket[] | null,
      hosts: null as (string | undefined)[] | null,
      buckets: null as readonly IBucket[] | null,
      categorizedEvents: [] as IEvent[],
      categoryError: false,
      clients: null as (string | undefined)[] | null,
      fetchSeq: 0,
      daterange: null as Moment[] | null,
      maxDuration: 31 * 24 * 60 * 60,
      filter_hostname: null as string | null,
      filter_client: null as string | null,
      filter_duration: null as number | null,
      filter_afk: false,
      filter_merge_similar: false,
      filter_categories: [] as string[][],
      swimlane: null as string | null,
      updateTimelineWindow: true,
      // Not reactive: the pending fetch and the range it was started for
      fetchedRange: null as Moment[] | null,
      bucketsRequest: null as Promise<IBucket[]> | null,
    };
  },
  computed: {
    ...mapState(useSettingsStore, ['always_active_pattern']),
    swimlaneOptions() {
      return [
        { value: null, text: this.$t('ui.timeline.none') },
        { value: 'category', text: this.$t('ui.timeline.groupByCategory') },
        { value: 'bucketType', text: this.$t('ui.timeline.groupByBucketType') },
      ];
    },
    timelineGroupGranularity() {
      return Number(useSettingsStore().timelineGroupGranularity);
    },
    timeintervalDefaultDuration() {
      const settingsStore = useSettingsStore();
      return Number(settingsStore.durationDefault);
    },
    // This does not match the chartData which is rendered in the timeline, as chartData excludes short events.
    num_events(): number {
      return _.sumBy(this.buckets as IBucket[] | null, 'events.length');
    },
    category_options() {
      const categoryStore = useCategoryStore();
      return categoryStore.allCategoriesSelect;
    },
    filter_summary(): string {
      const desc: string[] = [];
      if (this.filter_hostname) {
        desc.push(this.filter_hostname);
      }
      if (this.filter_client) {
        desc.push(this.filter_client);
      }
      if (this.filter_duration !== null && this.filter_duration > 0) {
        desc.push(seconds_to_duration(this.filter_duration));
      }
      if (this.filter_afk) {
        desc.push(this.$t('ui.timeline.afkFiltered') as string);
      }
      if (this.filter_merge_similar) {
        desc.push(this.$t('ui.timeline.mergedByApp') as string);
      }
      if (this.filter_categories.length > 0) {
        desc.push(
          this.$t('ui.timeline.categoriesCount', {
            count: this.filter_categories.length,
          }) as string,
        );
      }

      if (desc.length > 0) {
        return desc.join(', ');
      }
      return this.$t('ui.timeline.none') as string;
    },
  },
  watch: {
    daterange() {
      this.updateTimelineWindow = true;
      this.getBuckets();
    },
    filter_hostname() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_client() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_duration() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_afk() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_merge_similar() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    filter_categories() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
    swimlane() {
      this.updateTimelineWindow = false;
      this.getBuckets();
    },
  },
  created() {
    useCategoryStore().load();
  },
  methods: {
    onCategorySelect(event: Event) {
      const target = event.target as HTMLSelectElement;
      const text = target.value;
      if (!text) return;
      const cat = this.category_options.find((c) => c.text === text);
      if (cat?.value && !this.filter_categories.some((fc) => _.isEqual(fc, cat.value))) {
        this.filter_categories = [...this.filter_categories, cat.value];
      }
      target.value = '';
    },
    removeCategory(idx: number) {
      this.filter_categories = this.filter_categories.filter((_cat, i) => i !== idx);
    },
    // A saved edit changed the server's events, so the cached range is stale.
    onEventSaved: function () {
      this.fetchedRange = null;
      this.getBuckets();
    },
    getBuckets: async function () {
      if (this.daterange == null) return;

      const seq = ++this.fetchSeq;
      // Only refetch when the range changes; filters work on copies below.
      const range = this.daterange;
      const [rangeStart, rangeEnd] = range;
      if (!(rangeStart && rangeEnd)) return;
      if (this.fetchedRange !== range || !this.bucketsRequest) {
        this.fetchedRange = range;
        // aw-client types events more narrowly than the store returns them
        const request: Promise<IBucket[]> = useBucketsStore().getBucketsWithEvents({
          start: rangeStart.format(),
          end: rangeEnd.format(),
        });
        this.bucketsRequest = request;
        // Let the next call retry a failed fetch
        request.catch(() => {
          if (this.fetchedRange === range) this.fetchedRange = null;
        });
      }
      const fetched = await this.bucketsRequest;
      // A newer call (range or filter change) took over while this one was loading
      if (seq !== this.fetchSeq) return;
      const allBuckets: readonly IBucket[] = Object.freeze(fetched);
      this.all_buckets = allBuckets;

      this.hosts = allBuckets
        .map((a) => a.hostname)
        .filter((value, index, array) => array.indexOf(value) === index);
      this.clients = allBuckets
        .map((a) => a.client)
        .filter((value, index, array) => array.indexOf(value) === index);

      let buckets: IBucket[] = allBuckets.map((bucket) => ({ ...bucket }));
      if (this.filter_hostname) {
        buckets = _.filter(buckets, (b) => b.hostname == this.filter_hostname);
      }
      if (this.filter_client) {
        buckets = _.filter(buckets, (b) => b.client == this.filter_client);
      }

      // Start the category query now so it runs concurrently with the raw-row
      // filtering below, and publish raw rows without waiting for it.
      let categoryPromise: Promise<{
        events: ReturnType<typeof mergeCategoryIntervals>;
        error: boolean;
      }>;
      const minDuration = this.filter_duration ?? 0;
      const categoryQuery = categoryTimelineQuery(buckets, [...allBuckets], {
        categories: useCategoryStore().classes_for_query,
        filter_categories: this.filter_categories,
        always_active_pattern: this.always_active_pattern || undefined,
      });
      if (categoryQuery) {
        categoryPromise = getClient()
          .query([`${rangeStart.format()}/${rangeEnd.format()}`], categoryQuery)
          .then((data) => {
            let events = mergeCategoryIntervals(data[0] || []);
            if (minDuration > 0) {
              events = events.filter((e) => e.duration >= minDuration);
            }
            return { events, error: false };
          })
          .catch((error) => {
            console.warn('Categorized timeline query failed:', error);
            return { events: [], error: true };
          });
      } else {
        categoryPromise = Promise.resolve({ events: [], error: false });
      }

      if (minDuration > 0) {
        for (const bucket of buckets) {
          bucket.events = _.filter(bucket.events, (e) => e.duration >= minDuration);
        }
      }

      if (this.filter_categories.length > 0) {
        const categoryStore = useCategoryStore();
        const allCats = categoryStore.classes;
        for (const bucket of buckets) {
          // Skip AFK buckets — they don't have meaningful categorization
          if (bucket.type === 'afkstatus') continue;
          bucket.events = _.filter(bucket.events, (e) => {
            const str = getCategorizationStringFromEvent(bucket, e);
            if (str === null) return true; // Keep events from unknown bucket types
            const matched = matchString(str, allCats, e);
            const eventCat = matched ? matched.name : ['Uncategorized'];
            // Check if the event's category matches any selected filter category
            // (including parent matches: selecting "Work" also shows "Work > Programming")
            return this.filter_categories.some((filterCat) =>
              _.isEqual(eventCat.slice(0, filterCat.length), filterCat),
            );
          });
        }
      }

      // AFK filtering: use query engine to filter window events by AFK status
      if (this.filter_afk) {
        buckets = await this._applyAfkFilter(buckets);
      }

      // Merge adjacent events by app name for window buckets.
      // Runs after AFK filtering so merges operate on already-filtered events.
      // Reduces visual clutter from apps that produce many small events (e.g.
      // Adobe Illustrator's TAB key toggling UI panels). See: activitywatch#1165
      if (this.filter_merge_similar) {
        buckets = this._applyMergeSimilar(buckets);
      }

      if (seq !== this.fetchSeq) return;
      // Raw rows are ready; publish them before awaiting the category query.
      // Clear the old category row so it can never be paired with a new range.
      this.categorizedEvents = [];
      this.categoryError = false;
      // Frozen to keep the event graph out of Vue's deep observation.
      this.buckets = Object.freeze(buckets);

      const categoryResult = await categoryPromise;
      if (seq !== this.fetchSeq) return;
      this.categorizedEvents = categoryResult.events;
      this.categoryError = categoryResult.error;
    },

    // Merges adjacent events with the same app name within window buckets.
    // This collapses rapid title changes (e.g. toggling UI panels) into single
    // blocks per app, fixing timeline flooding for apps like Adobe Illustrator.
    _applyMergeSimilar: (buckets: IBucket[]): IBucket[] =>
      buckets.map((bucket) => {
        if (bucket.type !== 'currentwindow' || !bucket.events || bucket.events.length <= 1) {
          return bucket;
        }

        const sorted = [...bucket.events].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        const [first, ...rest] = sorted;
        if (!first) return bucket;
        const merged: IEvent[] = [];
        let current: IEvent = { ...first };

        for (const next of rest) {
          const currentEnd = new Date(current.timestamp).getTime() + current.duration * 1000;
          const nextStart = new Date(next.timestamp).getTime();
          const gap = nextStart - currentEnd;

          // Merge if same app and gap is small (< 30 seconds)
          if (current.data?.app && current.data.app === next.data?.app && gap < 30000) {
            const nextEnd = nextStart + next.duration * 1000;
            current.duration =
              (Math.max(currentEnd, nextEnd) - new Date(current.timestamp).getTime()) / 1000;
          } else {
            merged.push(current);
            current = { ...next };
          }
        }
        merged.push(current);

        return { ...bucket, events: merged };
      }),

    // Replaces raw window bucket events with AFK-filtered events via aw query engine.
    // Also hides AFK status buckets since they're used for filtering, not display.
    _applyAfkFilter: async function (buckets: IBucket[]): Promise<IBucket[]> {
      const bucketsStore = useBucketsStore();
      const result: IBucket[] = [];

      for (const bucket of buckets) {
        // Hide AFK status buckets when AFK filtering is active
        if (bucket.type === 'afkstatus') {
          continue;
        }

        // For window buckets, replace events with AFK-filtered query results
        if (bucket.type === 'currentwindow' && bucket.hostname) {
          const [afkBucketId] = bucketsStore.bucketsAFK(bucket.hostname);
          if (afkBucketId !== undefined) {
            try {
              const filteredEvents = await this._queryAfkFilteredEvents(bucket.id, afkBucketId);
              // Create a copy with filtered events to avoid mutating frozen all_buckets
              result.push({ ...bucket, events: filteredEvents });
              continue;
            } catch (e) {
              console.warn('AFK filter query failed, falling back to raw events:', e);
            }
          }
        }

        // Keep other buckets unchanged
        result.push(bucket);
      }

      return result;
    },

    // Runs a canonicalEvents query to get window events filtered by AFK status,
    // respecting the user's always_active_pattern setting.
    _queryAfkFilteredEvents: async function (
      windowBucketId: string,
      afkBucketId: string,
    ): Promise<IEvent[]> {
      const queryCode =
        canonicalEvents({
          bid_window: windowBucketId,
          bid_afk: afkBucketId,
          filter_afk: true,
          always_active_pattern: this.always_active_pattern || undefined,
          categories: [],
          filter_categories: null,
        }) + '\nRETURN = events;';

      const queryArray = querystr_to_array(queryCode);

      const [rangeStart, rangeEnd] = this.daterange ?? [];
      if (!(rangeStart && rangeEnd)) return [];
      const timeperiods = [`${rangeStart.format()}/${rangeEnd.format()}`];

      const data = await getClient().query(timeperiods, queryArray);
      return data[0] || [];
    },
  },
});
</script>

<style scoped>
.timeline-toolbar {
  row-gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.timeline-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: #fff;
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  line-height: 1.25;
}

.timeline-chip--clickable {
  cursor: pointer;
  user-select: none;
}

.timeline-chip--clickable:hover {
  background: #f8f9fa;
}

.timeline-filters {
  position: relative;
}

.timeline-filters > summary {
  list-style: none;
}

.timeline-filters > summary::-webkit-details-marker {
  display: none;
}

.timeline-filters-panel {
  display: none;
  position: absolute;
  left: 0;
  top: calc(100% + 4px);
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.75rem 1rem;
  z-index: 100;
  min-width: 320px;
}

.timeline-filters[open] .timeline-filters-panel {
  display: block;
}
</style>
