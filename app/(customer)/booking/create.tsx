import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  TextInput, Switch, Modal, Dimensions,
  KeyboardAvoidingView, Alert, Image,
  type LayoutChangeEvent,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LocationPickerMapNative } from "./location-picker-map";
import type { LocationPickerMapNativeRef } from "./location-picker-map/types";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, ChevronDown, CheckCircle, Zap,
  Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle,
  MapPin, Navigation, Crosshair, DollarSign, Plus, X, Image as ImageIcon,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import { getCategories, getRegions, type Category, type Region } from "@/services/coreService";
import { createBooking, createRecommendedBooking, saveRecommendedBookingCache, type CreateBookingPayload, type PhotoUpload } from "@/services/bookingService";

const { width, height } = Dimensions.get('window');

const roundCoordinates = (lat: number, lng: number) => {
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };
};

function getApiError(err: any, fallback = "Something went wrong."): string {
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail) return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      for (const val of Object.values(v)) { const s = tryExtract(val); if (s) return s; }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

function FeedbackModal({ ok, title, msg, onClose }: { ok: boolean; title: string; msg: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: ok ? "#10B981" : "#EF4444", paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>{ok ? "✅" : "⚠️"}</Text>
          </View>
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>{title}</Text>
            <View style={{ backgroundColor: ok ? "#ECFDF5" : "#FEF2F2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ok ? "#A7F3D0" : "#FECACA", marginBottom: 20, width: "100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: ok ? "#065F46" : "#991B1B", textAlign: "center", lineHeight: 22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: ok ? "#10B981" : "#0F172A", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, required = false, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B", marginBottom: 6 }}>
        {label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      {children}
      {!!error && (
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</Text>
      )}
    </View>
  );
}

const baseInput: any = {
  fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A",
  backgroundColor: "#F8FAFC", borderRadius: 14, borderWidth: 1.5,
  borderColor: "#E2E8F0", paddingHorizontal: 14, height: 50,
};
const errInput: any = { ...baseInput, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" };

function SelectPill({ selected, onPress, placeholder, hasError }: {
  selected: string; onPress: () => void; placeholder: string; hasError?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress}
      style={[hasError ? errInput : baseInput, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: selected ? "#0F172A" : "#94A3B8", flex: 1 }}>
        {selected || placeholder}
      </Text>
      <ChevronDown size={16} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function LocationPickerModal({ 
  visible, 
  onSelect, 
  onClose,
  initialLat,
  initialLng,
}: {
  visible: boolean;
  onSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>(() => {
    const lat = initialLat ?? 30.0444;
    const lng = initialLng ?? 31.2357;
    return { lat, lng };
  });
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const mapContainerRef = useRef<View>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapViewRef = useRef<LocationPickerMapNativeRef | null>(null);

  const initialLat_val = initialLat || 30.0444;
  const initialLng_val = initialLng || 31.2357;

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'BookingApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      }
    } catch (error) {
      console.log("Reverse geocoding error:", error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoadingAddress(false);
    }
    return "";
  };

  const detectCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required.");
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = roundCoordinates(location.coords.latitude, location.coords.longitude);
      setSelectedLocation({ lat: latitude, lng: longitude });
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 15);
      } else {
        mapViewRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
          350
        );
      }
      
      await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.log("Location detection error:", error);
      Alert.alert("Error", "Failed to detect your current location.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && address) {
      onSelect(selectedLocation.lat, selectedLocation.lng, address);
      onClose();
    } else {
      Alert.alert("Error", "Please select a location on the map first.");
    }
  };

  useEffect(() => {
    if (!visible) return;
    const lat = initialLat ?? 30.0444;
    const lng = initialLng ?? 31.2357;
    const rounded = roundCoordinates(lat, lng);
    setSelectedLocation({ lat: rounded.latitude, lng: rounded.longitude });
    void reverseGeocode(rounded.latitude, rounded.longitude);
  }, [visible, initialLat, initialLng]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (visible) return;
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {}
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [visible]);

  const scheduleLeafletInvalidate = (map: any) => {
    const run = () => {
      try {
        map.invalidateSize({ animate: false });
      } catch {}
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    setTimeout(run, 100);
    setTimeout(run, 400);
  };

  const ensureLeafletCss = () => {
    if (typeof document === "undefined") return;
    const id = "snapfix-leaflet-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  };

  const initializeMap = async () => {
    if (typeof window === "undefined" || Platform.OS !== "web") return;

    try {
      ensureLeafletCss();
      const L = await import("leaflet");
      const container = mapContainerRef.current;
      if (!container || mapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(container as any, { zoomControl: true, attributionControl: true }).setView(
        [initialLat_val, initialLng_val],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat_val, initialLng_val], { draggable: true }).addTo(map);
      markerRef.current = marker;

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        const rounded = roundCoordinates(lat, lng);
        setSelectedLocation({ lat: rounded.latitude, lng: rounded.longitude });
        marker.setLatLng([rounded.latitude, rounded.longitude]);
        await reverseGeocode(rounded.latitude, rounded.longitude);
      });

      marker.on("dragend", async () => {
        const latLng = marker.getLatLng();
        const rounded = roundCoordinates(latLng.lat, latLng.lng);
        setSelectedLocation({ lat: rounded.latitude, lng: rounded.longitude });
        await reverseGeocode(rounded.latitude, rounded.longitude);
      });

      mapInstanceRef.current = map;
      scheduleLeafletInvalidate(map);
    } catch (error) {
      console.log("Map initialization error:", error);
    }
  };

  const onWebMapContainerLayout = (e: LayoutChangeEvent) => {
    if (Platform.OS !== "web" || !visible) return;
    const { width, height: h } = e.nativeEvent.layout;
    if (width < 64 || h < 64) return;
    void initializeMap();
  };

  useEffect(() => {
    if (!visible || Platform.OS !== "web" || !markerRef.current) return;
    markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
  }, [visible, selectedLocation.lat, selectedLocation.lng]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 16, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#fff" }}>Select Location</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
          {Platform.OS === "web" ? (
            <View
              ref={mapContainerRef}
              onLayout={onWebMapContainerLayout}
              style={{ flex: 1, width: "100%", minHeight: Math.max(320, height * 0.45) }}
            />
          ) : (
            <LocationPickerMapNative
              ref={mapViewRef}
              initialLat={initialLat}
              initialLng={initialLng}
              lat={selectedLocation.lat}
              lng={selectedLocation.lng}
              onCoordinateChange={async (la: number, ln: number) => {
                setSelectedLocation({ lat: la, lng: ln });
                await reverseGeocode(la, ln);
              }}
            />
          )}

          <View style={{ position: "absolute", bottom: 20, right: 20, gap: 10 }}>
            <TouchableOpacity
              onPress={detectCurrentLocation}
              style={{ backgroundColor: "#fff", width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}
            >
              {detectingLocation ? <ActivityIndicator size="small" color="#1E3A8A" /> : <Crosshair size={24} color="#1E3A8A" />}
            </TouchableOpacity>
          </View>

          <View style={{ position: "absolute", bottom: 20, left: 20, right: 80, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <MapPin size={18} color="#1E3A8A" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#1E3A8A" }}>Selected Location</Text>
            </View>
            {loadingAddress ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : (
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
                {address || "Tap on map to select location"}
              </Text>
            )}
            {selectedLocation && (
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedLocation || !address}
            style={{ backgroundColor: selectedLocation && address ? "#1E3A8A" : "#CBD5E1", borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CategoryPickerModal({ visible, items, onSelect, onClose }: {
  visible: boolean; items: Category[]; onSelect: (item: Category) => void; onClose: () => void;
}) {
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "80%", paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 14 }}>Select Service Category</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => { onSelect(item); onClose(); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 15, color: "#0F172A" }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RegionPickerModal({ visible, items, onSelect, onClose }: {
  visible: boolean; items: Region[]; onSelect: (item: Region) => void; onClose: () => void;
}) {
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "80%", paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 14 }}>Select Region</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => { onSelect(item); onClose(); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 15, color: "#0F172A" }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPicker({ visible, value, onSelect, onClose }: {
  visible: boolean; value: string; onSelect: (d: string) => void; onClose: () => void;
}) {
  const today = new Date();
  const init = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [selected, setSelected] = useState(value);

  if (!visible) return null;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isSelected = (d: number) => toDateStr(d) === selected;
  const isToday = (d: number) => {
    const t = new Date();
    return d === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };
  const isPast = (d: number) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 28, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <TouchableOpacity onPress={prevMonth} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={18} color="#334155" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A" }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {DAYS.map(d => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8" }}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={{ width: `${100 / 7}%`, height: 42 }} />;
              const past = isPast(day);
              const sel = isSelected(day);
              const tod = isToday(day);
              return (
                <TouchableOpacity key={day} disabled={past} onPress={() => setSelected(toDateStr(day))}
                  style={{ width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center" }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
                    backgroundColor: sel ? "#1E3A8A" : tod ? "#EFF6FF" : "transparent",
                    borderWidth: tod && !sel ? 1.5 : 0,
                    borderColor: "#1E3A8A",
                  }}>
                    <Text style={{
                      fontFamily: sel ? Typography.fonts.bold : Typography.fonts.regular,
                      fontSize: 14,
                      color: sel ? "#fff" : past ? "#CBD5E1" : tod ? "#1E3A8A" : "#0F172A",
                    }}>{day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (selected) { onSelect(selected); onClose(); } }} disabled={!selected}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: selected ? "#1E3A8A" : "#E2E8F0", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: selected ? "#fff" : "#94A3B8" }}>
                {selected ? `Confirm ${selected}` : "Select a date"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimePicker({ visible, value, onSelect, onClose }: {
  visible: boolean; value: string; onSelect: (t: string) => void; onClose: () => void;
}) {
  const parseTime = (v: string) => {
    const parts = v?.split(":") ?? [];
    return { h: parseInt(parts[0] ?? "9") || 9, m: parseInt(parts[1] ?? "0") || 0 };
  };
  const init = parseTime(value);
  const [hour, setHour] = useState(init.h);
  const [minute, setMinute] = useState(init.m);
  const [ampm, setAmpm] = useState(init.h < 12 ? "AM" : "PM");

  if (!visible) return null;

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const confirm = () => {
    let h24 = hour % 12;
    if (ampm === "PM") h24 += 12;
    const timeStr = `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    onSelect(timeStr);
    onClose();
  };

  const display12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 20 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 28, padding: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 20 }}>Select Time</Text>

          <View style={{ flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 14, padding: 4, marginBottom: 20 }}>
            {["AM", "PM"].map(p => (
              <TouchableOpacity key={p} onPress={() => setAmpm(p)} style={{ flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: ampm === p ? "#1E3A8A" : "transparent", alignItems: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: ampm === p ? "#fff" : "#64748B" }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#94A3B8", marginBottom: 10, letterSpacing: 0.8 }}>HOUR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
            {hours12.map(h => (
              <TouchableOpacity key={h} onPress={() => setHour(h)}
                style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: display12 === h ? "#1E3A8A" : "#F8FAFC", borderWidth: 1.5, borderColor: display12 === h ? "#1E3A8A" : "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: display12 === h ? "#fff" : "#334155" }}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#94A3B8", marginBottom: 10, letterSpacing: 0.8 }}>MINUTE</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            {minutes.map(m => (
              <TouchableOpacity key={m} onPress={() => setMinute(m)}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 13, backgroundColor: minute === m ? "#1E3A8A" : "#F8FAFC", borderWidth: 1.5, borderColor: minute === m ? "#1E3A8A" : "#E2E8F0", alignItems: "center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: minute === m ? "#fff" : "#334155" }}>:{String(m).padStart(2, "0")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ backgroundColor: "#EFF6FF", borderRadius: 14, padding: 14, alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 28, color: "#1E3A8A", letterSpacing: 2 }}>
              {String(display12).padStart(2, "0")}:{String(minute).padStart(2, "0")} {ampm}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirm} style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: "#1E3A8A", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ✅ PAYMENT METHOD PICKER MODAL
function PaymentMethodModal({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: string; onSelect: (method: string) => void; onClose: () => void;
}) {
  if (!visible) return null;

  const methods = [
    { key: "cash", label: "💵 Cash", desc: "Pay provider directly in person" },
    { key: "wallet", label: "👛 Wallet", desc: "Use your in-app wallet balance" },
    { key: "card", label: "💳 Card", desc: "Pay with credit/debit card via Stripe" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 24 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 }} />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 14 }}>Payment Method</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {methods.map((method) => (
              <TouchableOpacity
                key={method.key}
                onPress={() => {
                  onSelect(method.key);
                  onClose();
                }}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F1F5F9",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected === method.key ? "#1E3A8A" : "#CBD5E1",
                    backgroundColor: selected === method.key ? "#1E3A8A" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected === method.key && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#0F172A" }}>{method.label}</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B", marginTop: 2 }}>{method.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Mode toggle component
function ModeToggle({ isRecommended, onToggle }: { isRecommended: boolean; onToggle: (val: boolean) => void }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A" }}>
            {isRecommended ? "✨ AI Recommended Mode" : "📢 Broadcast Mode"}
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B", marginTop: 2 }}>
            {isRecommended 
              ? "We'll find the best providers for you" 
              : "All providers in your area can pick up"}
          </Text>
        </View>
        <Switch
          value={isRecommended}
          onValueChange={onToggle}
          trackColor={{ false: "#E2E8F0", true: "#1E3A8A" }}
          thumbColor={isRecommended ? "#06B6D4" : "#94A3B8"}
        />
      </View>
    </View>
  );
}

function SRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#3B82F6" }}>{label}</Text>
      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#1D4ED8", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

export default function BookingCreateScreen() {
  const token = useAuthStore((s) => s.token);
  const params = useLocalSearchParams<{ category_id?: string; category_name?: string; is_urgent?: string; useBroadcast?: string; formData?: string; cacheId?: string }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [catPicker, setCatPicker] = useState(false);
  const [regPicker, setRegPicker] = useState(false);
  const [calPicker, setCalPicker] = useState(false);
  const [timePicker, setTimePicker] = useState(false);
  const [locationPicker, setLocationPicker] = useState(false);
  const [paymentMethodPicker, setPaymentMethodPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; title: string; msg: string } | null>(null);
  
  // Mode state - default to recommended mode
  const [isRecommendedMode, setIsRecommendedMode] = useState(true);
  
  // ✅ NEW: Photo states
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Check if we should default to broadcast mode from params
  useEffect(() => {
    if (params.useBroadcast === "true") {
      setIsRecommendedMode(false);
    }
    if (params.formData) {
      try {
        const savedFormData = JSON.parse(params.formData);
        // Pre-fill form if needed
        if (savedFormData) {
          setForm(prev => ({ ...prev, ...savedFormData }));
        }
      } catch (e) {
        console.error("Failed to parse form data", e);
      }
    }
  }, [params.useBroadcast, params.formData]);

  const [form, setForm] = useState({
    category_id: params.category_id ? Number(params.category_id) : 0,
    category_name: params.category_name ?? "",
    region_id: 0,
    region_name: "",
    address: "",
    floor_number: "",
    apartment_number: "",
    special_mark: "",
    latitude: null as number | null,
    longitude: null as number | null,
    title: "",
    description: "",
    preferred_date: "",
    preferred_time: "09:00:00",
    is_urgent: params.is_urgent === "true",
    estimated_price: "",
    payment_method: "cash" as "cash" | "card" | "wallet",
    wallet_amount: "",
  });

  const set = (key: string, val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  // ✅ Photo picker functions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions to upload photos');
        return false;
      }
      
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera permissions to take photos');
        return false;
      }
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset, index) => {
        const base64 = Platform.OS === 'web' && typeof asset.base64 === 'string' ? asset.base64 : undefined;
        return {
          uri: asset.uri,
          fileName: asset.fileName ?? `photo_${Date.now()}_${index}.jpg`,
          type: asset.type && asset.type !== 'image' ? asset.type : asset.uri?.endsWith('.png') ? 'image/png' : 'image/jpeg',
          base64,
        };
      });
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = Platform.OS === 'web' && typeof asset.base64 === 'string' ? asset.base64 : undefined;
      setPhotos([...photos, {
        uri: asset.uri,
        fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.type && asset.type !== 'image' ? asset.type : asset.uri?.endsWith('.png') ? 'image/png' : 'image/jpeg',
        base64,
      }]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  useEffect(() => {
    (async () => {
      setLoadingData(true);
      try {
        const [cats, regs] = await Promise.all([
          getCategories(token ?? undefined),
          getRegions(token ?? undefined),
        ]);
        setCategories(cats);
        setRegions(regs);
      } catch {
        setFeedback({ ok: false, title: "Failed to Load", msg: "Could not load form data. Please go back and try again." });
      } finally {
        setLoadingData(false);
      }
    })();
  }, [token]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.category_id) e.category = "Please select a service category";
    if (!form.region_id) e.region = "Please select a region";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.preferred_date) e.preferred_date = "Please select a date";
    if (!form.preferred_time) e.preferred_time = "Please select a time";
    if (photos.length === 0) e.photos = "Please upload at least one photo of the issue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    const rounded = roundCoordinates(lat, lng);
    set("latitude", rounded.latitude);
    set("longitude", rounded.longitude);
    set("address", address);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setFeedback({ ok: false, title: "Required Fields", msg: "Please fill in all required fields and upload at least one photo." });
      return;
    }
    if (!token) {
      setFeedback({ ok: false, title: "Not Logged In", msg: "Your session has expired. Please log in again." });
      return;
    }

    setSubmitting(true);
    setApiError(null);
    
    try {
      const latitude = form.latitude ? parseFloat(form.latitude.toFixed(6)) : undefined;
      const longitude = form.longitude ? parseFloat(form.longitude.toFixed(6)) : undefined;
      
      const payload: CreateBookingPayload = {
        category: form.category_id,
        region: form.region_id,
        address: form.address.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        floor_number: form.floor_number || undefined,
        apartment_number: form.apartment_number || undefined,
        special_mark: form.special_mark || undefined,
        latitude: latitude,
        longitude: longitude,
        is_urgent: form.is_urgent,
        estimated_price: form.estimated_price.trim() || undefined,
        payment_method: form.payment_method,
        wallet_amount: form.wallet_amount.trim() || undefined,
      };
      
      if (isRecommendedMode) {
        // NEW: Use recommended booking flow
        const response = await createRecommendedBooking(payload, token, photos);
        
        if (response.recommendations && response.recommendations.length > 0) {
          const cacheId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          saveRecommendedBookingCache(cacheId, {
            payload,
            photos,
          });

          router.push({
            pathname: "/(customer)/booking/recommendations",
            params: {
              data: JSON.stringify(response),
              cacheId,
            },
          });
        } else {
          // No providers available - offer broadcast option
          Alert.alert(
            "No Providers Available",
            "We couldn't find any providers matching your request. Would you like to create a broadcast request instead?",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Create Broadcast", 
                onPress: () => {
                  setIsRecommendedMode(false);
                  // Retry as broadcast
                  handleSubmit();
                }
              },
            ]
          );
        }
      } else {
        // Original broadcast flow
        const response = await createBooking(payload, token, photos);
        setSuccess(true);
      }
    } catch (err: any) {
      const d = err?.data ?? {};
      console.log("[BookingCreate] error:", JSON.stringify(d, null, 2));
      
      const fieldMap: Record<string, string> = {
        category: "category", region: "region", address: "address",
        title: "title", description: "description",
        preferred_date: "preferred_date", preferred_time: "preferred_time",
        floor_number: "floor_number", apartment_number: "apartment_number",
        latitude: "latitude", longitude: "longitude",
        special_mark: "special_mark", payment_method: "payment_method",
        wallet_amount: "wallet_amount", photos: "photos",
      };
      
      const inline: Record<string, string> = {};
      let hasInline = false;
      
      for (const [k, fk] of Object.entries(fieldMap)) {
        if (d[k]) {
          inline[fk] = Array.isArray(d[k]) ? d[k][0] : d[k];
          hasInline = true;
        }
      }
      
      if (hasInline) {
        setErrors(inline);
        setApiError("Please fix the highlighted fields below.");
      } else {
        const msg = getApiError(err, "Failed to create booking.");
        setApiError(msg);
        setFeedback({ ok: false, title: "Booking Failed", msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const displayDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-EG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="dark-content" />
        <View>
          <View style={{ width: 100, height: 100, borderRadius: 30, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <CheckCircle size={52} color="#10B981" />
          </View>
        </View>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 24, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>Booking Submitted!</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          Your request is now pending.{"\n"}We'll assign a provider shortly.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(customer)/booking" as any)}
          style={{ backgroundColor: "#1E3A8A", paddingHorizontal: 36, paddingVertical: 16, borderRadius: 18, width: "100%", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(customer)/home" as any)}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "#94A3B8" }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff" }}>New Booking</Text>
          </View>
        </LinearGradient>
        {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading form…</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff" }}>New Booking</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Fill in all required fields</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === "ios" ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {apiError && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, marginBottom: 4, marginTop: 4, borderWidth: 1, borderColor: "#FECACA" }}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.medium, fontSize: 13, color: "#EF4444" }}>{apiError}</Text>
          </View>
        )}

        {/* Mode Toggle */}
        <ModeToggle isRecommended={isRecommendedMode} onToggle={setIsRecommendedMode} />

        {/* ✅ PHOTO UPLOAD SECTION */}
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>
              📸 Photos <Text style={{ color: "#EF4444" }}>* (Required - at least 1)</Text>
            </Text>
            
            {/* Photo Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {photos.map((photo, index) => (
                <View key={index} style={{ position: 'relative' }}>
                  <Image 
                    source={{ uri: typeof photo === 'string' ? photo : photo.uri }} 
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                  />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      padding: 4,
                    }}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add Photo Buttons */}
              <TouchableOpacity
                onPress={pickImages}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  backgroundColor: "#F1F5F9",
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  borderStyle: 'dashed',
                }}
              >
                <ImageIcon size={24} color="#64748B" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  Gallery
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  backgroundColor: "#F1F5F9",
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  borderStyle: 'dashed',
                }}
              >
                <Plus size={24} color="#64748B" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
            
            {errors.photos && (
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#EF4444", marginTop: 12 }}>
                ⚠ {errors.photos}
              </Text>
            )}
            
            {photos.length > 0 && (
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#10B981", marginTop: 8 }}>
                ✓ {photos.length} photo(s) selected
              </Text>
            )}
          </View>
        </View>

        {/* SERVICE DETAILS */}
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>🔧 Service Details</Text>
            <Field label="Service Category" required error={errors.category}>
              <SelectPill selected={form.category_name} onPress={() => setCatPicker(true)} placeholder="Select a category" hasError={!!errors.category} />
            </Field>
            <Field label="Title" required error={errors.title}>
              <TextInput value={form.title} onChangeText={v => set("title", v)} placeholder="e.g. Leaking pipe under sink"
                style={errors.title ? errInput : baseInput} />
            </Field>
            <Field label="Description" required error={errors.description}>
              <TextInput value={form.description} onChangeText={v => set("description", v)}
                placeholder="Describe the issue in detail…" multiline numberOfLines={3}
                style={[errors.description ? errInput : baseInput, { height: 90, paddingTop: 12, textAlignVertical: "top" }]} />
            </Field>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9", marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Zap size={16} color={form.is_urgent ? "#EF4444" : "#94A3B8"} />
                <View>
                  <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: form.is_urgent ? "#EF4444" : "#64748B" }}>Mark as Urgent</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8" }}>Provider arrives within 30 min</Text>
                </View>
              </View>
              <Switch value={form.is_urgent} onValueChange={v => set("is_urgent", v)}
                trackColor={{ false: "#E2E8F0", true: "#FECACA" }} thumbColor={form.is_urgent ? "#EF4444" : "#94A3B8"} />
            </View>
          </View>
        </View>

        {/* LOCATION DETAILS */}
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>📍 Location Details</Text>
            
            <Field label="Region" required error={errors.region}>
              <SelectPill selected={form.region_name} onPress={() => setRegPicker(true)} placeholder="Select your region" hasError={!!errors.region} />
            </Field>
            
            <Field label="Street Address" required error={errors.address}>
              <TouchableOpacity 
                onPress={() => setLocationPicker(true)}
                style={[errors.address ? errInput : baseInput, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                <MapPin size={17} color={form.address ? "#1E3A8A" : "#94A3B8"} />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: form.address ? "#0F172A" : "#94A3B8", flex: 1 }} numberOfLines={2}>
                  {form.address || "Tap to select location on map"}
                </Text>
                <Navigation size={16} color="#1E3A8A" />
              </TouchableOpacity>
            </Field>
            
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Field label="Floor Number">
                  <TextInput
                    value={form.floor_number}
                    onChangeText={v => set("floor_number", v)}
                    placeholder="e.g., 3"
                    keyboardType="numeric"
                    style={baseInput}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Apartment Number">
                  <TextInput
                    value={form.apartment_number}
                    onChangeText={v => set("apartment_number", v)}
                    placeholder="e.g., 12"
                    keyboardType="numeric"
                    style={baseInput}
                  />
                </Field>
              </View>
            </View>
            
            <Field label="Special Mark (Optional)">
              <TextInput
                value={form.special_mark}
                onChangeText={v => set("special_mark", v)}
                placeholder="e.g., Blue door on the left, Near the elevator…"
                multiline
                numberOfLines={3}
                style={[baseInput, { height: 80, paddingTop: 12, textAlignVertical: "top" }]}
              />
            </Field>
            
            {(form.latitude && form.longitude) && (
              <View style={{ marginTop: 8, padding: 10, backgroundColor: "#F0F9FF", borderRadius: 12 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#0369A1" }}>
                  📍 Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SCHEDULE */}
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>📅 Schedule</Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Preferred Date" required error={errors.preferred_date}>
                  <TouchableOpacity onPress={() => setCalPicker(true)}
                    style={[errors.preferred_date ? errInput : baseInput, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <Calendar size={17} color={form.preferred_date ? "#1E3A8A" : "#94A3B8"} />
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: form.preferred_date ? "#0F172A" : "#94A3B8", flex: 1 }} numberOfLines={1}>
                      {form.preferred_date ? displayDate(form.preferred_date) : "Pick date"}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>

              <View style={{ flex: 1 }}>
                <Field label="Preferred Time" required error={errors.preferred_time}>
                  <TouchableOpacity onPress={() => setTimePicker(true)}
                    style={[errors.preferred_time ? errInput : baseInput, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <Clock size={17} color={form.preferred_time ? "#1E3A8A" : "#94A3B8"} />
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: form.preferred_time ? "#0F172A" : "#94A3B8" }}>
                      {form.preferred_time ? displayTime(form.preferred_time) : "Pick time"}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>
            </View>

            <Field label="Estimated Price (EGP)">
              <TextInput value={form.estimated_price} onChangeText={v => set("estimated_price", v)}
                placeholder="Optional — leave blank if unsure" keyboardType="decimal-pad" style={baseInput} />
            </Field>
          </View>
        </View>

        {/* ✅ PAYMENT METHOD */}
        <View>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 14 }}>💳 Payment</Text>
            
            <Field label="Payment Method">
              <SelectPill
                selected={form.payment_method === "cash" ? "💵 Cash" : form.payment_method === "wallet" ? "👛 Wallet" : "💳 Card"}
                onPress={() => setPaymentMethodPicker(true)}
                placeholder="Select payment method"
              />
            </Field>

            {form.payment_method === "card" && (
              <Field label="Wallet Amount (Optional)">
                <TextInput
                  value={form.wallet_amount}
                  onChangeText={v => set("wallet_amount", v)}
                  placeholder="How much from wallet? (0 = none)"
                  keyboardType="decimal-pad"
                  style={baseInput}
                />
              </Field>
            )}

            {form.payment_method === "wallet" && (
              <View style={{ backgroundColor: "#ECFDF5", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#A7F3D0" }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#065F46" }}>
                  Full payment will come from your wallet balance.
                </Text>
              </View>
            )}

            {form.payment_method === "card" && (
              <View style={{ backgroundColor: "#EFF6FF", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#BFDBFE" }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#1E40AF" }}>
                  Card will be charged after approval. You can adjust wallet amount when confirming the quote.
                </Text>
              </View>
            )}

            {form.payment_method === "cash" && (
              <View style={{ backgroundColor: "#FFFBEB", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#FDE68A" }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#92400E" }}>
                  Pay the provider directly in cash when they arrive.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* BOOKING SUMMARY */}
        {(form.category_name || form.region_name || form.title || form.floor_number || form.apartment_number || form.special_mark) && (
          <View>
            <View style={{ backgroundColor: "#EFF6FF", borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#BFDBFE" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#1D4ED8", marginBottom: 10, letterSpacing: 0.5 }}>📋 BOOKING SUMMARY</Text>
              {form.category_name && <SRow label="Service" value={form.category_name} />}
              {form.title && <SRow label="Issue" value={form.title} />}
              {form.region_name && <SRow label="Region" value={form.region_name} />}
              {form.address && <SRow label="Address" value={form.address.length > 40 ? form.address.substring(0, 40) + "..." : form.address} />}
              {(form.floor_number || form.apartment_number) && (
                <SRow label="Unit" value={`Floor ${form.floor_number || '?'}, Apt ${form.apartment_number || '?'}`} />
              )}
              {form.special_mark && <SRow label="Special Mark" value={form.special_mark.length > 30 ? form.special_mark.substring(0, 30) + "..." : form.special_mark} />}
              {form.preferred_date && <SRow label="Date" value={displayDate(form.preferred_date)} />}
              {form.preferred_time && <SRow label="Time" value={displayTime(form.preferred_time)} />}
              {form.is_urgent && <SRow label="Urgency" value="🚨 Urgent" />}
              {form.estimated_price && <SRow label="Est. Price" value={`${form.estimated_price} EGP`} />}
              {form.payment_method && <SRow label="Payment" value={form.payment_method === "cash" ? "💵 Cash" : form.payment_method === "wallet" ? "👛 Wallet" : "💳 Card"} />}
              {photos.length > 0 && <SRow label="Photos" value={`${photos.length} photo(s) attached`} />}
            </View>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <View>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.88}
            style={{ borderRadius: 18, overflow: "hidden", opacity: submitting ? 0.75 : 1 }}>
            <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}>
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <><CheckCircle size={18} color="#06B6D4" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Submit Booking</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers */}
      <CategoryPickerModal visible={catPicker} items={categories} onSelect={(item) => { set("category_id", item.id); set("category_name", item.name); }} onClose={() => setCatPicker(false)} />
      <RegionPickerModal visible={regPicker} items={regions} onSelect={(item) => { set("region_id", item.id); set("region_name", item.name); }} onClose={() => setRegPicker(false)} />
      <LocationPickerModal visible={locationPicker} onSelect={handleLocationSelect} onClose={() => setLocationPicker(false)} initialLat={form.latitude} initialLng={form.longitude} />
      <CalendarPicker visible={calPicker} value={form.preferred_date} onSelect={d => set("preferred_date", d)} onClose={() => setCalPicker(false)} />
      <TimePicker visible={timePicker} value={form.preferred_time} onSelect={t => set("preferred_time", t)} onClose={() => setTimePicker(false)} />
      <PaymentMethodModal visible={paymentMethodPicker} selected={form.payment_method} onSelect={m => set("payment_method", m)} onClose={() => setPaymentMethodPicker(false)} />
    </KeyboardAvoidingView>
  );
}