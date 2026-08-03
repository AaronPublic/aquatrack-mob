const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable unstable_enablePackageExports to prevent Node-core module resolution errors
// (such as 'stream' or 'ws' imports inside the Supabase client)
config.resolver.unstable_enablePackageExports = false;

// Exclude transient native android build folders and temp gradle caches from the watcher
config.resolver.blockList = [
  /node_modules\/.*\/build\/.*/,
  /node_modules\/.*\.gradle\/.*/,
  /android\/app\/build\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
