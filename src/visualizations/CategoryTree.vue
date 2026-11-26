<template lang="pug">
div(style="font-size: 0.9em")
  div.px-1.category-row(v-for="cat in category_hierarchy" @click="toggle(cat)" v-if="parents_expanded(cat)", :class="{'clickable': cat.children.length > 0}")
    div.category-label(:style="'padding-left: ' + (1.4 * cat.depth) + 'em'")

      // icon
      span(v-if="cat.children.length > 0", style="opacity: 0.8")
        b(v-if="!expanded.has(cat.name_pretty)")
          icon.mr-1(name="regular/plus-square", scale="0.8")
        b(v-else)
          icon.mr-1(name="regular/minus-square", scale="0.8")
      span(v-else, style="opacity: 0.6")
        icon(name="circle", scale="0.4", style="margin-left: 1em; margin-right: 1.22em;")

      span.category-title {{cat.subname}}

    // time
    span.category-value
      span(v-if="show_perc")
        | {{Math.round(100 * cat.duration / total_duration, 1)}}%
      span(v-else)
        | {{cat.duration | friendlyduration}}
  hr
  // TODO: Make configurable in a cleaner way (figure out a way to configure visualizations generally)
  b-checkbox(v-model="show_perc" size="sm") {{ $t('ui.categoryTree.showPercent') }}
</template>

<style lang="scss" scoped>
.category-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.category-label {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: flex-start;
}

.category-title {
  min-width: 0;
  overflow-wrap: anywhere;
}

.category-value {
  flex: 0 0 auto;
  white-space: nowrap;
  text-align: right;
}

.clickable {
  cursor: pointer;
}
</style>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import 'vue-awesome/icons/circle';
import 'vue-awesome/icons/regular/plus-square';
import 'vue-awesome/icons/regular/minus-square';
import _ from 'lodash';
import {
  build_category_hierarchy,
  type Category,
  flatten_category_hierarchy,
} from '../util/classes.ts';
import type { IEvent } from '../util/interfaces.ts';

// A category with the time spent in it (and below it)
type TreeCategory = Omit<Category, 'children'> & { duration: number; children: TreeCategory[] };

function _get_child_cats(cat: TreeCategory, all_cats: TreeCategory[]): TreeCategory[] {
  return _.filter(all_cats, (c) => _.isEqual(c.parent, cat.name));
}

function _assign_children(parent: TreeCategory, all_cats: TreeCategory[]) {
  const child_cats = _get_child_cats(parent, all_cats);
  // Recurse
  _.map(child_cats, (c) => _assign_children(c, all_cats));
  parent.children = _.sortBy(child_cats, (cc) => -cc.duration);
}

// Flattens the category hierarchy
function _flatten_hierarchy(c: TreeCategory): TreeCategory[] {
  return [c, ..._.flatMap(c.children, _flatten_hierarchy)];
}

export default defineComponent({
  name: 'aw-categorytree',
  props: {
    events: { type: Array as PropType<IEvent[]> },
  },
  data: () => ({
    expanded: new Set<string>(),
    show_perc: false,
  }),
  computed: {
    total_duration: function (): number {
      // sum top-level categories
      const top_c = _.filter(this.category_hierarchy, (c) => c.depth == 0);
      return _.sumBy(top_c, (c) => c.duration);
    },
    category_hierarchy: function (): TreeCategory[] {
      if (!this.events) return [];
      const events: IEvent[] = JSON.parse(JSON.stringify(this.events)) as IEvent[];

      // A category path is always set by the category query
      const categoryOf = (e: IEvent): string[] => e.data.$category ?? ['Uncategorized'];

      const hier = build_category_hierarchy(
        _.map(events, (e): Category => {
          return { name: categoryOf(e), rule: { type: 'none' } };
        }),
      );

      // flatten_category_hierarchy has emptied every children list
      let cats: TreeCategory[] = flatten_category_hierarchy(hier).map((c) => {
        const duration = _.sumBy(
          events.filter((e) => {
            const pcat = categoryOf(e).slice(0, c.name.length);
            return _.isEqual(c.name, pcat);
          }),
          (e) => e.duration,
        );
        return { ...c, duration, children: [] };
      });

      const cats_with_depth0 = _.sortBy(
        _.filter(cats, (c) => c.depth == 0),
        (c) => -c.duration,
      );
      _.map(cats_with_depth0, (c) => _assign_children(c, cats));

      cats = _.flatten(_.map(cats_with_depth0, (c) => _flatten_hierarchy(c)));
      //console.log(cats);
      // TODO: If a category has children, but also activity attributed directly to the parent that does not belong to a child, then create a "Other" child containing the activity.
      return cats;
    },
  },
  methods: {
    get_category: function (cat_arr: string[]): TreeCategory | undefined {
      return _.find(this.category_hierarchy, (c) => _.isEqual(c.name, cat_arr));
    },
    toggle: function (cat: TreeCategory) {
      const key = cat.name_pretty ?? '';
      if (this.expanded.has(key)) {
        this.expanded.delete(key);
      } else {
        this.expanded.add(key);
      }
      // needed to trigger update, since Set isn't reactive in Vue 2
      this.expanded = new Set(this.expanded);
    },
    parents_expanded: function (cat: TreeCategory | undefined): boolean {
      if (cat === undefined || !cat.parent) {
        // top-level category
        return true;
      }
      return (
        // Check grandparents recursively
        this.parents_expanded(this.get_category(cat.parent)) &&
        // Check parent
        this.expanded.has(cat.parent.join('>'))
      );
    },
  },
});
</script>
