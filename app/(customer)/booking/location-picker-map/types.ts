export type LocationPickerMapNativeProps = {
  initialLat?: number | null;
  initialLng?: number | null;
  lat: number;
  lng: number;
  onCoordinateChange: (lat: number, lng: number) => void | Promise<void>;
};

/** Ref handle for imperative map actions (native only). */
export type LocationPickerMapNativeRef = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    duration?: number
  ) => void;
};
