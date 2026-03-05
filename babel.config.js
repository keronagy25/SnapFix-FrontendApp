// babel.config.js - Must use module.exports NOT export default
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        { jsxImportSource: "nativewind" },
      ],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@":           "./src",
            "@components": "./src/components",
            "@hooks":      "./src/hooks",
            "@store":      "./src/store",
            "@services":   "./src/services",
            "@theme":      "./src/theme",
            "@utils":      "./src/utils",
            "@types":      "./src/types",
          },
        },
      ],
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};