const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve .wasm files (required by expo-sqlite on web)
config.resolver.assetExts = [...(config.resolver.assetExts || []), "wasm"];

module.exports = config;
