const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind }   = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ["ios", "android", "native", "web"];
config.projectRoot        = path.resolve(__dirname);
config.watchFolders       = [path.resolve(__dirname)];

module.exports = withNativeWind(config, {
  // Use absolute path to avoid Windows resolution issues
  input: path.join(__dirname, "global.css"),
});