import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { ArrowLeft, Star, Briefcase, Zap } from "lucide-react-native";
import { useBookingStore } from "@/store/bookingstore";
import { PROVIDERS, type Provider } from "@/data/providers";
import type { BookingExpert } from "@/store/bookingstore";

/* ─── Responsive ─────────────────────────────────────────────────────────── */
function useR() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 480 && width < 1024;
  const isWeb    = width >= 1024;
  return {
    width, isWeb, isTablet,
    px:    isWeb ? 40 : 20,
    maxW:  isWeb ? 860 : 9999,
    gap:   isWeb ? 16 : 12,
    cols2: isWeb || isTablet,
    fs:    (n: number) => (isWeb ? n * 1.05 : n),
  };
}

/* ─── Step Bar ───────────────────────────────────────────────────────────── */
function StepBar({ step }: { step: number }) {
  const steps = ["Service", "Expert", "Schedule", "Payment"];
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: "center" }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: i < step ? "#1E3A8A" : "#E2E8F0",
              alignItems: "center", justifyContent: "center",
            }}>
              {i < step - 1
                ? <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>
                : <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: i === step - 1 ? "#fff" : "#94A3B8" }}>{i + 1}</Text>
              }
            </View>
          </View>
          {i < steps.length - 1 && (
            <View style={{ flex: 1, height: 2, backgroundColor: i < step - 1 ? "#1E3A8A" : "#E2E8F0", marginHorizontal: 2 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const SORT_OPTIONS  = ["Top Rated", "Lowest Price", "Most Jobs"] as const;
const BADGE_FILTERS = ["All", "Top Rated", "Fast Response", "Verified Pro"] as const;

type SortOption  = typeof SORT_OPTIONS[number];
type BadgeFilter = typeof BADGE_FILTERS[number];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function SelectExpertScreen() {
  const r = useR();
  const { filterServiceId } = useLocalSearchParams<{ filterServiceId?: string }>();

  const [sort,        setSort]        = useState<SortOption>("Top Rated");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("All");

  const setExpert    = useBookingStore((s) => s.setExpert);
  const setService   = useBookingStore((s) => s.setService);
  const serviceLabel = useBookingStore((s) => s.serviceLabel);
  const serviceEmoji = useBookingStore((s) => s.serviceEmoji);

  const isFiltered = !!filterServiceId && filterServiceId !== "all";

  const filtered: Provider[] = PROVIDERS
    .filter((p: Provider) => !isFiltered || p.serviceId === filterServiceId)
    .filter((p: Provider) => badgeFilter === "All" || p.badge === badgeFilter)
    .sort((a: Provider, b: Provider) =>
      sort === "Lowest Price" ? a.price - b.price :
      sort === "Most Jobs"    ? b.jobs  - a.jobs  :
      b.rating - a.rating
    );

  const pageTitle = isFiltered
    ? `${serviceEmoji ?? ""} ${serviceLabel ?? filterServiceId} Experts`
    : "All Experts";

  const handleSelect = (expert: Provider) => {
    if (!serviceLabel && isFiltered) {
      setService(expert.serviceId, expert.profession, "");
    }
    const bookingExpert: BookingExpert = {
      id:          expert.id,
      name:        expert.name,
      avatar:      expert.avatar,
      avatarColor: expert.avatarColor,
      profession:  expert.profession,
      rating:      expert.rating,
      jobs:        expert.jobs,
      price:       expert.price,
      badge:       expert.badge,
      about:       expert.about,
    };
    setExpert(bookingExpert);
    router.push("/(customer)/booking/schedule");
  };

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width: "100%", alignSelf: "center" }
    : {};

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={{ backgroundColor: "#fff", paddingTop: Platform.OS === "web" ? 20 : 52, paddingBottom: 16, paddingHorizontal: r.px, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
        <View style={centerWrap}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: r.fs(18), color: "#0F172A" }}>Choose Expert</Text>
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8" }}>{pageTitle}</Text>
            </View>
            <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#3B82F6" }}>{filtered.length} found</Text>
            </View>
          </View>
          <StepBar step={2} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[{ paddingHorizontal: r.px, paddingTop: 20 }, centerWrap]}>

          {/* SORT */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt} onPress={() => setSort(opt)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: sort === opt ? "#1E3A8A" : "#fff", borderWidth: 1, borderColor: sort === opt ? "#1E3A8A" : "#E2E8F0" }}>
                <Text style={{ fontFamily: "Poppins_500Medium", fontSize: r.fs(12), color: sort === opt ? "#fff" : "#64748B" }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* BADGE FILTER */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            {BADGE_FILTERS.map((f) => (
              <TouchableOpacity key={f} onPress={() => setBadgeFilter(f)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: badgeFilter === f ? "#EFF6FF" : "#F8FAFC", borderWidth: 1, borderColor: badgeFilter === f ? "#3B82F6" : "#E2E8F0" }}>
                <Text style={{ fontFamily: "Poppins_500Medium", fontSize: r.fs(12), color: badgeFilter === f ? "#3B82F6" : "#94A3B8" }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* EMPTY STATE */}
          {filtered.length === 0 && (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: "#0F172A", marginBottom: 6 }}>No experts found</Text>
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: "#94A3B8", textAlign: "center" }}>Try changing the filter or badge selection</Text>
            </View>
          )}

          {/* EXPERT CARDS */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: r.gap }}>
            {filtered.map((expert: Provider, i: number) => {
              const cardW: any = r.cols2
                ? Platform.OS === "web"
                  ? `calc(50% - ${r.gap / 2}px)`
                  : (r.width - r.px * 2 - r.gap) / 2
                : "100%";

              return (
                <MotiView key={expert.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 70, type: "timing", duration: 400 }}
                  style={{ width: r.isTablet || r.isWeb ? cardW : "100%" }}
                >
                  <TouchableOpacity onPress={() => handleSelect(expert)} activeOpacity={0.9}
                    style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#F1F5F9" }}>

                    {/* Top row */}
                    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: expert.avatarColor + "22", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 16, color: expert.avatarColor }}>{expert.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(15), color: "#0F172A", marginBottom: 2 }}>{expert.name}</Text>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8", marginBottom: 6 }}>{expert.profession}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#F59E0B" }}>{expert.rating}</Text>
                          </View>
                          <Text style={{ color: "#CBD5E1", fontSize: 12 }}>·</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Briefcase size={11} color="#94A3B8" />
                            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(11), color: "#94A3B8" }}>{expert.jobs} jobs</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 10, color: "#3B82F6" }}>{expert.badge}</Text>
                      </View>
                    </View>

                    {/* About */}
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#64748B", lineHeight: 18, marginBottom: 14 }} numberOfLines={2}>
                      {expert.about}
                    </Text>

                    {/* Footer */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(11), color: "#94A3B8" }}>Starting at</Text>
                        <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: r.fs(17), color: "#1E3A8A" }}>
                          {expert.price}{" "}
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8" }}>EGP/hr</Text>
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleSelect(expert)}
                        style={{ backgroundColor: "#1E3A8A", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Zap size={13} color="#06B6D4" fill="#06B6D4" />
                        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(13), color: "#fff" }}>Select</Text>
                      </TouchableOpacity>
                    </View>

                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}