import type { ComponentType } from 'react';
import { lazy } from 'react';

const ChatPage = lazy(() => import('./PlaygroundPage').then(m => ({ default: m.ChatPage })));
const WorkflowPage = lazy(() => import('./PlaygroundPage').then(m => ({ default: m.WorkflowPage })));

interface PluginFrontendModule {
  routes?: Array<{ path: string; component: ComponentType }>;
}

const plugin: PluginFrontendModule = {
  routes: [
    { path: '/playground', component: ChatPage },
    { path: '/chat', component: ChatPage },
    { path: '/studio', component: WorkflowPage },
  ],
};

export default plugin;
