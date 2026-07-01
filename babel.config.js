module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@agents": "./src/agents",
            "@hooks": "./src/hooks",
            "@utils": "./src/utils",
            "@styles": "./src/styles",
            "@store": "./src/store",
            "@types": "./src/types",
            "@constants": "./src/constants",
            "@data": "./src/data"
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
