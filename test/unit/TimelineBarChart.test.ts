import { shallowMount } from '@vue/test-utils';
import { Bar } from 'vue-chartjs';
import TimelineBarChart from '~/visualizations/TimelineBarChart.vue';

describe('TimelineBarChart', () => {
  test('passes chart data and options to the vue-chartjs Bar props', () => {
    const datasets = [{ label: 'Work', backgroundColor: '#4ADE80', data: [1, 2, 3, 4, 5, 6, 7] }];
    const wrapper = shallowMount(TimelineBarChart, {
      propsData: {
        datasets,
        timeperiod_start: '2026-10-19',
        timeperiod_length: [7, 'days'],
        height: 200,
      },
    });
    const bar = wrapper.findComponent(Bar);
    expect(bar.exists()).toBe(true);
    expect(bar.props('data')).toMatchObject({ datasets, labels: expect.any(Array) });
    expect(bar.props('data').labels).toHaveLength(7);
    expect(bar.props('options')).toMatchObject({ responsive: true, maintainAspectRatio: false });
    expect(bar.attributes('height')).toBe('200');
    wrapper.destroy();
  });
});
