import React from "react";
import { View, Text, Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import {
  LayoutDashboard, Briefcase, Wallet, MessageCircle, User,
} from "lucide-react-native";

const ACCENT = "#06B6D4";
const MUTED  = "#94A3B8";
const WHITE  = "#FFFFFF";

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
        backgroundColor: focused ? ACCENT + "20" : "transparent",
        alignItems:      "center",
        justifyContent:  "center",
        marginBottom:    2,
      }}>
        <Icon
          size={22}
          color={focused ? ACCENT : MUTED}
          strokeWidth={focused ? 2.2 : 1.8}
        />
      </View>
      <Text style={{
        fontSize:   10,
        fontFamily: focused ? "Poppins_600SemiBold" : "Poppins_400Regular",
        color:      focused ? ACCENT : MUTED,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function ProviderLayout() {
  const { width } = useWindowDimensions();
  const isWeb     = width >= 1024;

  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position:          "absolute",
          bottom:            isWeb ? 24 : Platform.OS === "ios" ? 0 : 12,
          left:              isWeb ? "50%" as any : 16,
          right:             isWeb ? "auto" as any : 16,
          width:             isWeb ? 420 : undefined,
          transform:         isWeb ? [{ translateX: -210 }] : undefined,
          height:            68,
          borderRadius:      isWeb ? 28 : 24,
          backgroundColor:   WHITE,
          borderTopWidth:    0,
          shadowColor:       "#06B6D4",
          shadowOffset:      { width: 0, height: 8 },
          shadowOpacity:     0.14,
          shadowRadius:      24,
          elevation:         12,
          paddingBottom:     0,
          paddingHorizontal: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={LayoutDashboard} label="Dashboard" focused={focused} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Briefcase}       label="Jobs"      focused={focused} /> }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Wallet}          label="Wallet"    focused={focused} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={MessageCircle}   label="Chat"      focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User}            label="Profile"   focused={focused} /> }}
      />
    </Tabs>
  );
}