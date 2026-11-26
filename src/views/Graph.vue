<template lang="pug">
div
  h3 {{ $t('nav.graph') }}

  b-alert(show variant="warning")
    | {{ $t('ui.graph.earlyDev') }}

  p {{ $t('ui.graph.description') }}

  b-alert(v-if="error" show variant="danger")
    | {{error}}

  // Specify max category depth
  b-form-group(:label="$t('ui.graph.maxDepth')")
    b-form-input(v-model="maxDepth" type="number" min="1")

  // Toggle to exclude uncategorized
  b-form-group(:label="$t('ui.graph.excludeUncategorized')")
    b-form-checkbox(v-model="excludeUncategorized")

  div.d-flex
    span.mr-auto
    b-button(type="button", @click="generate()" variant="success")
      icon(name="search")
      | {{ $t('report.generate') }}

  div.d-flex.mt-1
    span.mr-auto.small.text-muted {{ $t('ui.search.hostname') }}: {{queryOptions.hostname}}
    b-button.border-0(size="sm", variant="outline-dark" @click="show_options = !show_options")
      span(v-if="!show_options")
        | #[icon(name="angle-double-down")] {{ $t('ui.search.showOptions') }}
      span(v-else)
        | #[icon(name="angle-double-up")] {{ $t('ui.search.hideOptions') }}

  div(v-show="show_options")
    h4 {{ $t('report.options') }}
    aw-query-options(v-model="queryOptions")

  div(v-if="status == 'searching'")
    div #[icon(name="spinner" pulse)] {{ $t('ui.search.searching') }}


  div(v-if="events != null")
    hr

    div
        | {{ $t('report.foundEvents', { count: events.length, seconds: queryTime / 1000 }) }}

    aw-force-graph(:data="graphdata")

    hr

    div
      | {{ $t('search.notFound') }}
      br
      | {{ $t('search.addWeek') }} #[b-button(size="sm" variant="outline-dark" @click="extendByWeek()") {{ $t('search.addWeekBtn') }}]
</template>

<style scoped lang="scss"></style>

<script lang="ts">
import { defineComponent } from 'vue';
import _ from 'lodash';
import moment from 'moment';

import 'vue-awesome/icons/search';
import 'vue-awesome/icons/spinner';
import 'vue-awesome/icons/angle-double-down';
import 'vue-awesome/icons/angle-double-up';

import { canonicalEvents, querystr_to_array } from '~/queries';
import { useBucketsStore } from '~/stores/buckets';

import { useCategoryStore } from '~/stores/categories';

import { getClient } from '~/util/awclient';
import type { IEvent } from '~/util/interfaces';

type GraphNode = { id: string; group: number; color: string; value: number };
type GraphLink = { source: string; target: string; value: number };
type GraphData = { nodes: GraphNode[]; links: GraphLink[] };

// Set by the query options component once it has mounted
type GraphQueryOptions = {
  hostname?: string;
  filter_afk?: boolean;
  start?: string;
  stop?: string;
};

// The error shape of a failed aw-client request
type RequestError = { message?: string; response?: { data?: { message?: string } } };

export default defineComponent({
  name: 'Graph',
  components: {
    'aw-force-graph': () => import('~/visualizations/ForceGraph.vue'),
  },
  data() {
    return {
      categoryStore: useCategoryStore(),

      events: null as IEvent[] | null,
      graphdata: { nodes: [], links: [] } as GraphData,

      status: null as 'searching' | null,
      queryTime: null as number | null,
      error: '',

      // Parameters
      maxDepth: 3,
      excludeUncategorized: false,

      // Options
      show_options: false,
      queryOptions: {} as GraphQueryOptions,
    };
  },
  mounted: async function () {
    await this.categoryStore.load();
  },
  methods: {
    generate: async function () {
      this.events = await this.fetchEvents();
      this.graphdata = this.generateGraphData(this.events ?? []);
    },
    fetchEvents: async function (): Promise<IEvent[] | null> {
      // TODO: use full query (one per day/timeperiod) instead of canonicalEvents
      let query = canonicalEvents({
        ...useBucketsStore().desktopBucketIds(this.queryOptions.hostname ?? ''),
        filter_afk: this.queryOptions.filter_afk,
        categories: this.categoryStore.classes_for_query,
        filter_categories: this.excludeUncategorized
          ? this.categoryStore.classes_for_query.map((t) => t[0])
          : null,
      });
      query += '; RETURN = events;';

      const query_array = querystr_to_array(query);
      const start = moment(this.queryOptions.start).format();
      const end = moment(this.queryOptions.stop).format();
      const timeperiods = [start + '/' + end];
      try {
        this.status = 'searching';
        const time = moment();
        const data = await getClient().query(timeperiods, query_array);
        this.error = '';
        this.queryTime = moment().diff(time);
        console.log('done fetching events!');
        this.events = _.orderBy(data[0] as IEvent[], ['timestamp'], ['desc']);
      } catch (e) {
        console.error(e);
        const err = e as RequestError | undefined;
        this.error =
          err?.response?.data?.message ||
          err?.message ||
          (this.$t('common.requestFailed') as string);
      } finally {
        this.status = null;
      }
      return this.events;
    },
    generateGraphData: function (input: IEvent[]): GraphData {
      // generate graph data from events
      // iterate through events, and count the number of category transitions
      // for each category, add a node to the graphdata with the group of its parent category
      // for each transition-pair, add a link to the graphdata with the number of transitions as weight
      const SEP = '>';

      // copy all events, slice off category depth deeper than maxDepth
      const events = input.map((e) => {
        const $category = (e.data.$category ?? ['Uncategorized']).slice(0, this.maxDepth);
        return { ...e, data: { ...e.data, $category } };
      });

      const allCategories: Set<string> = new Set(
        events.map((e) => e.data.$category).map((c) => c.join(SEP)),
      );
      const groups: Record<string, number> = { Uncategorized: 0 };

      // Generate groups
      for (const category of allCategories) {
        const rootcat = category.split(SEP)[0] ?? '';
        if (!Object.prototype.hasOwnProperty.call(groups, rootcat)) {
          groups[rootcat] = Object.keys(groups).length;
        }
      }

      // Generate nodes
      const nodes: GraphNode[] = [];
      for (const category of allCategories) {
        const rootcat = category.split(SEP)[0] ?? '';
        // Size nodes depending on time spent
        const catTime = events
          .filter((e) => e.data.$category.join(SEP) == category)
          .map((e) => moment(e.timestamp).add(e.duration).diff(e.timestamp))
          .reduce((a, b) => a + b, 0);
        nodes.push({
          id: category,
          // Every root category was added to groups above
          group: groups[rootcat] ?? 0,
          color: this.categoryStore.get_category_color(category.split(SEP)),
          value: catTime,
        });
      }

      // Generate links
      const links: GraphLink[] = [];
      for (let i = 0; i < events.length - 1; i++) {
        const e1 = events[i];
        const e2 = events[i + 1];
        if (!e1 || !e2) continue;
        const e1cat = e1.data.$category;
        const e2cat = e2.data.$category;
        if (_.isEqual(e1cat, e2cat)) continue;

        const link = links.find((l) => l.source == e1cat.join(SEP) && l.target == e2cat.join(SEP));
        if (link) {
          link.value++;
        } else {
          links.push({
            source: e1cat.join(SEP),
            target: e2cat.join(SEP),
            value: 1,
          });
        }
      }

      console.log('generated nodes & links');
      return { nodes, links };
    },
    extendByWeek() {
      this.queryOptions.start = moment(this.queryOptions.start)
        .subtract(1, 'week')
        .format('YYYY-MM-DD');
      this.generate();
    },
  },
});
</script>
