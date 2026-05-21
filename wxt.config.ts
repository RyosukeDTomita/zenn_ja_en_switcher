import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Zenn JA/EN Switcher',
    description: 'Switch a Zenn article between Japanese and English with one click.',
    host_permissions: ['https://zenn.dev/*'],
  },
});
