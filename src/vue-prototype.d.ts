import type { AWClient } from 'aw-client';

// Set in main.ts: `Vue.prototype.$aw = getClient()`
declare module 'vue/types/vue' {
  interface Vue {
    $aw: AWClient;
  }
}
