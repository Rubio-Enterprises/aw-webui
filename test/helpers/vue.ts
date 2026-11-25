import type { Wrapper } from '@vue/test-utils';
import type Vue from 'vue';

type Member = (this: unknown, ...args: unknown[]) => unknown;

/** The Options API members of a single-file component, as tests call them directly. */
export interface OptionsApi {
  methods: Record<string, Member>;
  computed: Record<string, Member>;
  watch: Record<string, Member>;
  data: <Data = Record<string, unknown>>() => Data;
}

/**
 * The `*.vue` module shim types every component as the Vue constructor, which does
 * not expose the Options API members that unit tests call with a stand-in `this`.
 */
export function optionsApi(component: unknown): OptionsApi {
  return component as OptionsApi;
}

/** A mounted component whose instance members are read by name in assertions. */
export type VmWrapper = Wrapper<Vue & Record<string, unknown>>;

/**
 * Types the instance of a mounted component: the `*.vue` shim only knows the Vue
 * constructor, so each test names the members of the component it reads.
 */
export function withVm<Vm extends object>(wrapper: Wrapper<Vue>): Wrapper<Vue & Vm> {
  return wrapper as unknown as Wrapper<Vue & Vm>;
}
