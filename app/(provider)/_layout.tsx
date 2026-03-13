import React, { useRef, useEffect } from "react";
import {
  View, Text, Platform, useWindowDimensions,
  TouchableOpacity, Animated, StyleSheet,
} from "react-native";
import { Tabs, usePathname } from "expo-router";
import {
  LayoutDashboard, Briefcase, Wallet, MessageCircle, User,
} from "lucide-react-native";

/* ─── Design tokens ──────────────────────────────────────────────── */
const C = {
  bg:      "#0F172A",   // deep navy — matches dashboard header
  surface: "#1E293B",   // slightly lighter panel
  accent:  "#06B6D4",   // cyan
  muted:   "#475569",   // slate-600
  white:   "#FFFFFF",
};

const TABS = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "jobs",      label: "Jobs",      icon: Briefcase        },
  { name: "wallet",    label: "Wallet",    icon: Wallet           },
  { name: "chat",      label: "Messages",  icon: MessageCircle    },
  { name: "profile",   label: "Profile",   icon: User             },
];

/* ─── Animated tab item ──────────────────────────────────────────── */
function TabItem({
  icon: Icon, label, focused, onPress,
}: {
  icon: any; label: string; focused: boolean; onPress: () => void;
}) {
  const scale     = useRef(new Animated.Value(1)).current;
  const glow      = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(focused ? 20 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale,       { toValue: 1.15, useNativeDriver: true,  damping: 12, stiffness: 200 }),
        Animated.timing(glow,        { toValue: 1,    useNativeDriver: false, duration: 200 }),
        Animated.spring(indicatorW,  { toValue: 20,   useNativeDriver: false, damping: 14, stiffness: 180 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale,       { toValue: 1,    useNativeDriver: true,  damping: 12, stiffness: 200 }),
        Animated.timing(glow,        { toValue: 0,    useNativeDriver: false, duration: 200 }),
        Animated.spring(indicatorW,  { toValue: 0,    useNativeDriver: false, damping: 14, stiffness: 180 }),
      ]).start();
    }
  }, [focused]);

  const bgColor = glow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(6,182,212,0)", "rgba(6,182,212,0.14)"] });
  const iconColor = focused ? C.accent : C.muted;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 }}
    >
      {/* Icon pill */}
      <Animated.View style={{
        width:           44,
        height:          34,
        borderRadius:    12,
        backgroundColor: bgColor,
        alignItems:      "center",
        justifyContent:  "center",
        transform:       [{ scale }],
        marginBottom:    4,
      }}>
        <Icon size={20} color={iconColor} strokeWidth={focused ? 2.3 : 1.7} />
      </Animated.View>

      {/* Label */}
      <Text style={{
        fontFamily: focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
        fontSize:   9,
        color:      iconColor,
        letterSpacing: focused ? 0.3 : 0,
      }}>
        {label.toUpperCase()}
      </Text>

      {/* Active dot indicator */}
      <Animated.View style={{
        marginTop:       4,
        height:          3,
        width:           indicatorW,
        borderRadius:    2,
        backgroundColor: C.accent,
        shadowColor:     C.accent,
        shadowOffset:    { width: 0, height: 0 },
        shadowOpacity:   1,
        shadowRadius:    6,
      }} />
    </TouchableOpacity>
  );
}

/* ─── Custom tab bar ─────────────────────────────────────────────── */
function ProviderTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { width } = useWindowDimensions();
  const isWeb     = width >= 1024;

  const barW   = isWeb ? 460 : Math.min(width - 32, 500);
  const left   = isWeb ? (width - barW) / 2 : 16;
  const bottom = Platform.OS === "ios" ? 28 : 16;

  return (
    <View style={[styles.barWrapper, { bottom, left, width: barW }]}>
      {/* Outer glow ring */}
      <View style={styles.glowRing} />

      {/* Bar body */}
      <View style={styles.bar}>
        {/* Top accent line */}
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
  barWrapper: {
    position: "absolute",
    zIndex:   100,
  },
  glowRing: {
    position:      "absolute",
    top:           -2, left: -2, right: -2, bottom: -2,
    borderRadius:  30,
    borderWidth:   1,
    borderColor:   "rgba(6,182,212,0.18)",
  },
  bar: {
    flexDirection:     "row",
    backgroundColor:   C.bg,
    borderRadius:      28,
    paddingHorizontal: 4,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       "rgba(255,255,255,0.07)",
    shadowColor:       "#06B6D4",
    shadowOffset:      { width: 0, height: 8 },
    shadowOpacity:     0.25,
    shadowRadius:      28,
    elevation:         16,
    overflow:          "hidden",
  },
  topLine: {
    position:        "absolute",
    top:             0, left: 40, right: 40,
    height:          1,
    backgroundColor: "rgba(6,182,212,0.3)",
    borderRadius:    1,
  },
});

/* ─── Layout ─────────────────────────────────────────────────────── */
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