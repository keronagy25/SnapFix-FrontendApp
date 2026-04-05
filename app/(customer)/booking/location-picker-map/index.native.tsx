import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import type { LocationPickerMapNativeProps, LocationPickerMapNativeRef } from "./types";

/** Behind tiles / while SDK loads — default MapView loading bg is #fff which reads as a blank sheet. */
const MAP_SURFACE = "#CBD5E1";

function roundCoordinates(lat: number, lng: number) {
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };
}

export const LocationPickerMapNative = forwardRef<LocationPickerMapNativeRef, LocationPickerMapNativeProps>(
  function LocationPickerMapNative({ initialLat, initialLng, lat, lng, onCoordinateChange }, outerRef) {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(outerRef, () => ({
      animateToRegion: (region, duration = 350) => {
        mapRef.current?.animateToRegion(region, duration);
      },
    }));

    return (
      <View
        style={{ flex: 1, width: "100%", minHeight: 280, backgroundColor: MAP_SURFACE }}
        collapsable={false}
      >
        <MapView
          key={`loc-${initialLat ?? 0}-${initialLng ?? 0}`}
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          loadingBackgroundColor={MAP_SURFACE}
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
