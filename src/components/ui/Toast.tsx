/**
 * Toast.tsx — global in-app toast
 *
 * 1. Wrap your root layout with <ToastContainer />
 * 2. Call showToast() from anywhere
 *
 * showToast({ type: "success", message: "Done!" });
 * showToast({ type: "error",   title: "Login Failed", message: "Wrong password." });
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, TouchableOpacity, Platform, Dimensions } from "react-native";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "@/components/ui/lucide-icon";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastConfig {
  type:      ToastType;
  message:   string;
  title?:    string;
  duration?: number;
}

/* singleton */
type Listener = (cfg: ToastConfig) => void;
const _listeners: Listener[] = [];
export function showToast(cfg: ToastConfig) {
  _listeners.forEach((fn) => fn(cfg));
}

const CFG: Record<ToastType, { color: string; bg: string; border: string; Icon: any }> = {
  success: { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", Icon: CheckCircle   },
  error:   { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", Icon: XCircle       },
  warning: { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", Icon: AlertTriangle },
  info:    { color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", Icon: Info          },
};

export function ToastContainer() {
  const [toast,   setToast]   = useState<ToastConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const anim    = useRef(new Animated.Value(0)).current;
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setVisible(false);
      setToast(null);
    });
  };

  const show = (cfg: ToastConfig) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(cfg);
    setVisible(true);
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 200 }).start();
    timer.current = setTimeout(dismiss, cfg.duration ?? 3800);
  };

  useEffect(() => {
    _listeners.push(show);
    return () => { const i = _listeners.indexOf(show); if (i !== -1) _listeners.splice(i, 1); };
  }, []);

  if (!visible || !toast) return null;

  const c    = CFG[toast.type];
  const Icon = c.Icon;

  return (
    <Animated.View style={{
      position:  "absolute",
      top:       Platform.OS === "android" ? 48 : 56,
      left:      16, right: 16,
      zIndex:    9999,
      opacity:   anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
    }}>
      <View style={{
        backgroundColor: c.bg, borderRadius: 18, borderWidth: 1.5, borderColor: c.border,
        flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 10,
      }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.color + "20", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={c.color} />
        </View>
        <View style={{ flex: 1 }}>
          {toast.title && (
            <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 13, color: "#0F172A", marginBottom: 2 }}>
              {toast.title}
            </Text>
          )}
          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: "#334155", lineHeight: 18 }}>
            {toast.message}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss}
          style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}>
          <X size={13} color="#64748B" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}