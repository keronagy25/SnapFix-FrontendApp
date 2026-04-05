import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import type { LocationPickerMapNativeProps, LocationPickerMapNativeRef } from "./types";

function roundCoordinates(lat: number, lng: number) {
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };
}

export const LocationPickerMapNative = forwardRef<LocationPickerMapNativeRef, LocationPickerMapNativeProps>(
  function LocationPickerMapNative({ initialLat, initialLng, lat, lng, onCoordinateChange }, outerRef) {
    const mapRef = useRef<MapView>(null);
    const { height: winH } = useWindowDimensions();
    // MapView inside Modal often gets 0 height with flex-only layout on iOS/Android.
    const mapHeight = Math.max(320, Math.round(winH * 0.52));

    useImperativeHandle(outerRef, () => ({
      animateToRegion: (region, duration = 350) => {
        mapRef.current?.animateToRegion(region, duration);
      },
    }));

    return (
      <View style={{ width: "100%", height: mapHeight }} collapsable={false}>
      <MapView
        key={`loc-${initialLat ?? 0}-${initialLng ?? 0}`}
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={async (e) => {
          const coord = e.nativeEvent.coordinate;
          if (!coord) return;
          const rounded = roundCoordinates(coord.latitude, coord.longitude);
          await onCoordinateChange(rounded.latitude, rounded.longitude);
        }}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          onDragEnd={async (ev) => {
            const c = ev.nativeEvent.coordinate;
            const rounded = roundCoordinates(c.latitude, c.longitude);
            await onCoordinateChange(rounded.latitude, rounded.longitude);
          }}
        />
      </MapView>
      </View>
    );
  }
);
