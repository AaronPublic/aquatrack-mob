const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable unstable_enablePackageExports to prevent Node-core module resolution errors
// (such as 'stream' or 'ws' imports inside the Supabase client)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
