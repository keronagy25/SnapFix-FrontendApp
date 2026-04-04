import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, Linking,
} from "react-native";
import { MapPin, Clock, Navigation, Building2 } from "@/components/ui/lucide-icon";
import { Typography } from "@/theme/typography";
import { getOffices, type Office } from "@/services/coreService";

/* ─── Hook ─────────────────────────────────────────────────────── */
export function useOffices(token?: string | null) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOffices(token ?? undefined)
      .then(data => { if (!cancelled) setOffices(data); })
      .catch(err => {
        if (!cancelled) {
          console.log("[OfficeCard] fetch error:", err?.data ?? err?.message ?? err);
          setError("Could not load office info.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return { offices, loading, error };
}

/* ─── Open maps ─────────────────────────────────────────────────── */
function openMaps(lat: string, lng: string, name: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() => {});
}

/* ─── Single office card ────────────────────────────────────────── */
export function OfficeCard({ office, variant = "default" }: {
  office: Office;
  variant?: "default" | "highlight";
}) {
  const isHighlight = variant === "highlight";

  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isHighlight ? "rgba(6,182,212,0.4)" : "#E2E8F0",
      overflow: "hidden",
      shadowColor: isHighlight ? "#06B6D4" : "#1E3A8A",
      shadowOffset: { width:0, height:4 },
      shadowOpacity: isHighlight ? 0.15 : 0.06,
      shadowRadius: 14,
      elevation: 4,
      marginBottom: 12,
    }}>
      {/* Header */}
      <View style={{
        backgroundColor: isHighlight ? "#0F172A" : "#1E3A8A",
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        <View style={{ width:40, height:40, borderRadius:12, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
          <Building2 size={20} color="#06B6D4" />
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>{office.name}</Text>
          {(office.region_name ?? office.region?.name) ? (
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:1 }}>
              {office.region_name ?? office.region?.name}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Body */}
      <View style={{ padding:16, gap:10 }}>
        {/* Address */}
        <View style={{ flexDirection:"row", alignItems:"flex-start", gap:10 }}>
          <MapPin size={15} color="#EF4444" style={{ marginTop:2 }} />
          <View style={{ flex:1 }}>
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:13, color:"#0F172A", lineHeight:20 }}>
              {office.address}
            </Text>
            {office.landmark ? (
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B", marginTop:2 }}>
                📍 {office.landmark}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Working hours */}
        {office.working_hours ? (
          <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
            <Clock size={14} color="#10B981" />
            <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#374151" }}>
              {office.working_hours}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Directions button */}
      {office.latitude && office.longitude ? (
        <TouchableOpacity
          onPress={() => openMaps(office.latitude, office.longitude, office.name)}
          activeOpacity={0.85}
          style={{
            marginHorizontal:16, marginBottom:16,
            borderRadius:14,
            backgroundColor: isHighlight ? "#06B6D4" : "#1E3A8A",
            paddingVertical:12,
            flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8,
          }}>
          <Navigation size={14} color="#fff" />
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:13, color:"#fff" }}>Get Directions</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ─── Offices section ───────────────────────────────────────────── */
export function OfficesSection({ token, title = "Our Offices", variant = "default" }: {
  token?: string | null;
  title?: string;
  variant?: "default" | "highlight";
}) {
  const { offices, loading, error } = useOffices(token);

  if (loading) return (
    <View style={{ alignItems:"center", paddingVertical:20 }}>
      <ActivityIndicator size="small" color="#06B6D4" />
      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#94A3B8", marginTop:8 }}>
        Loading office info…
      </Text>
    </View>
  );

  if (error) return (
    <View style={{ backgroundColor:"#FEF2F2", borderRadius:14, padding:14, borderWidth:1, borderColor:"#FECACA" }}>
      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#EF4444", textAlign:"center" }}>
        {error}
      </Text>
    </View>
  );

  if (offices.length === 0) return (
    <View style={{ backgroundColor:"#F8FAFC", borderRadius:14, padding:16, alignItems:"center" }}>
      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8" }}>
        No offices available.
      </Text>
    </View>
  );

  return (
    <View>
      <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:12 }}>
        {title}
      </Text>
      {offices.map(office => (
        <OfficeCard key={office.id} office={office} variant={variant} />
      ))}
    </View>
  );
}