<template lang="pug">
div
  h3.mb-3 {{ $t('settings.title') }}

  div.settings-layout
    nav.settings-nav
      b-nav(pills vertical)
        b-nav-item(
          v-for="group in groups"
          :key="group.id"
          :active="activeGroup === group.id"
          :to="`/settings/${group.id}`"
          link-classes="settings-nav__link"
          replace
        ) {{ group.label }}

    div.settings-content
      template(v-for="group in groups")
        section.settings-section(v-show="activeGroup === group.id" :key="group.id")
          h4.settings-section__title {{ group.label }}
          p.text-muted.small.mb-3(v-if="group.help") {{ group.help }}
          component(v-for="comp in group.components" :key="comp.name" :is="comp.name")
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useCategoryStore } from '~/stores/categories';
import { useSettingsStore } from '~/stores/settings';
import ActivePatternSettings from '~/views/settings/ActivePatternSettings.vue';
import AwNotifySettings from '~/views/settings/AwNotifySettings.vue';
import CategorizationSettings from '~/views/settings/CategorizationSettings.vue';
import ColorSettings from '~/views/settings/ColorSettings.vue';
import DaystartSettings from '~/views/settings/DaystartSettings.vue';
import DeveloperSettings from '~/views/settings/DeveloperSettings.vue';
import LandingPageSettings from '~/views/settings/LandingPageSettings.vue';
import LanguageSettings from '~/views/settings/LanguageSettings.vue';
import PrivacyFilterSettings from '~/views/settings/PrivacyFilterSettings.vue';
import ReleaseNotificationSettings from '~/views/settings/ReleaseNotificationSettings.vue';
import Theme from '~/views/settings/Theme.vue';
import TimelineDurationSettings from '~/views/settings/TimelineDurationSettings.vue';
import UncategorizedHintSettings from '~/views/settings/UncategorizedHintSettings.vue';

interface Group {
  id: string;
  label: string;
  help?: string;
  components: { name: string }[];
}

export default defineComponent({
  name: 'Settings',
  components: {
    LanguageSettings,
    DaystartSettings,
    TimelineDurationSettings,
    ReleaseNotificationSettings,
    UncategorizedHintSettings,
    CategorizationSettings,
    LandingPageSettings,
    Theme,
    ColorSettings,
    DeveloperSettings,
    ActivePatternSettings,
    PrivacyFilterSettings,
    AwNotifySettings,
  },
  async beforeRouteLeave(to, from, next) {
    const categoryStore = useCategoryStore();
    if (categoryStore.classes_unsaved_changes) {
      const confirmed = await this.$bvModal.msgBoxConfirm(
        this.$t('settings.unsavedCategoriesLeave') as string,
        {
          title: this.$t('settings.unsavedCategoriesLeaveTitle') as string,
          okTitle: this.$t('settings.unsavedCategoriesLeaveOk') as string,
          cancelTitle: this.$t('settings.unsavedCategoriesLeaveCancel') as string,
          centered: true,
        },
      );
      if (confirmed) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  },
  props: {
    group: { type: String, default: '' },
  },
  computed: {
    activeGroup(): string {
      const requested = this.group || 'general';
      return this.groups.some((g) => g.id === requested) ? requested : 'general';
    },
    groups(): Group[] {
      const general: Group = {
        id: 'general',
        label: this.$t('settings.groups.general') as string,
        help: this.$t('settings.groups.generalHelp') as string,
        components: [
          { name: 'LanguageSettings' },
          { name: 'DaystartSettings' },
          { name: 'TimelineDurationSettings' },
          { name: 'LandingPageSettings' },
          { name: 'UncategorizedHintSettings' },
          ...(this.$isAndroid ? [] : [{ name: 'ReleaseNotificationSettings' }]),
        ],
      };
      const appearance: Group = {
        id: 'appearance',
        label: this.$t('settings.groups.appearance') as string,
        help: this.$t('settings.groups.appearanceHelp') as string,
        components: [{ name: 'Theme' }, { name: 'ColorSettings' }],
      };
      const categorization: Group = {
        id: 'categorization',
        label: this.$t('settings.groups.categorization') as string,
        help: this.$t('settings.groups.categorizationHelp') as string,
        components: [{ name: 'CategorizationSettings' }, { name: 'ActivePatternSettings' }],
      };
      const privacy: Group = {
        id: 'privacy',
        label: this.$t('settings.groups.privacy') as string,
        help: this.$t('settings.groups.privacyHelp') as string,
        components: [{ name: 'PrivacyFilterSettings' }],
      };
      const developer: Group = {
        id: 'developer',
        label: this.$t('settings.groups.developer') as string,
        components: [{ name: 'DeveloperSettings' }],
      };

      const notifications: Group = {
        id: 'notifications',
        label: this.$t('settings.notifications.title') as string,
        help: this.$t('settings.notifications.help') as string,
        components: [{ name: 'AwNotifySettings' }],
      };

      return [general, appearance, categorization, notifications, privacy, developer];
    },
  },
  async created() {
    await this.init();
  },
  methods: {
    async init() {
      const settingsStore = useSettingsStore();
      return settingsStore.load();
    },
  },
});
</script>

<style scoped lang="scss">
.settings-layout {
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr;
  gap: 2rem;
  margin-top: 0.5rem;
}

.settings-nav {
  position: sticky;
  // Clear the fixed navbar, which overlaps the top of the viewport
  top: calc(var(--aw-navbar-height) + 1rem);
  align-self: start;
}

::v-deep .settings-nav .nav-link {
  color: #495057;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.125rem;
}

::v-deep .settings-nav .nav-link:hover {
  background-color: #f0f1f3;
}

::v-deep .settings-nav .nav-link.active,
::v-deep .settings-nav .nav-link.active:hover {
  background-color: #495057 !important;
  color: #fff !important;
}

.settings-content {
  min-width: 0;
}

.settings-section {
  padding-bottom: 1rem;
}

.settings-section__title {
  margin-bottom: 0.25rem;
}

.settings-section ::v-deep > * + * {
  margin-top: 1.25rem;
}

.settings-section ::v-deep .form-group,
.settings-section ::v-deep .b-form-group {
  margin-bottom: 0;
}

.settings-section ::v-deep hr {
  margin: 1.5rem 0;
}

@media (max-width: 767.98px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .settings-nav {
    position: static;
    min-width: 0;
    max-width: 100%;
  }

  ::v-deep .settings-nav .nav {
    flex-direction: row !important;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  ::v-deep .settings-nav .nav-link {
    white-space: nowrap;
    padding: 0.375rem 0.625rem;
  }
}
</style>
