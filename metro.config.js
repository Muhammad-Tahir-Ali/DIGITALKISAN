const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─── Web stubs for native-only modules ───────────────────────────────────────
// react-native-maps uses native code that doesn't exist on web.
// We redirect it to a no-op stub when bundling for web.

const nativeOnlyModules = {
  'react-native-maps': path.resolve(__dirname, 'mocks/react-native-maps.web.tsx'),
  // worklets-core uses JSI/TurboModules which don't exist on web → stub it out
  'react-native-worklets-core': path.resolve(__dirname, 'mocks/react-native-worklets-core.web.ts'),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && nativeOnlyModules[moduleName]) {
    return {
      filePath: nativeOnlyModules[moduleName],
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
