<template lang="pug">
div
  b-input-group(ref="colorpicker")
    b-form-input(
      v-model="colorValue"
      @focus="showPicker()"
      placeholder="#FF00FF"
    )
    b-input-group-append
      b-button.px-2(variant="outline-secondary" style="border-color: #AAA; border-left: 0; border-right: 0" @click="togglePicker()")
        div.current-color(:style="'background-color: ' + colorValue")
      b-btn.px-1(variant="outline-secondary", style="border-color: #AAA", @click="randomColor()" :title="$t('ui.colorPicker.randomize')")
        icon(name="sync" scale="1")

  div(style="position: relative")
    picker(:value="colorValue" @input="updateFromPicker" v-if="displayPicker")
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

import { CompactPicker, tinycolor } from 'vue-color/vue2';
import 'vue-color/vue2/style.css';

export default defineComponent({
  components: {
    picker: CompactPicker,
  },
  props: { value: { type: String, default: '#000000' } },
  data() {
    return {
      colorValue: '',
      displayPicker: false,
    };
  },
  watch: {
    colorValue(val: string) {
      if (val) {
        this.$emit('input', val);
      }
    },
  },
  mounted() {
    this.setColor(this.value);
  },
  methods: {
    setColor(color: string) {
      this.colorValue = color;
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
    // Store picked colours as vue-color 2 did: uppercase hex, or rgba() when translucent.
    updateFromPicker(color: string) {
      const picked = tinycolor(color);
      this.colorValue =
        picked.getAlpha() === 1 ? picked.toHexString().toUpperCase() : picked.toRgbString();
    },
    randomColor() {
      this.colorValue = `#${(0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)}`;
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
