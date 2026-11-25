import Color from 'color';
import * as d3 from 'd3';
import _ from 'lodash';
import moment from 'moment';

import { getColorFromString, getTitleAttr } from '../util/color';
import type { IEvent } from '../util/interfaces';
import * as time from '../util/time';

function create(svg_el: SVGElement) {
  // Clear element
  svg_el.innerHTML = '';

  // svg for the colored timeline
  d3.select(svg_el).attr('viewBox', '0 0 100 4').attr('width', '100%');
}

function set_status(svg_el: SVGElement, text: string) {
  const timeline = d3.select(svg_el);
  timeline.selectAll('*').remove();

  timeline
    .append('text')
    .attr('x', '0')
    .attr('y', '3')
    .text(text)
    .attr('font-family', 'sans-serif')
    .attr('font-size', '2')
    .attr('fill', 'black');
}

function update(svg_el: SVGElement, events: IEvent[], event_type: string, noDataLabel = 'No data') {
  const timeline = d3.select(svg_el);
  timeline.selectAll('*').remove();

  if (events.length <= 0) {
    set_status(svg_el, noDataLabel);
    return;
  }

  events = _.clone(events);
  _.reverse(events);
  const e_first = events[0];
  const e_last = events[events.length - 1];
  if (!(e_first && e_last)) {
    // Unreachable: empty lists returned above
    set_status(svg_el, noDataLabel);
    return;
  }
  const m_first = moment(e_first.timestamp);
  const m_last = moment(e_last.timestamp);
  const total_duration = (m_last.valueOf() - m_first.valueOf()) / 1000 + e_last.duration;
  console.log(`First: ${m_first.format()}`);
  console.log(`Last: ${m_last.format()}`);
  console.log(`Duration: ${total_duration}`);

  // Iterate over each event and create interval boxes
  _.each(events, (e: IEvent, i: number) => {
    const id = `timeline_event_${i}`;
    const timestamp = moment(e.timestamp);

    const color_base = getColorFromString(getTitleAttr({ type: event_type }, e));
    const color_hover = Color(color_base).darken(0.4).hex();

    const x = (timestamp.valueOf() - m_first.valueOf()) / 1000 / total_duration;
    const width = (100 * e.duration) / total_duration;

    const eg = timeline
      .append('g')
      .attr('id', id)
      .attr('transform', `translate(${100 * x},0)`);

    const rect = eg
      .append('rect')
      .attr('width', width)
      .attr('height', 4)
      .style('fill', color_base)
      // (d3 v7 passes (event, datum): the old `n[j]` lookup threw on every hover)
      .on('mouseover', () => {
        rect.style('fill', color_hover);
      })
      .on('mouseout', () => {
        rect.style('fill', color_base);
      });

    rect
      .append('title')
      .text(
        timestamp.format() +
          '\n' +
          'Duration: ' +
          time.seconds_to_duration(e.duration) +
          '\n' +
          JSON.stringify(e.data),
      );

    if (e.duration > 0.05 * total_duration) {
      eg.append('text')
        .attr('font-size', 2)
        .attr('x', 1)
        .attr('y', 2.5)
        .attr('pointer-events', 'none')
        .text(getTitleAttr({ type: event_type }, e) ?? '');
    }
  });

  return svg_el;
}

export default {
  create: create,
  update: update,
};
