import PlaygroundPage from './PlaygroundPage';
import type { ComponentType } from 'react';

interface PluginFrontendModule {
  routes?: Array<{ path: string; component: ComponentType }>;
}

const plugin: PluginFrontendModule = {
  routes: [
    { path: '/playground', component: PlaygroundPage },
  ],
};

export default plugin;
