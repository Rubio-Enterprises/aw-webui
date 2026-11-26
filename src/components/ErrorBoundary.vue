<template lang="pug">
div
	b-alert(variant="danger", v-for="error in errors", :key='error.time', :show='!error.dismissed', dismissible, @dismissed="error.dismissed = false")
		| {{ error.msg }}
	slot
</template>

<script lang="ts">
import { defineComponent } from 'vue';

// Based on: https://medium.com/@dillonchanis/handling-errors-in-vue-with-error-boundaries-91f6ead0093b
// An error as aw-client (axios) raises it: request failures carry a code and the server response
type CapturedError = Error & {
  code?: string;
  response?: { data?: { message?: string } };
};

export default defineComponent({
  name: 'ErrorBoundary',
  data() {
    return {
      errors: [] as { msg: string | Error; time: string; dismissed: boolean }[],
    };
  },
  errorCaptured(error, _vm, _info) {
    const err = error as CapturedError;
    // console.error("Error captured!");
    // console.error(err, vm, info);

    // Ignore request cancellation errors
    if (err.code === 'ERR_CANCELED') {
      return;
    }

    // fallback
    let msg: string | Error = err;
    // use server error response if available; err.isAxiosError doesn't help much here…
    if (err.response && err.response.data && err.response.data.message) {
      msg = err.response.data.message;
    } else if (err.name && err.message) {
      msg = `${err.name}: ${err.message}.
				See dev console (F12) and/or server logs for more info.`;
    }

    this.errors.push({
      msg: msg,
      time: new Date().toISOString(),
      dismissed: false,
    });
  },
});
</script>
