<template lang="pug">
div
  // Let the user either choose a mode to use for filtering events.
  // Either let the user choose which of the existing categories to include, or use a custom regex.
  b-form-group
    b-form-select(v-model="mode")
      option(value="custom") {{ $t('ui.selectCategories.customRegex') }}
      option(value="categories") {{ $t('ui.selectCategories.useExisting') }}

  // select which categories, by having a form select and a "plus" button to include them
  b-input-group
    aw-select-categories(v-if="mode == 'categories'", v-model="filterCategoriesData")
    b-input(v-if="mode == 'custom'" v-model="pattern" v-on:keyup.enter="generate()" :placeholder="$t('ui.search.regexPlaceholder')")
    b-input-group-append
      slot(name="input-group-append")
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { useCategoryStore } from '~/stores/categories';
import type { Category } from '~/util/classes';
import type { QueryCategory } from '~/queries';

const SEP = ' > ';

export default defineComponent({
  name: 'SelectCategoriesOrPattern',
  props: {
    filterCategories: {
      type: Array as PropType<string[][]>,
      default: () => [],
    },
  },
  data() {
    return {
      mode: 'categories',
      pattern: '',
      filterCategoriesData: [] as string[][],
    };
  },
  computed: {
    categories: function (): Category[] {
      return useCategoryStore().classes;
    },

    categoriesWithRules(): QueryCategory[] {
      if (this.mode === 'categories') {
        // Get the category and all subcategories
        return this.categories
          .filter((cat) => {
            const name = cat.name.join(SEP);
            for (const filterCat of this.filterCategoriesData) {
              if (name.includes(filterCat.join(SEP))) {
                return true;
              }
            }
            return false;
          })
          .filter((cat) => cat.rule.type === 'regex')
          .map((cat): QueryCategory => [cat.name, cat.rule]);
      } else if (this.mode === 'custom') {
        return [[['searched'], { type: 'regex', regex: this.pattern }]];
      } else {
        console.error('Unknown mode:', this.mode);
        return [];
      }
    },
  },
  watch: {
    filterCategories() {
      this.filterCategoriesData = [...this.filterCategoriesData, ...this.filterCategories];
    },
    filterCategoriesData() {
      this.$emit('input', this.categoriesWithRules);
      console.log(this.categoriesWithRules);
    },
    pattern() {
      this.$emit('input', this.categoriesWithRules);
      console.log(this.categoriesWithRules);
    },
  },
  async mounted() {
    await useCategoryStore().load();
  },
});
</script>
