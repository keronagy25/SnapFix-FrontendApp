const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind }   = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ["ios", "android", "native", "web"];
config.projectRoot        = path.resolve(__dirname);
config.watchFolders       = [path.resolve(__dirname)];

const mapsWebShim = path.resolve(__dirname, "src/shims/react-native-maps.web.tsx");
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: mapsWebShim };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  // Use absolute path to avoid Windows resolution issues
  input: path.join(__dirname, "global.css"),
});