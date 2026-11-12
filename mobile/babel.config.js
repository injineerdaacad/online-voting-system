module.exports = function (api) {
  api.cache(true);
  return {
    // unstable_transformImportMeta: zustand's ESM build uses import.meta,
    // which breaks the web bundle (it is not loaded as a module).
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};