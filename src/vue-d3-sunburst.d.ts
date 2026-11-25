// vue-d3-sunburst ships no types. This declares the components aw-webui imports;
// their props and slots are used from the templates, which are not type-checked.
declare module 'vue-d3-sunburst' {
  import type { Component } from 'vue';

  export const breadcrumbTrail: Component;
  export const highlightOnHover: Component;
  export const nodeInfoDisplayer: Component;
  export const sunburst: Component;
  export const zoomOnClick: Component;
}
