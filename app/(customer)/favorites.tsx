import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Modal, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router }         from "expo-router";
import {
  Heart, Star, User, AlertCircle, RefreshCw, CheckCircle,
} from "@/components/ui/lucide-icon";
import { useAuthStore }   from "@/store/authStore";
import { Typography }     from "@/theme/typography";
import {
  getFavorites, toggleFavorite,
  type FavoriteProvider,
} from "@/services/customerService";

/* ═══ RESPONSIVE SCALING ═══ */
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const scale = (value: number) => (screenWidth / 375) * value;
const verticalScale = (value: number) => (screenHeight / 667) * value;
const fontSize = (size: number) => Math.round(scale(size));
const isTablet = screenWidth >= 768;
const isLargeScreen = screenWidth >= 1024;

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

function FeedbackModal({ ok, title, msg, onClose }: { ok:boolean; title:string; msg:string; onClose:()=>void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal: scale(24) }}>
        <View style={{ backgroundColor:"#fff", borderRadius: scale(24), overflow:"hidden" }}>
          <View style={{ backgroundColor:ok?"#10B981":"#EF4444", paddingVertical: scale(20), alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>{ok?"✅":"⚠️"}</Text>
          </View>
          <View style={{ padding: scale(24), alignItems:"center" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize: fontSize(18), color:"#0F172A", marginBottom: scale(10), textAlign:"center" }}>{title}</Text>
            <View style={{ backgroundColor:ok?"#ECFDF5":"#FEF2F2", borderRadius: scale(14), padding: scale(14), borderWidth:1, borderColor:ok?"#A7F3D0":"#FECACA", marginBottom: scale(20), width:"100%" }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(14), color:ok?"#065F46":"#991B1B", textAlign:"center", lineHeight:22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width:"100%", paddingVertical: scale(14), borderRadius: scale(16), backgroundColor:ok?"#10B981":"#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize: fontSize(15), color:"#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProviderCard({ provider, onRemove }: { provider:FavoriteProvider; onRemove:()=>void }) {
  return (
    <View style={{ backgroundColor:"#fff", borderRadius: scale(20), marginBottom: scale(12), borderWidth:1, borderColor:"#F1F5F9",
      shadowColor:"#1E3A8A", shadowOffset:{width:0,height:3}, shadowOpacity:0.07, shadowRadius:12, elevation:3, overflow:"hidden" }}>
      <View style={{ padding: scale(16), flexDirection:"row", alignItems:"center", gap: scale(14) }}>
        {/* Avatar */}
        <View style={{ width: scale(56), height: scale(56), borderRadius: scale(18), backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" }}>
          <User size={fontSize(26)} color="#1E3A8A" />
        </View>

        {/* Info */}
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap: scale(8), marginBottom: scale(2), flexWrap:"wrap" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize: fontSize(15), color:"#0F172A" }}>
              {provider.first_name} {provider.last_name}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(customer)/booking/direct" as any)}
              style={{ backgroundColor:"#1E3A8A", paddingHorizontal: scale(12), paddingVertical: scale(4), borderRadius: scale(8) }}>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize: fontSize(11), color:"#fff" }}>Book Again</Text>
            </TouchableOpacity>
          </View>
          {provider.business_name && (
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(13), color:"#64748B", marginBottom: scale(4) }}>
              {provider.business_name}
            </Text>
          )}
          <View style={{ flexDirection:"row", alignItems:"center", gap: scale(10), flexWrap:"wrap" }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap: scale(4) }}>
              <Star size={fontSize(13)} color="#F59E0B" fill="#F59E0B" />
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize: fontSize(13), color:"#0F172A" }}>
                {provider.rating?.toFixed(1) ?? "—"}
              </Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(12), color:"#94A3B8" }}>
                ({provider.total_reviews})
              </Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap: scale(4) }}>
              <CheckCircle size={fontSize(12)} color="#10B981" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(12), color:"#64748B" }}>
                {provider.completion_rate?.toFixed(0) ?? "—"}%
              </Text>
            </View>
          </View>
        </View>

        {/* Remove favorite */}
        <TouchableOpacity onPress={onRemove} activeOpacity={0.8}
          style={{ width: scale(40), height: scale(40), borderRadius: scale(12), backgroundColor:"#FEF2F2", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#FECACA" }}>
          <Heart size={fontSize(18)} color="#EF4444" fill="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Availability badge */}
      <View style={{ borderTopWidth:1, borderTopColor:"#F1F5F9", paddingHorizontal: scale(16), paddingVertical: scale(10), flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap: scale(6) }}>
          <View style={{ width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor:provider.is_available?"#10B981":"#94A3B8" }} />
          <Text style={{ fontFamily:Typography.fonts.medium, fontSize: fontSize(12), color:provider.is_available?"#10B981":"#94A3B8" }}>
            {provider.is_available ? "Available now" : "Not available"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function CustomerFavoritesScreen() {
  const token = useAuthStore((s) => s.token);

  const [favorites,  setFavorites]  = useState<FavoriteProvider[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string|null>(null);
  const [feedback,   setFeedback]   = useState<{ok:boolean;title:string;msg:string}|null>(null);

  const fetch = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setFavorites(await getFavorites(token));
    } catch (err: any) { setError(getApiError(err, "Failed to load favorites.")); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRemove = async (provider: FavoriteProvider) => {
    if (!token) return;
    try {
      await toggleFavorite(provider.id, token);
      setFavorites(prev => prev.filter(p => p.id !== provider.id));
      setFeedback({ ok:true, title:"Removed from Favorites", msg:`${provider.first_name} has been removed from your favorites.` });
    } catch (err: any) {
      setFeedback({ ok:false, title:"Error", msg:getApiError(err, "Could not remove from favorites.") });
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop:Platform.OS==="android" ? scale(48) : scale(60), paddingBottom: scale(24), paddingHorizontal: scale(20), overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-30, width: scale(160), height: scale(160), borderRadius: scale(80), backgroundColor:"rgba(6,182,212,0.08)" }} />
        <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize: fontSize(24), color:"#fff", marginBottom: scale(4) }}>Favorites</Text>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(13), color:"rgba(255,255,255,0.6)" }}>
          {favorites.length} saved provider{favorites.length!==1?"s":""}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(14), color:"#94A3B8", marginTop: scale(12) }}>Loading favorites…</Text>
        </View>
      ) : error ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal: scale(32) }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: scale(16) }} />
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize: fontSize(16), color:"#0F172A", marginBottom: scale(8) }}>Failed to Load</Text>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(13), color:"#94A3B8", textAlign:"center", marginBottom: scale(24) }}>{error}</Text>
          <TouchableOpacity onPress={() => fetch()}
            style={{ flexDirection:"row", alignItems:"center", gap: scale(8), backgroundColor:"#1E3A8A", paddingHorizontal: scale(24), paddingVertical: scale(12), borderRadius: scale(16) }}>
            <RefreshCw size={fontSize(16)} color="#fff" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize: fontSize(14), color:"#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: scale(16), paddingBottom: verticalScale(100) }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}>
          {favorites.length === 0 ? (
            <View style={{ alignItems:"center", paddingTop: verticalScale(60) }}>
              <Text style={{ fontSize: fontSize(56), marginBottom: scale(16) }}>❤️</Text>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize: fontSize(17), color:"#0F172A", marginBottom: scale(8) }}>No favorites yet</Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize: fontSize(14), color:"#94A3B8", textAlign:"center", lineHeight:22 }}>
                When you book a service and like the provider, tap the heart icon to save them here.
              </Text>
            </View>
          ) : (
            favorites.map(p => (
              <ProviderCard key={p.id} provider={p} onRemove={() => handleRemove(p)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}