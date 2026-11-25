<template lang="pug">
div
  b-input-group(ref="colorpicker")
    b-form-input(
      v-model="colorValue"
      @focus="showPicker()"
      @input="updateFromInput"
      placeholder="#FF00FF"
    )
    b-input-group-append
      b-button.px-2(variant="outline-secondary" style="border-color: #AAA; border-left: 0; border-right: 0" @click="togglePicker()")
        div.current-color(:style="'background-color: ' + colorValue")
      b-btn.px-1(variant="outline-secondary", style="border-color: #AAA", @click="randomColor()" :title="$t('ui.colorPicker.randomize')")
        icon(name="sync" scale="1")

  div(style="position: relative")
    picker(:value="colors" @input="updateFromPicker" v-if="displayPicker")
</template>

<style>
.vc-chrome {
  position: absolute;
  top: 0px;
  z-index: 9;
}
.current-color {
  border-radius: 1em;
  height: 1.5em;
  width: 1.5em;
  background-color: #000;
  cursor: pointer;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
// Based on https://codepen.io/Brownsugar/pen/NaGPKy
import 'vue-awesome/icons/sync';

import { Compact } from 'vue-color';

// What the vue-color picker emits when a colour is chosen
interface PickedColor {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
}

export default defineComponent({
  components: {
    picker: Compact,
  },
  props: { value: { type: String, default: '#000000' } },
  data() {
    return {
      colors: {
        hex: '#000000',
      } as { hex: string; a?: string | number },
      colorValue: '',
      displayPicker: false,
    };
  },
  watch: {
    colorValue(val: string) {
      if (val) {
        this.updateColors(val);
        this.$emit('input', val);
      }
    },
  },
  mounted() {
    this.setColor(this.value);
  },
  methods: {
    setColor(color: string) {
      this.updateColors(color);
      this.colorValue = color;
    },
    updateColors(color: string) {
      if (color.slice(0, 1) == '#') {
        this.colors = {
          hex: color,
        };
      } else if (color.slice(0, 4) == 'rgba') {
        const rgba = color.replace(/^rgba?\(|\s+|\)$/g, '').split(',');
        const [r = '', g = '', b = ''] = rgba;
        const hex =
          '#' +
          ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b))
            .toString(16)
            .slice(1);
        this.colors = {
          hex: hex,
          a: rgba[3],
        };
      }
    },
    showPicker() {
      document.addEventListener('click', this.documentClick);
      this.displayPicker = true;
    },
    hidePicker() {
      document.removeEventListener('click', this.documentClick);
      this.displayPicker = false;
    },
    togglePicker() {
      this.displayPicker ? this.hidePicker() : this.showPicker();
    },
    updateFromInput() {
      this.updateColors(this.colorValue);
    },
    updateFromPicker(color: PickedColor) {
      this.colors = color;
      if (color.rgba.a == 1) {
        this.colorValue = color.hex;
      } else {
        this.colorValue = `rgba(${color.rgba.r}, ${color.rgba.g}, ${color.rgba.b}, ${color.rgba.a})`;
      }
    },
    randomColor() {
      this.colorValue = '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
    },
    documentClick(e: MouseEvent) {
      const el = this.$refs.colorpicker as HTMLElement | undefined;
      const target = e.target as Node | null;
      if (el && el !== target && !el.contains(target)) {
        this.hidePicker();
      }
    },
  },
});
</script>
