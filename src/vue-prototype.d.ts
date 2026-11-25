import type { AWClient } from 'aw-client';

// Set in main.ts: `Vue.prototype.$aw = getClient()` and
// `Vue.prototype.$isAndroid = process.env.VUE_APP_ON_ANDROID`
declare module 'vue/types/vue' {
  interface Vue {
    $aw: AWClient;
    // Set by the build for the Android app; unset otherwise
    $isAndroid: string | undefined;
  }
}
