import React, { useRef, useEffect } from "react";
import {
  View, Text, Platform, useWindowDimensions,
  TouchableOpacity, Animated, StyleSheet,
} from "react-native";
import { Tabs } from "expo-router";
import {
  Home, BookOpen, Wallet, MessageCircle, User,
} from "lucide-react-native";

/* ─── Design tokens ──────────────────────────────────────────────── */
const C = {
  bg:     "#FFFFFF",
  accent: "#1E3A8A",   // deep blue — matches customer brand
  cyan:   "#06B6D4",   // cyan highlight
  muted:  "#94A3B8",
};

const TABS = [
  { name: "home",     label: "Home",     icon: Home          },
  { name: "bookings", label: "Bookings", icon: BookOpen      },
  { name: "wallet",   label: "Wallet",   icon: Wallet        },
  { name: "chat",     label: "Messages", icon: MessageCircle },
  { name: "profile",  label: "Profile",  icon: User          },
];

/* ─── Single tab item ────────────────────────────────────────────── */
function TabItem({
  icon: Icon, label, focused, onPress,
}: {
  icon: any; label: string; focused: boolean; onPress: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const pillScale  = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillOpacity= useRef(new Animated.Value(focused ? 1 : 0)).current;
  const dotOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(translateY,  { toValue: -4,  useNativeDriver: true,  damping: 12, stiffness: 200 }),
        Animated.spring(pillScale,   { toValue: 1,   useNativeDriver: true,  damping: 14, stiffness: 200 }),
        Animated.timing(pillOpacity, { toValue: 1,   useNativeDriver: true,  duration: 180 }),
        Animated.timing(dotOpacity,  { toValue: 1,   useNativeDriver: true,  duration: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY,  { toValue: 0,  useNativeDriver: true,  damping: 12, stiffness: 200 }),
        Animated.spring(pillScale,   { toValue: 0,  useNativeDriver: true,  damping: 14, stiffness: 200 }),
        Animated.timing(pillOpacity, { toValue: 0,  useNativeDriver: true,  duration: 150 }),
        Animated.timing(dotOpacity,  { toValue: 0,  useNativeDriver: true,  duration: 150 }),
      ]).start();
    }
  }, [focused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tabItem}
    >
      <Animated.View style={{ alignItems: "center", transform: [{ translateY }] }}>

        {/* Icon container with animated pill background */}
        <View style={{ alignItems: "center", justifyContent: "center", width: 52, height: 38 }}>
          {/* Pill bg */}
          <Animated.View style={[styles.iconPill, { opacity: pillOpacity, transform: [{ scale: pillScale }] }]} />

          {/* Icon */}
          <Icon
            size={21}
            color={focused ? C.accent : C.muted}
            strokeWidth={focused ? 2.4 : 1.7}
          />
        </View>

        {/* Label */}
        <Text style={{
          fontFamily:    focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
          fontSize:      9.5,
          color:         focused ? C.accent : C.muted,
          letterSpacing: focused ? 0.4 : 0,
          marginTop:     1,
        }}>
          {label}
        </Text>

        {/* Bottom dot */}
        <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />

      </Animated.View>
    </TouchableOpacity>
  );
}

/* ─── Custom tab bar ─────────────────────────────────────────────── */
function CustomerTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { width } = useWindowDimensions();
  const isWeb     = width >= 1024;
  const barW      = isWeb ? 480 : Math.min(width - 32, 480);
  const left      = isWeb ? (width - barW) / 2 : 16;
  const bottom    = Platform.OS === "ios" ? 28 : 16;

  return (
    <View style={[styles.wrapper, { bottom, left, width: barW }]}>
      {/* Soft shadow layer */}
      <View style={styles.shadowLayer} />

      <View style={styles.bar}>
        {/* Decorative top shimmer */}
        <View style={styles.shimmer} />

        {state.routes
          /* only show the 5 main tabs — hide tracking & booking */
          .filter((r: any) => TABS.some((t) => t.name === r.name))
          .map((route: any, i: number) => {
            const globalIndex = state.routes.findIndex((r: any) => r.name === route.name);
            const focused     = state.index === globalIndex;
            const tabMeta     = TABS.find((t) => t.name === route.name)!;
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
  wrapper: {
    position: "absolute",
    zIndex:   100,
  },
  shadowLayer: {
    position:        "absolute",
    top: 4, left: 4, right: 4, bottom: -6,
    borderRadius:    30,
    backgroundColor: "rgba(30,58,138,0.10)",
    // blur-like layered shadow via multiple elements isn't possible in RN,
    // so we use elevation + shadow on the bar itself
  },
  bar: {
    flexDirection:     "row",
    backgroundColor:   C.bg,
    borderRadius:      28,
    paddingHorizontal: 6,
    paddingTop:        6,
    paddingBottom:     8,
    borderWidth:       1,
    borderColor:       "rgba(30,58,138,0.08)",
    shadowColor:       "#1E3A8A",
    shadowOffset:      { width: 0, height: 10 },
    shadowOpacity:     0.13,
    shadowRadius:      30,
    elevation:         16,
    overflow:          "hidden",
  },
  shimmer: {
    position:        "absolute",
    top:             0,
    left:            60,
    right:           60,
    height:          1.5,
    borderRadius:    1,
    backgroundColor: "rgba(6,182,212,0.35)",
  },
  tabItem: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "center",
    paddingVertical: 2,
  },
  iconPill: {
    position:        "absolute",
    width:           48,
    height:          34,
    borderRadius:    14,
    backgroundColor: "rgba(30,58,138,0.09)",
  },
  dot: {
    marginTop:       5,
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.cyan,
    shadowColor:     C.cyan,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    4,
  },
});

/* ─── Layout ─────────────────────────────────────────────────────── */
export default function CustomerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomerTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"     />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="wallet"   />
      <Tabs.Screen name="chat"     />
      <Tabs.Screen name="profile"  />
      {/* These screens exist but are hidden from the tab bar */}
      <Tabs.Screen name="tracking" options={{ href: null }} />
      <Tabs.Screen name="booking"  options={{ href: null }} />
    </Tabs>
  );
}