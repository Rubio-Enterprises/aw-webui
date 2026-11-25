import _ from 'lodash';
import moment from 'moment';
import Vue from 'vue';
import { friendlydate, seconds_to_duration } from './time';
import { periodReadable } from './timeperiod';

Vue.filter('iso8601', (timestamp: moment.MomentInput) => moment.parseZone(timestamp).format());

Vue.filter('shortdate', (timestamp: moment.MomentInput) => moment(timestamp).format('YYYY-MM-DD'));

Vue.filter('shorttime', (timestamp: moment.MomentInput) => moment(timestamp).format('HH:mm'));

Vue.filter('friendlytime', (timestamp: moment.MomentInput) => friendlydate(timestamp as string));

Vue.filter('friendlyduration', (seconds: number) => seconds_to_duration(seconds));

Vue.filter('friendlyperiod', (timeperiod: Parameters<typeof periodReadable>[0]) =>
  periodReadable(timeperiod),
);

// Apparently this is how we should do filters now
// https://github.com/vuejs/vue/issues/2756#issuecomment-215508316
Vue.prototype.filters = {
  //  filterBy: ...,
  orderBy: _.orderBy,
};
