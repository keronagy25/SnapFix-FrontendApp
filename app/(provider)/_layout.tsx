import React from "react";
import {
  View, Text, Platform, useWindowDimensions,
  TouchableOpacity, StyleSheet,
} from "react-native";
import { Tabs } from "expo-router";
import {
  LayoutDashboard, Briefcase, Wallet, MessageCircle, User,
} from "lucide-react-native";

const C = {
  bg:     "#0F172A",
  accent: "#06B6D4",
  muted:  "#475569",
};

const TABS = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "jobs",      label: "Jobs",      icon: Briefcase        },
  { name: "wallet",    label: "Wallet",    icon: Wallet           },
  { name: "chat",      label: "Messages",  icon: MessageCircle    },
  { name: "profile",   label: "Profile",   icon: User             },
];

/* ─── Simple static tab item — no Animated at all ─────────────── */
function TabItem({ icon: Icon, label, focused, onPress }: {
  icon: any; label: string; focused: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Icon size={20} color={focused ? C.accent : C.muted} strokeWidth={focused ? 2.3 : 1.7} />
      </View>
      <Text style={{
        fontFamily: focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
        fontSize: 9, color: focused ? C.accent : C.muted,
        letterSpacing: focused ? 0.3 : 0,
      }}>
        {label.toUpperCase()}
      </Text>
      {focused && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

/* ─── Tab bar ──────────────────────────────────────────────────── */
function ProviderTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { width } = useWindowDimensions();
  const isWeb  = width >= 1024;
  const barW   = isWeb ? 460 : Math.min(width - 32, 500);
  const left   = isWeb ? (width - barW) / 2 : 16;
  const bottom = Platform.OS === "ios" ? 28 : 16;

  return (
    <View style={[styles.wrapper, { bottom, left, width: barW }]}>
      <View style={styles.bar}>
        <View style={styles.topLine} />
        {state.routes.map((route: any, i: number) => {
          const focused  = state.index === i;
          const tabMeta  = TABS.find((t) => t.name === route.name) ?? TABS[0];
          return (
            <TabItem
              key={route.key}
              icon={tabMeta.icon}
              label={tabMeta.label}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:        { position: "absolute", zIndex: 100 },
  bar:            { flexDirection: "row", backgroundColor: C.bg, borderRadius: 28, paddingHorizontal: 4, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", shadowColor: "#06B6D4", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 28, elevation: 16, overflow: "hidden" },
  topLine:        { position: "absolute", top: 0, left: 40, right: 40, height: 1, backgroundColor: "rgba(6,182,212,0.3)", borderRadius: 1 },
  tabItem:        { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  iconPill:       { width: 44, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: "transparent" },
  iconPillActive: { backgroundColor: "rgba(6,182,212,0.14)" },
  dot:            { marginTop: 4, height: 3, width: 20, borderRadius: 2, backgroundColor: "#06B6D4" },
});

export default function ProviderLayout() {
  return (
    <Tabs
      tabBar={(props) => <ProviderTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="jobs"      />
      <Tabs.Screen name="wallet"    />
      <Tabs.Screen name="chat"      />
      <Tabs.Screen name="profile"   />
    </Tabs>
  );
}