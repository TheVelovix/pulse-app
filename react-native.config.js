// react-native.config.js
module.exports = {
  dependencies: {
    ...(process.env.EXPO_PUBLIC_STORE === "f-droid" && {
      "react-native-purchases": {
        platforms: { android: null },
      },
    }),
  },
};
