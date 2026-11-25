// vue-color ships no types. This covers the part aw-webui uses: the compact swatch picker.
declare module 'vue-color' {
  import type { Component } from 'vue';

  export const Compact: Component;
}
