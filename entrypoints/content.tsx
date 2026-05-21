import ReactDOM from 'react-dom/client';
import { LocaleToggle } from '../components/LocaleToggle';

export default defineContentScript({
  matches: ['https://zenn.dev/*/articles/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'zenn-locale-toggle',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<LocaleToggle />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
