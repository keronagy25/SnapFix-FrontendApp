/**
 * Web stub: Metro may still resolve `react-native-maps` on web; the real native
 * implementation uses `codegenNativeComponent`, which react-native-web does not provide.
 */
import React from "react";
import { View } from "react-native";

export const PROVIDER_GOOGLE = "google";

export function Marker() {
  return null;
}

const MapView = React.forwardRef<View, React.ComponentProps<typeof View>>(function MapViewStub(props, ref) {
  return <View {...props} ref={ref} collapsable={false} />;
});

export default MapView;
