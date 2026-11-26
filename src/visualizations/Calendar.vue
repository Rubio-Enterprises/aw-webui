<template lang="pug">
div.mx-3
  b-form
    b-form-group(:label="$t('ui.calendar.bucket')")
      select(v-model="selectedBucket")
        option(v-for="bucket in buckets", :value="bucket.id") {{ bucket.id }}
    b-form-group(:label="$t('ui.calendar.show')")
      select(v-model="view")
        option(value="timeGridDay") {{ $t('ui.calendar.day') }}
        option(value="timeGridWeek") {{ $t('ui.calendar.week') }}
    b-form-group
      b-checkbox(v-model="fitToActive")
        | {{ $t('ui.calendar.fitActive') }}
  FullCalendar(ref="fullCalendar", :options="calendarOptions")
</template>

<script lang="ts">
import timeGridPlugin from '@fullcalendar/timegrid';
import FullCalendar from '@fullcalendar/vue';
import _ from 'lodash';
import moment from 'moment';
import { defineComponent, type PropType } from 'vue';
import { calendarTimeBounds } from '~/util/calendar';
import type { IBucket } from '~/util/interfaces';
import { getColorFromString, getTitleAttr } from '../util/color';

// An event as FullCalendar takes it (not an ActivityWatch event)
interface CalendarEvent {
  title: string | undefined;
  start: string;
  end: string;
  backgroundColor: string;
}

// The part of the FullCalendar component this view calls
interface FullCalendarRef {
  getApi(): { changeView(view: string): void };
}

// TODO: Use canonical timeline query, with flooding and categorization
// TODO: Checkbox for toggling category-view, where adjacent events with same category are merged and the events are labeled by category
// TODO: Use the recommended way of dynamically getting events: https://fullcalendar.io/docs/events-function
export default defineComponent({
  components: {
    FullCalendar, // make the <FullCalendar> tag available
  },
  props: {
    buckets: { type: Array as PropType<IBucket[]> },
  },
  data() {
    return { fitToActive: false, selectedBucket: null as string | null, view: 'timeGridDay' };
  },
  computed: {
    calendarOptions: function () {
      const events: CalendarEvent[] = Array.isArray(this.events) ? this.events.filter(Boolean) : [];
      return {
        plugins: [timeGridPlugin],
        initialView: this.view,
        eventClick: this.onEventClick,
        events: events,
        allDaySlot: false,
        ...calendarTimeBounds(events, this.fitToActive),
        nowIndicator: true,
        expandRows: true,
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          //second: '2-digit',
          hour12: false,
        },
      };
    },
    events: function (): CalendarEvent[] {
      // NOTE: This returns FullCalendar events, not ActivityWatch events.
      if (this.buckets == null) return [];

      const bucket = _.find(this.buckets, (b) => b.id == this.selectedBucket);
      if (bucket == null) {
        return [];
      }
      const bucketEvents = Array.isArray(bucket.events) ? bucket.events : [];
      const longEvents = bucketEvents.filter((e) => e && e.timestamp && Number(e.duration) > 10);
      return longEvents.map((e): CalendarEvent => {
        return {
          title: getTitleAttr(bucket, e),
          start: moment(e.timestamp).format(),
          end: moment(e.timestamp).add(e.duration, 'seconds').format(),
          backgroundColor: getColorFromString(getTitleAttr(bucket, e)),
        };
      });
    },
  },
  watch: {
    view: function (to: string) {
      // The FullCalendar component instance, which has no types for its refs
      const calendar = (this.$refs.fullCalendar as unknown as FullCalendarRef).getApi();
      calendar.changeView(to);
    },
  },
  methods: {
    onEventClick: (arg: { event: unknown }) => {
      // TODO: Open event inspector/editor here
      console.info('Calendar event selected:', arg.event);
    },
  },
});
</script>
