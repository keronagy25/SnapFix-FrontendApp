import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Linking, RefreshControl, Modal,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Location      from "expo-location";
import {
  ArrowLeft, MapPin, Clock, Navigation,
  Building2, AlertCircle, RefreshCw,
  LocateFixed, Star, ChevronRight, Info,
} from "lucide-react-native";
import { useAuthStore }   from "@/store/authStore";
import { Typography }     from "@/theme/typography";
import {
  getOffices, getOfficeById, getNearestOffice,
  type Office,
} from "@/services/coreService";

/* ─── Open in maps ───────────────────────────────────────────────── */
function openMaps(lat: string, lng: string, name: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`geo:${lat},${lng}?q=${encodeURIComponent(name)}`)
  );
}

/* ─── Detail row ─────────────────────────────────────────────────── */
function DetailRow({ icon:Icon, color, label, value, sub }: {
  icon:any; color:string; label:string; value:string; sub?:string;
}) {
  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 }}>
      <View style={{ width:36, height:36, borderRadius:11, backgroundColor:color+"18", alignItems:"center", justifyContent:"center" }}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>{label}</Text>
        <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#0F172A", lineHeight:20 }}>{value}</Text>
        {sub ? <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B", marginTop:3 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

/* ─── Office detail bottom sheet ────────────────────────────────── */
function OfficeDetailSheet({ officeId, onClose }: { officeId:string|null; onClose:()=>void }) {
  const token   = useAuthStore((s) => s.token);
  const [office, setOffice]   = useState<Office | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!officeId) return;
    setLoading(true);
    setOffice(null);
    getOfficeById(officeId, token ?? undefined)
      .then(setOffice)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [officeId]);

  if (!officeId) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" }}>
        <TouchableOpacity style={{ flex:1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, overflow:"hidden", maxHeight:"85%" }}>

          {/* Handle */}
          <View style={{ width:40, height:4, borderRadius:2, backgroundColor:"#E2E8F0", alignSelf:"center", marginTop:12, marginBottom:4 }} />

          {/* Header */}
          <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
            style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:20 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <View style={{ width:46, height:46, borderRadius:14, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
                <Building2 size={22} color="#06B6D4" />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:Typography.fonts.bold, fontSize:17, color:"#fff" }}>
                  {loading ? "Loading…" : office?.name ?? "Office Details"}
                </Text>
                {office && (
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:2 }}>
                    {office.region?.name ?? office.region_name ?? ""}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose}
                style={{ width:34, height:34, borderRadius:10, backgroundColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontSize:16, color:"rgba(255,255,255,0.7)" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {loading ? (
            <View style={{ padding:40, alignItems:"center" }}>
              <ActivityIndicator size="large" color="#06B6D4" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", marginTop:12 }}>Loading office details…</Text>
            </View>
          ) : !office ? (
            <View style={{ padding:40, alignItems:"center" }}>
              <AlertCircle size={40} color="#EF4444" style={{ marginBottom:12 }} />
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A" }}>Could not load details</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding:20, paddingBottom:Platform.OS==="ios"?40:24 }} showsVerticalScrollIndicator={false}>
              <DetailRow icon={MapPin}    color="#EF4444" label="Address"       value={office.address}
                sub={office.landmark ? `📍 ${office.landmark}` : undefined} />
              {office.working_hours && (
                <DetailRow icon={Clock}   color="#10B981" label="Working Hours"  value={office.working_hours} />
              )}
              {(office.region?.name ?? office.region_name) && (
                <DetailRow icon={MapPin}  color="#8B5CF6" label="Region"         value={office.region?.name ?? office.region_name ?? ""} />
              )}
              {office.region?.country && (
                <DetailRow icon={Info}    color="#3B82F6" label="Country"        value={office.region.country} />
              )}
              {office.distance_km !== undefined && (
                <DetailRow icon={Navigation} color="#06B6D4" label="Distance from you"
                  value={`${office.distance_km.toFixed(2)} km away`} />
              )}

              {/* Full address map preview box */}
              {office.latitude && office.longitude && (
                <View style={{ backgroundColor:"#F8FAFC", borderRadius:16, padding:14, marginTop:4, marginBottom:16, borderWidth:1.5, borderColor:"#E2E8F0", flexDirection:"row", alignItems:"center", gap:12 }}>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:13, color:"#0F172A", marginBottom:2 }}>View on Map</Text>
                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>
                      {parseFloat(office.latitude).toFixed(6)}, {parseFloat(office.longitude).toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openMaps(office.latitude, office.longitude, office.name)}
                    style={{ backgroundColor:"#1E3A8A", paddingHorizontal:14, paddingVertical:8, borderRadius:12, flexDirection:"row", alignItems:"center", gap:6 }}>
                    <Navigation size={13} color="#fff" />
                    <Text style={{ fontFamily:Typography.fonts.bold, fontSize:12, color:"#fff" }}>Open</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Directions CTA */}
              {office.latitude && office.longitude && (
                <TouchableOpacity onPress={() => openMaps(office.latitude, office.longitude, office.name)}
                  activeOpacity={0.85} style={{ borderRadius:16, overflow:"hidden", marginBottom:10 }}>
                  <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:0}}
                    style={{ paddingVertical:14, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <Navigation size={16} color="#fff" />
                    <Text style={{ fontFamily:Typography.fonts.bold, fontSize:14, color:"#fff" }}>Get Directions</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose}
                style={{ paddingVertical:14, borderRadius:16, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ─── Nearest office banner ──────────────────────────────────────── */
function NearestBanner({ office, onPress }: { office:Office; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}
      style={{ borderRadius:18, overflow:"hidden", marginBottom:20 }}>
      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ padding:16, flexDirection:"row", alignItems:"center", gap:14 }}>
        <View style={{ width:48, height:48, borderRadius:15, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"rgba(6,182,212,0.4)" }}>
          <LocateFixed size={22} color="#06B6D4" />
        </View>
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:3 }}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:10, color:"#F59E0B", letterSpacing:0.6 }}>NEAREST TO YOU</Text>
          </View>
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff", marginBottom:2 }}>{office.name}</Text>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.5)" }} numberOfLines={1}>{office.address}</Text>
        </View>
        <View style={{ alignItems:"flex-end", gap:4 }}>
          {office.distance_km !== undefined && (
            <View style={{ backgroundColor:"rgba(6,182,212,0.2)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:12, color:"#06B6D4" }}>{office.distance_km.toFixed(1)} km</Text>
            </View>
          )}
          <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ─── Office card ────────────────────────────────────────────────── */
function OfficeCard({ office, onPress }: { office:Office; onPress:()=>void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}
      style={{ backgroundColor:"#fff", borderRadius:20, marginBottom:12, borderWidth:1.5, borderColor:"#E2E8F0",
        shadowColor:"#1E3A8A", shadowOffset:{width:0,height:4}, shadowOpacity:0.07, shadowRadius:12, elevation:4, overflow:"hidden" }}>

      {/* Top */}
      <View style={{ padding:16, flexDirection:"row", alignItems:"flex-start", gap:12 }}>
        <View style={{ width:46, height:46, borderRadius:14, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" }}>
          <Building2 size={22} color="#1E3A8A" />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:3 }}>{office.name}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
            <MapPin size={12} color="#EF4444" />
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B", flex:1 }} numberOfLines={1}>{office.address}</Text>
          </View>
          {office.landmark ? (
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginTop:3 }}>📍 {office.landmark}</Text>
          ) : null}
        </View>
        {office.distance_km !== undefined && (
          <View style={{ backgroundColor:"#EFF6FF", paddingHorizontal:10, paddingVertical:5, borderRadius:20 }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:11, color:"#1E3A8A" }}>{office.distance_km.toFixed(1)} km</Text>
          </View>
        )}
      </View>

      {office.working_hours ? (
        <View style={{ flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:16, paddingBottom:12 }}>
          <Clock size={12} color="#10B981" />
          <Text style={{ fontFamily:Typography.fonts.medium, fontSize:12, color:"#374151" }}>{office.working_hours}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={{ flexDirection:"row", borderTopWidth:1, borderTopColor:"#F1F5F9" }}>
        <TouchableOpacity onPress={() => openMaps(office.latitude, office.longitude, office.name)}
          activeOpacity={0.8}
          style={{ flex:1, paddingVertical:12, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, borderRightWidth:1, borderRightColor:"#F1F5F9" }}>
          <Navigation size={14} color="#1E3A8A" />
          <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:13, color:"#1E3A8A" }}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}
          style={{ flex:1, paddingVertical:12, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Info size={14} color="#64748B" />
          <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:13, color:"#64748B" }}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Location permission banner ─────────────────────────────────── */
function LocationBanner({ onAllow, loading }: { onAllow:()=>void; loading:boolean }) {
  return (
    <View style={{ backgroundColor:"#EFF6FF", borderRadius:16, padding:14, marginBottom:16, borderWidth:1, borderColor:"#BFDBFE", flexDirection:"row", alignItems:"center", gap:12 }}>
      <View style={{ width:40, height:40, borderRadius:12, backgroundColor:"#1E3A8A", alignItems:"center", justifyContent:"center" }}>
        <LocateFixed size={18} color="#fff" />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily:Typography.fonts.bold, fontSize:13, color:"#1E40AF", marginBottom:2 }}>Find Nearest Office</Text>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#3B82F6", lineHeight:17 }}>
          Allow location access to find the closest office to you.
        </Text>
      </View>
      <TouchableOpacity onPress={onAllow} disabled={loading}
        style={{ backgroundColor:"#1E3A8A", paddingHorizontal:12, paddingVertical:8, borderRadius:12 }}>
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={{ fontFamily:Typography.fonts.bold, fontSize:12, color:"#fff" }}>Allow</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
export default function OurOfficesScreen() {
  const token = useAuthStore((s) => s.token);

  const [offices,       setOffices]       = useState<Office[]>([]);
  const [nearest,       setNearest]       = useState<Office | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [locLoading,    setLocLoading]    = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [hasLocation,   setHasLocation]   = useState(false);

  const fetchOffices = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getOffices(token ?? undefined);
      setOffices(data);
    } catch {
      setError("Could not load office information. Please try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  const fetchNearest = useCallback(async () => {
    setLocLoading(true);
    try {
      // 1. Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        setLocLoading(false);
        return;
      }
      // 2. Get current position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setHasLocation(true);

      // 3. Call nearest API
      const office = await getNearestOffice(latitude, longitude, token ?? undefined);
      setNearest(office);
    } catch (err: any) {
      // 404 = no offices with location, 400 = bad coords — just hide the nearest banner
      setNearest(null);
    } finally {
      setLocLoading(false);
    }
  }, [token]);

  // Try silently on mount (if permission already granted)
  useEffect(() => {
    fetchOffices();
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === "granted") fetchNearest();
    });
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <OfficeDetailSheet officeId={selectedId} onClose={() => setSelectedId(null)} />

      {/* Header */}
      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:28, paddingHorizontal:20, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:80, backgroundColor:"rgba(6,182,212,0.06)" }} />

        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <TouchableOpacity onPress={() => router.back()}
            style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          {/* Refresh location button */}
          {hasLocation && (
            <TouchableOpacity onPress={fetchNearest} disabled={locLoading}
              style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(6,182,212,0.15)", alignItems:"center", justifyContent:"center" }}>
              {locLoading
                ? <ActivityIndicator size="small" color="#06B6D4" />
                : <LocateFixed size={18} color="#06B6D4" />
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection:"row", alignItems:"center", gap:14 }}>
          <View style={{ width:52, height:52, borderRadius:16, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"rgba(6,182,212,0.35)" }}>
            <Building2 size={26} color="#06B6D4" />
          </View>
          <View>
            <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:24, color:"#fff" }}>Our Offices</Text>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
              {loading ? "Loading…" : `${offices.length} location${offices.length !== 1 ? "s" : ""} in Egypt`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#94A3B8", marginTop:12 }}>Loading offices…</Text>
        </View>
      ) : error ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom:16 }} />
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:8 }}>Failed to Load</Text>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center", marginBottom:24 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOffices()}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#0F172A", paddingHorizontal:24, paddingVertical:12, borderRadius:16 }}>
            <RefreshCw size={16} color="#06B6D4" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:20, paddingBottom:100 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { fetchOffices(true); if (hasLocation) fetchNearest(); }} tintColor="#06B6D4" colors={["#06B6D4"]} />}>

          {/* Nearest office banner — shown when we have location */}
          {nearest && (
            <NearestBanner office={nearest} onPress={() => setSelectedId(nearest.id)} />
          )}

          {/* Location permission banner — shown when not yet asked */}
          {!hasLocation && !locationDenied && !locLoading && (
            <LocationBanner onAllow={fetchNearest} loading={locLoading} />
          )}

          {/* Location denied notice */}
          {locationDenied && (
            <View style={{ backgroundColor:"#FFF7ED", borderRadius:14, padding:14, marginBottom:16, flexDirection:"row", gap:10, alignItems:"center", borderWidth:1, borderColor:"#FED7AA" }}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#92400E", flex:1, lineHeight:18 }}>
                Location access denied. Enable it in your phone settings to find the nearest office.
              </Text>
            </View>
          )}

          {/* Info banner */}
          <View style={{ backgroundColor:"#EFF6FF", borderRadius:14, padding:14, marginBottom:20, flexDirection:"row", gap:10, alignItems:"flex-start", borderWidth:1, borderColor:"#BFDBFE" }}>
            <Text style={{ fontSize:18 }}>💡</Text>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#1E40AF", flex:1, lineHeight:20 }}>
              Visit any office for registration, support, or queries. Bring your ID and relevant documents.
            </Text>
          </View>

          {/* All offices */}
          {offices.length === 0 ? (
            <View style={{ alignItems:"center", paddingTop:40 }}>
              <Text style={{ fontSize:48, marginBottom:12 }}>🏢</Text>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:6 }}>No Offices Listed</Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center" }}>Office locations will appear here once added.</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:14 }}>
                All Offices
              </Text>
              {offices.map(office => (
                <OfficeCard key={office.id} office={office} onPress={() => setSelectedId(office.id)} />
              ))}
            </>
          )}

        </ScrollView>
      )}
    </View>
  );
}