import { defineConfig } from 'wxt';
import { ALLOWED_SHOPPING_SITES } from './constants';

// Detect development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.COMMAND === 'serve';

// Content Security Policy - more permissive in development for hot reload
const getCSP = () => {
  const baseCSP = "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';";
  
  if (isDev) {
    // Allow WebSocket connections to localhost for development server
    return `${baseCSP} connect-src 'self' https://openrouter.ai ws://localhost:* http://localhost:*;`;
  } else {
    // Strict policy for production
    return `${baseCSP} connect-src 'self' https://openrouter.ai;`;
  }
};

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Virtual Try-On',
    description: 'Virtual try-on extension scaffold using WXT + React.',
    permissions: [
      'storage',
      'contextMenus',
      'activeTab',
    ],
    host_permissions: ALLOWED_SHOPPING_SITES,
    content_security_policy: {
      extension_pages: getCSP()
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  },
});
