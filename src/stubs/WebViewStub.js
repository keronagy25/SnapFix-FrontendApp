import React from "react";
import { View, Text } from "react-native";

// Stub for react-native-webview on web platform
const WebView = ({ style, ...props }) => (
  <View style={style}>
    <Text>WebView not supported on web</Text>
  </View>
);

export { WebView };
export default WebView;
