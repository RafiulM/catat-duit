// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite ships a WebAssembly build for web. Metro needs to treat .wasm
// as an asset, otherwise web bundling fails on `wa-sqlite.wasm`.
config.resolver.assetExts.push('wasm');

module.exports = config;
