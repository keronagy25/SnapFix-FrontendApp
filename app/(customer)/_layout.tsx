import React from "react";
import { View, Text, Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import {
  Home, CalendarCheck, Wallet, MessageCircle, User,
} from "lucide-react-native";

const PRIMARY = "#1E3A8A";
const ACCENT  = "#06B6D4";
const MUTED   = "#94A3B8";
const WHITE   = "#FFFFFF";

function TabIcon({
  icon: Icon, label, focused,
}: {
  icon: any; label: string; focused: boolean;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 6 }}>
      <View style={{
        width:           focused ? 48 : 36,
        height:          focused ? 32 : 36,
        borderRadius:    focused ? 12 : 10,
        backgroundColor: focused ? PRIMARY + "15" : "transparent",
        alignItems:      "center",
        justifyContent:  "center",
        marginBottom:    2,
      }}>
        <Icon
          size={22}
          color={focused ? PRIMARY : MUTED}
          strokeWidth={focused ? 2.2 : 1.8}
        />
      </View>
      <Text style={{
        fontSize:   10,
        fontFamily: focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
        color:      focused ? PRIMARY : MUTED,
        marginTop:  0,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function CustomerLayout() {
  const { width } = useWindowDimensions();
  const isWeb     = width >= 1024;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position:        "absolute",
          bottom:          isWeb ? 24 : Platform.OS === "ios" ? 0 : 12,
          left:            isWeb ? "50%" as any : 16,
          right:           isWeb ? "auto" as any : 16,
          width:           isWeb ? 420 : undefined,
          transform:       isWeb ? [{ translateX: -210 }] : undefined,
          height:          isWeb ? 68 : 68,
          borderRadius:    isWeb ? 28 : 24,
          backgroundColor: WHITE,
          borderTopWidth:  0,
          shadowColor:     "#1E3A8A",
          shadowOffset:    { width: 0, height: 8 },
          shadowOpacity:   0.12,
          shadowRadius:    24,
          elevation:       12,
          paddingBottom:   0,
          paddingHorizontal: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home}          label="Home"     focused={focused} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={CalendarCheck} label="Bookings" focused={focused} /> }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Wallet}        label="Wallet"   focused={focused} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={MessageCircle} label="Chat"     focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User}          label="Profile"  focused={focused} /> }}
      />
      {/* Hidden stack screens (not tabs) */}
      <Tabs.Screen name="tracking" options={{ href: null }} />
    </Tabs>
  );
}