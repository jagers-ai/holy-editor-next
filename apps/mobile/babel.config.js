module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: Metro handles @core alias via metro.config.js. No extra Babel plugins required.
  };
};
