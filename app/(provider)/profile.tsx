import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Alert, TextInput, RefreshControl,
  ImageBackground, Modal, Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, User, Mail, Phone, Star,
  Briefcase, CheckCircle, Clock, Edit3,
  Save, X, RefreshCw, AlertCircle,
  DollarSign, Shield, MapPin, TrendingUp,
  Award, BarChart2, Wallet, Camera,
  Navigation, Crosshair, Activity,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  getProviderProfile,
  updateProviderProfile,
  updateProviderProfilePicture,
  updateProviderLocation,
  type ProviderProfile,
} from "@/services/providerService";

/* ─── helpers ───────────────────────────────────────────────────── */
const fmt = (v: string | number | null | undefined, suffix = "") =>
  v != null && v !== "" ? `${v}${suffix}` : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

const roundCoordinates = (lat: number, lng: number) => {
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
  };
};

/* ══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */
function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginBottom: 10, marginTop: 24 }}>
      {label}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      {children}
    </View>
  );
}

function InfoRow({ icon: Icon, label, value, color = "#3B82F6", last = false }: { icon: any; label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F1F5F9" }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Icon size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A" }} numberOfLines={3}>{value}</Text>
      </View>
    </View>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={17} color={color} />
      </View>
      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A" }}>{value}</Text>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: "#94A3B8", marginTop: 2, textAlign: "center" }}>{label}</Text>
      {sub && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: color, marginTop: 1 }}>{sub}</Text>}
    </View>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    verified: { label: "Verified", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle },
    pending: { label: "Under Review", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: Clock },
    rejected: { label: "Rejected", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: AlertCircle },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: cfg.bg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: cfg.border }}>
      <cfg.icon size={13} color={cfg.color} />
      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function EditField({ label, value, onChange, multiline = false, keyboardType = "default", error }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboardType?: any; error?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        style={{
          fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A",
          backgroundColor: error ? "#FEF2F2" : "#F8FAFC",
          borderRadius: 12, borderWidth: 1.5,
          borderColor: error ? "#FCA5A5" : "#E2E8F0",
          paddingHorizontal: 14, paddingVertical: multiline ? 10 : 0,
          height: multiline ? 80 : 48, textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {error && (
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</Text>
      )}
    </View>
  );
}

// Location Detection Modal (Same as create screen)
function LocationDetectModal({
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
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(initialLat || null);
  const [longitude, setLongitude] = useState<number | null>(initialLng || null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'SnapFix/1.0' } }
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
      if (!navigator.geolocation) {
        Alert.alert("Error", "Geolocation is not supported");
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      const rounded = roundCoordinates(lat, lng);
      
      setLatitude(rounded.latitude);
      setLongitude(rounded.longitude);
      await reverseGeocode(rounded.latitude, rounded.longitude);
      Alert.alert("Location Detected", "Your current location has been detected.");
    } catch (error: any) {
      let errorMessage = "Failed to detect location.";
      if (error.code === 1) errorMessage = "Location permission denied.";
      else if (error.code === 2) errorMessage = "Location unavailable.";
      else if (error.code === 3) errorMessage = "Location request timed out.";
      Alert.alert("Error", errorMessage);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (latitude && longitude) {
      onSelect(latitude, longitude, address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      onClose();
    } else {
      Alert.alert("Error", "Please detect your location first.");
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 16, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#fff" }}>Detect Location</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
          <TouchableOpacity
            onPress={detectCurrentLocation}
            disabled={detectingLocation}
            style={{
              backgroundColor: "#1E3A8A",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}>
            {detectingLocation ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Crosshair size={48} color="#fff" />
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#fff", marginTop: 12 }}>
                  Detect Current Location
                </Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 8, textAlign: "center" }}>
                  Use GPS to get your current location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {(latitude && longitude) && (
            <View style={{
              backgroundColor: "#F0F9FF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "#BAE6FD"
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <MapPin size={20} color="#0369A1" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0369A1" }}>
                  Detected Location
                </Text>
              </View>
              {loadingAddress ? (
                <ActivityIndicator size="small" color="#0369A1" />
              ) : (
                <>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#0F172A", lineHeight: 20, marginBottom: 8 }}>
                    {address || "Address detected"}
                  </Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B" }}>
                    📍 Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#E2E8F0" }}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!latitude || !longitude}
            style={{
              backgroundColor: (latitude && longitude) ? "#1E3A8A" : "#CBD5E1",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center"
            }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>
              Use This Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Location Tracker Component (Updates every 60 seconds using expo-location)
function LocationTracker({ isActive, onLocationUpdate }: { isActive: boolean; onLocationUpdate?: (lat: number, lng: number) => void }) {
  const token = useAuthStore((s) => s.token);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; time: Date } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const sendLocation = async (latitude: number, longitude: number) => {
    if (!token || !isActive) return;

    try {
      const rounded = roundCoordinates(latitude, longitude);
      await updateProviderLocation(rounded.latitude, rounded.longitude, token);
      setLastLocation({ lat: rounded.latitude, lng: rounded.longitude, time: new Date() });
      setTrackingError(null);
      onLocationUpdate?.(rounded.latitude, rounded.longitude);
      console.log('[LocationTracker] Location sent:', rounded);
    } catch (err: any) {
      console.error('[LocationTracker] Location update failed:', err);
      setTrackingError(err?.data?.detail || 'Failed to update location');
    }
  };

  // Using expo-location instead of navigator.geolocation
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setTrackingError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      await sendLocation(latitude, longitude);
    } catch (err) {
      console.error('[LocationTracker] Error getting location:', err);
      setTrackingError('Failed to get current location');
    }
  };

  const startTracking = () => {
    if (!isActive) return;

    setIsTracking(true);
    console.log('[LocationTracker] Starting location tracking (every 60 seconds)');
    
    // Send initial location immediately
    getCurrentLocation();

    // Set up interval for periodic updates (every 60 seconds)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (isActive) {
        console.log('[LocationTracker] Scheduled location update');
        getCurrentLocation();
      }
    }, 60000) as unknown as number;
  };

  const stopTracking = () => {
    setIsTracking(false);
    console.log('[LocationTracker] Stopping location tracking');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isActive, token]);

  if (!isActive) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowStatus(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: isTracking && !trackingError ? '#10B981' : '#EF4444',
          borderRadius: 40,
          padding: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          zIndex: 1000,
        }}
      >
        <Activity size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showStatus} transparent animationType="fade" onRequestClose={() => setShowStatus(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: '#0F172A', marginBottom: 16 }}>
              Location Tracking Status
            </Text>
            
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: '#065F46' }}>
                Status: {isTracking ? '✓ Active' : '● Inactive'}
              </Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: '#047857', marginTop: 4 }}>
                Last update: {lastLocation ? lastLocation.time.toLocaleTimeString() : 'Never'}
              </Text>
              {lastLocation && (
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: '#047857', marginTop: 4 }}>
                  Lat: {lastLocation.lat.toFixed(6)}, Lng: {lastLocation.lng.toFixed(6)}
                </Text>
              )}
            </View>

            {trackingError && (
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: '#EF4444' }}>
                  Error: {trackingError}
                </Text>
              </View>
            )}

            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: '#64748B', marginBottom: 16, textAlign: 'center' }}>
              Location updates every 60 seconds while available
            </Text>

            <TouchableOpacity
              onPress={() => {
                getCurrentLocation();
                Alert.alert('Update', 'Manual location update triggered');
              }}
              style={{ backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: '#fff' }}>
                Update Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowStatus(false)}
              style={{ backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: '#64748B' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
export default function ProviderProfileScreen() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [locationDetectOpen, setLocationDetectOpen] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [currentLiveLocation, setCurrentLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    business_name: "",
    hourly_rate: "",
    years_of_experience: "",
    is_available: false,
    profile_picture_uri: "",
  });

  const fetchProfile = async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getProviderProfile(token);
      setProfile(data);
      setUser({ ...data, role: "provider" } as any);
      setIsTrackingActive(data.is_available);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [token]);

  const openEdit = () => {
    setEditForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      phone: profile?.phone ?? "",
      bio: profile?.bio ?? "",
      address: profile?.address ?? "",
      latitude: profile?.latitude ?? null,
      longitude: profile?.longitude ?? null,
      business_name: profile?.business_name ?? "",
      hourly_rate: profile?.hourly_rate ?? "",
      years_of_experience: String(profile?.years_of_experience ?? ""),
      is_available: profile?.is_available ?? false,
      profile_picture_uri: "",
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setEditForm(f => ({ ...f, profile_picture_uri: result.assets[0].uri }));
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setEditForm(f => ({ ...f, latitude: lat, longitude: lng, address: address }));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setEditErrors({});
    
    try {
      // Upload profile picture if changed
      if (editForm.profile_picture_uri && editForm.profile_picture_uri !== profile?.profile_picture) {
        setUploadingPicture(true);
        try {
          const updated = await updateProviderProfilePicture(editForm.profile_picture_uri, token);
          setProfile(updated);
          setUser({ ...updated, role: "provider" } as any);
        } catch (err: any) {
          console.log("Picture upload error:", err);
          Alert.alert("Warning", "Profile picture upload failed, but other changes will be saved.");
        } finally {
          setUploadingPicture(false);
        }
      }
      
      // Update text fields
      const payload: any = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim(),
        bio: editForm.bio.trim(),
        address: editForm.address.trim(),
        business_name: editForm.business_name.trim(),
        hourly_rate: editForm.hourly_rate.trim(),
        is_available: editForm.is_available,
      };

      if (editForm.years_of_experience && editForm.years_of_experience !== "") {
        payload.years_of_experience = Number(editForm.years_of_experience);
      }

      if (editForm.latitude !== null && editForm.longitude !== null) {
        payload.latitude = editForm.latitude;
        payload.longitude = editForm.longitude;
      }

      const updated = await updateProviderProfile(payload, token);
      setProfile(updated);
      setUser({ ...updated, role: "provider" } as any);
      setIsTrackingActive(updated.is_available);
      setEditOpen(false);
      Alert.alert("✓ Saved", "Your profile has been updated successfully.");
    } catch (err: any) {
      console.log("[ProfileSave] Error:", err);
      const d = err?.data ?? {};
      const fields = ["first_name", "last_name", "phone", "bio", "address", "business_name", "hourly_rate", "years_of_experience", "latitude", "longitude"];
      const inline: Record<string, string> = {};
      let hasField = false;
      for (const f of fields) {
        if (d[f]) { inline[f] = Array.isArray(d[f]) ? d[f][0] : d[f]; hasField = true; }
      }
      if (hasField) {
        setEditErrors(inline);
        Alert.alert("Fix Errors", "Please fix the highlighted fields.");
      } else {
        const msg = d?.detail ?? d?.non_field_errors?.[0] ?? err?.message ?? "Failed to save profile.";
        Alert.alert("Save Failed", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    setCurrentLiveLocation({ lat, lng });
  };

  const firstName = profile?.first_name ?? "Provider";
  const lastName = profile?.last_name ?? "";
  const initials = `${firstName[0] ?? "P"}${lastName[0] ?? ""}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();
  const profilePicture = profile?.profile_picture;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading profile…</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 8, textAlign: "center" }}>Could not load profile</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => fetchProfile()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0F172A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
          <RefreshCw size={16} color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Location Tracker - Updates every 60 seconds when available */}
      <LocationTracker isActive={isTrackingActive} onLocationUpdate={handleLocationUpdate} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}
      >
        {/* HEADER */}
        <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 36, paddingHorizontal: 20, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(6,182,212,0.07)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(59,130,246,0.05)" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
            <TouchableOpacity onPress={() => router.back()}
              style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={openEdit}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(6,182,212,0.15)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" }}>
              <Edit3 size={15} color="#06B6D4" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#06B6D4" }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center" }}>
            <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: "rgba(6,182,212,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2.5, borderColor: "rgba(6,182,212,0.4)", overflow: "hidden" }}>
              {profilePicture ? (
                <ImageBackground source={{ uri: profilePicture }} style={{ width: "100%", height: "100%" }} imageStyle={{ borderRadius: 28 }}>
                  <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 32, color: "#fff" }}>{initials}</Text>
                  </View>
                </ImageBackground>
              ) : (
                <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 32, color: "#06B6D4" }}>{initials}</Text>
              )}
            </View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff", marginBottom: 4 }}>{fullName}</Text>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              {profile?.business_name ?? ""}
            </Text>
            <VerificationBadge status={profile?.verification_status ?? "pending"} />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: profile?.is_available ? "#10B981" : "#64748B" }} />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: profile?.is_available ? "#10B981" : "#64748B" }}>
                {profile?.is_available ? "Available for jobs" : "Not available"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>
          {/* STATS ROW 1 */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <StatCard icon={Star} label="Avg. Rating" value={fmt(profile?.average_rating)} color="#F59E0B" sub={`${profile?.total_reviews ?? 0} reviews`} />
            <StatCard icon={Briefcase} label="Total Jobs" value={fmt(profile?.total_jobs)} color="#3B82F6" sub={`${profile?.completed_jobs ?? 0} done`} />
            <StatCard icon={BarChart2} label="Completion" value={`${profile?.completion_rate ?? 0}%`} color="#8B5CF6" />
          </View>

          {/* STATS ROW 2 */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <StatCard icon={Wallet} label="Balance" value={`${profile?.available_balance ?? "0.00"} EGP`} color="#10B981" />
            <StatCard icon={TrendingUp} label="Total Earnings" value={`${profile?.total_earnings ?? "0.00"} EGP`} color="#06B6D4" />
            <StatCard icon={DollarSign} label="Hourly Rate" value={`${profile?.hourly_rate ?? "—"} EGP`} color="#EC4899" />
          </View>

          {/* PERSONAL INFO */}
          <SectionLabel label="PERSONAL INFORMATION" />
          <Card>
            <InfoRow icon={User} label="First Name" value={fmt(profile?.first_name)} color="#3B82F6" />
            <InfoRow icon={User} label="Last Name" value={fmt(profile?.last_name)} color="#3B82F6" />
            <InfoRow icon={Mail} label="Email" value={fmt(profile?.email)} color="#8B5CF6" />
            <InfoRow icon={Phone} label="Phone" value={fmt(profile?.phone)} color="#10B981" last />
          </Card>

          {/* LOCATION COORDINATES */}
          {(profile?.latitude || profile?.longitude) && (
            <>
              <SectionLabel label="LOCATION COORDINATES" />
              <Card>
                <InfoRow icon={Navigation} label="Latitude" value={fmt(profile?.latitude?.toFixed(6))} color="#06B6D4" />
                <InfoRow icon={Navigation} label="Longitude" value={fmt(profile?.longitude?.toFixed(6))} color="#06B6D4" last />
              </Card>
            </>
          )}

          {/* LIVE LOCATION (if tracking active) */}
          {currentLiveLocation && (
            <>
              <SectionLabel label="LIVE LOCATION (Every 60 sec)" />
              <Card>
                <InfoRow icon={Activity} label="Current Lat" value={currentLiveLocation.lat.toFixed(6)} color="#10B981" />
                <InfoRow icon={Activity} label="Current Lng" value={currentLiveLocation.lng.toFixed(6)} color="#10B981" last />
              </Card>
            </>
          )}

          {/* BUSINESS INFO */}
          <SectionLabel label="BUSINESS INFORMATION" />
          <Card>
            <InfoRow icon={Briefcase} label="Business Name" value={fmt(profile?.business_name)} color="#06B6D4" />
            <InfoRow icon={DollarSign} label="Hourly Rate" value={fmt(profile?.hourly_rate, " EGP/hr")} color="#EC4899" />
            <InfoRow icon={Award} label="Years of Experience" value={fmt(profile?.years_of_experience, " yrs")} color="#F59E0B" last />
          </Card>

          {/* BIO */}
          {!!profile?.bio && (
            <>
              <SectionLabel label="BIO" />
              <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#475569", lineHeight: 22 }}>{profile?.bio}</Text>
              </View>
            </>
          )}

          {/* ACCOUNT */}
          <SectionLabel label="ACCOUNT" />
          <Card>
            <InfoRow icon={Shield} label="Verification Status"
              value={profile?.verification_status?.charAt(0).toUpperCase() + (profile?.verification_status?.slice(1) ?? "")}
              color={profile?.verification_status === "verified" ? "#10B981" : "#F59E0B"} />
            <InfoRow icon={Clock} label="Member Since" value={profile?.date_joined ? fmtDate(profile.date_joined) : "—"} color="#64748B" last />
          </Card>

          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#CBD5E1", textAlign: "center", marginTop: 20 }}>
            Pull down to refresh
          </Text>
        </View>
      </ScrollView>

      {/* EDIT MODAL */}
      {editOpen && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 100 : 120, maxHeight: "90%", flexDirection: "column", flex: 1 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 }} />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A" }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <X size={17} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Profile Picture */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <TouchableOpacity onPress={pickProfilePicture} disabled={uploadingPicture}
                  style={{ position: "relative", width: 100, height: 100, borderRadius: 28, marginBottom: 12, overflow: "hidden", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed" }}>
                  {editForm.profile_picture_uri ? (
                    <ImageBackground source={{ uri: editForm.profile_picture_uri }} style={{ width: "100%", height: "100%" }} imageStyle={{ borderRadius: 28 }}>
                      <View style={{ backgroundColor: "rgba(0,0,0,0.3)", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                        <Camera size={28} color="#fff" />
                      </View>
                    </ImageBackground>
                  ) : profilePicture ? (
                    <ImageBackground source={{ uri: profilePicture }} style={{ width: "100%", height: "100%" }} imageStyle={{ borderRadius: 28 }}>
                      <View style={{ backgroundColor: "rgba(0,0,0,0.3)", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                        <Camera size={28} color="#fff" />
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={{ width: "100%", height: "100%", backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={32} color="#94A3B8" />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", textAlign: "center" }}>
                  {uploadingPicture ? "Uploading..." : "Tap to change photo"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EditField label="First Name" value={editForm.first_name} error={editErrors.first_name}
                    onChange={(v) => { setEditForm((f) => ({ ...f, first_name: v })); setEditErrors(e => ({ ...e, first_name: undefined as any })); }} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Last Name" value={editForm.last_name} error={editErrors.last_name}
                    onChange={(v) => { setEditForm((f) => ({ ...f, last_name: v })); setEditErrors(e => ({ ...e, last_name: undefined as any })); }} />
                </View>
              </View>

              <EditField label="Phone" value={editForm.phone} error={editErrors.phone} keyboardType="phone-pad"
                onChange={(v) => { setEditForm((f) => ({ ...f, phone: v })); setEditErrors(e => ({ ...e, phone: undefined as any })); }} />

              <EditField label="Business Name" value={editForm.business_name} error={editErrors.business_name}
                onChange={(v) => { setEditForm((f) => ({ ...f, business_name: v })); setEditErrors(e => ({ ...e, business_name: undefined as any })); }} />

              <EditField label="Address" value={editForm.address} error={editErrors.address} multiline
                onChange={(v) => { setEditForm((f) => ({ ...f, address: v })); setEditErrors(e => ({ ...e, address: undefined as any })); }} />

              {/* Latitude and Longitude Fields */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EditField label="Latitude" value={editForm.latitude?.toString() ?? ""} error={editErrors.latitude}
                    keyboardType="decimal-pad"
                    onChange={(v) => { setEditForm((f) => ({ ...f, latitude: v ? parseFloat(v) : null })); setEditErrors(e => ({ ...e, latitude: undefined as any })); }} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Longitude" value={editForm.longitude?.toString() ?? ""} error={editErrors.longitude}
                    keyboardType="decimal-pad"
                    onChange={(v) => { setEditForm((f) => ({ ...f, longitude: v ? parseFloat(v) : null })); setEditErrors(e => ({ ...e, longitude: undefined as any })); }} />
                </View>
              </View>

              {/* Detect Location Button */}
              <TouchableOpacity
                onPress={() => setLocationDetectOpen(true)}
                style={{
                  backgroundColor: "#1E3A8A",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginBottom: 14,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Crosshair size={18} color="#fff" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>
                  Detect Current Location
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EditField label="Hourly Rate (EGP)" value={editForm.hourly_rate} error={editErrors.hourly_rate} keyboardType="decimal-pad"
                    onChange={(v) => { setEditForm((f) => ({ ...f, hourly_rate: v })); setEditErrors(e => ({ ...e, hourly_rate: undefined as any })); }} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Years Experience" value={editForm.years_of_experience} error={editErrors.years_of_experience} keyboardType="number-pad"
                    onChange={(v) => { setEditForm((f) => ({ ...f, years_of_experience: v })); setEditErrors(e => ({ ...e, years_of_experience: undefined as any })); }} />
                </View>
              </View>

              <EditField label="Bio" value={editForm.bio} error={editErrors.bio} multiline
                onChange={(v) => { setEditForm((f) => ({ ...f, bio: v })); setEditErrors(e => ({ ...e, bio: undefined as any })); }} />

              {/* Availability Switch */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, marginBottom: 20 }}>
                <View>
                  <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "#0F172A" }}>Available for Jobs</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B" }}>Show that you're ready to work</Text>
                </View>
                <Switch
                  value={editForm.is_available}
                  onValueChange={(v) => {
                    setEditForm(f => ({ ...f, is_available: v }));
                    setIsTrackingActive(v);
                  }}
                  trackColor={{ false: "#E2E8F0", true: "#10B981" }}
                  thumbColor="#fff"
                />
              </View>

              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", marginBottom: 80 }}>
                ✉️ Email cannot be changed. Contact support if needed.
              </Text>
            </ScrollView>

            {/* Save Button */}
            <View style={{ position: "absolute", bottom: Platform.OS === "ios" ? 60 : 80, left: 20, right: 20 }}>
              <TouchableOpacity onPress={handleSave} disabled={saving || uploadingPicture} activeOpacity={0.88} style={{ borderRadius: 18, overflow: "hidden", opacity: (saving || uploadingPicture) ? 0.7 : 1 }}>
                <LinearGradient colors={["#06B6D4", "#0284C7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  {(saving || uploadingPicture) ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <><Save size={17} color="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Save Changes</Text></>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Location Detection Modal */}
      <LocationDetectModal
        visible={locationDetectOpen}
        onSelect={handleLocationSelect}
        onClose={() => setLocationDetectOpen(false)}
        initialLat={editForm.latitude}
        initialLng={editForm.longitude}
      />
    </View>
  );
}