import { mount } from '@vue/test-utils';
import ColorPicker from '~/components/ColorPicker.vue';

const stubs = ['b-input-group', 'b-input-group-append', 'b-button', 'b-btn', 'icon'];

function mountPicker(value: string) {
  return mount(ColorPicker, {
    propsData: { value },
    stubs: {
      ...Object.fromEntries(stubs.map((s) => [s, { template: '<div><slot /></div>' }])),
      'b-form-input': true,
    },
    mocks: { $t: (key: string) => key },
    attachTo: document.body,
  });
}

describe('ColorPicker', () => {
  test('shows the current colour as the selected swatch and emits a picked swatch', async () => {
    const wrapper = mountPicker('#4D4D4D');
    try {
      await wrapper.setData({ displayPicker: true });
      const selected = wrapper.find('.vc-compact-picker [aria-selected="true"]');
      expect(selected.attributes('title')).toBe('#4D4D4D');

      await wrapper.find('.vc-compact-picker [title="#F44E3B"]').trigger('click');
      expect(wrapper.emitted('input')?.at(-1)).toEqual(['#F44E3B']);
    } finally {
      wrapper.destroy();
    }
  });

  test('keeps a translucent colour as rgba()', async () => {
    const wrapper = mountPicker('#000000');
    try {
      (wrapper.vm as unknown as { updateFromPicker(c: string): void }).updateFromPicker(
        'rgba(244, 78, 59, 0.5)',
      );
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('input')?.at(-1)).toEqual(['rgba(244, 78, 59, 0.5)']);
    } finally {
      wrapper.destroy();
    }
  });
});
