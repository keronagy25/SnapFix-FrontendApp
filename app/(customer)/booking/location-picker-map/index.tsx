import React, { forwardRef, useImperativeHandle } from "react";
import type { LocationPickerMapNativeProps, LocationPickerMapNativeRef } from "./types";

/**
 * Web default: Leaflet is in create.tsx. Metro loads `index.native.tsx` on iOS/Android.
 */
export const LocationPickerMapNative = forwardRef<LocationPickerMapNativeRef, LocationPickerMapNativeProps>(
  function LocationPickerMapNative(_props, ref) {
    useImperativeHandle(ref, () => ({
      animateToRegion: () => {},
    }));
    return null;
  }
);
