// vue-color ships no types for its Vue 2.7 build. This covers the parts aw-webui uses: the
// compact swatch picker and the tinycolor2 instance it re-exports.
declare module 'vue-color/vue2' {
  import type { Component } from 'vue';

  export const CompactPicker: Component;
  export function tinycolor(color: unknown): {
    getAlpha(): number;
    toHexString(): string;
    toRgbString(): string;
  };
}
