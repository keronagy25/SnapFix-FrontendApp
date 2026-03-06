import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions, Alert,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, CheckCircle, CreditCard, Banknote,
  Wallet, ChevronRight, Shield, Clock, Star, MapPin,
} from "lucide-react-native";
import { useBookingStore } from "@/store/bookingstore";

function useR() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 1024;
  return { width, isWeb, px: isWeb ? 40 : 20, maxW: isWeb ? 720 : 9999, fs: (n: number) => (isWeb ? n * 1.05 : n) };
}

function StepBar({ step }: { step: number }) {
  const steps = ["Service", "Expert", "Schedule", "Payment"];
  return (
    <View style={{ flexDirection:"row", alignItems:"center" }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems:"center" }}>
            <View style={{ width:28, height:28, borderRadius:14, backgroundColor: i < step ? "#1E3A8A" : "#E2E8F0", alignItems:"center", justifyContent:"center" }}>
              {i < step - 1
                ? <Text style={{ color:"#fff", fontSize:12 }}>✓</Text>
                : <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:11, color: i === step - 1 ? "#fff" : "#94A3B8" }}>{i + 1}</Text>
              }
            </View>
          </View>
          {i < steps.length - 1 && <View style={{ flex:1, height:2, backgroundColor: i < step - 1 ? "#1E3A8A" : "#E2E8F0", marginHorizontal:2 }} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const PAYMENT_METHODS = [
  { id: "cash",   label: "Cash",          subtitle: "Pay on arrival",        icon: Banknote,   color: "#10B981", bg: "#ECFDF5" },
  { id: "card",   label: "Credit/Debit",  subtitle: "Visa, Mastercard",      icon: CreditCard, color: "#3B82F6", bg: "#EFF6FF" },
  { id: "wallet", label: "SnapFix Wallet",subtitle: "Balance: 0 EGP",        icon: Wallet,     color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "fawry",  label: "Fawry",         subtitle: "Pay at any Fawry outlet",icon: () => <Text style={{ fontSize:16 }}>🏪</Text>, color: "#F97316", bg: "#FFF7ED" },
] as const;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function PaymentScreen() {
  const r             = useR();
  const [loading,     setLoading]     = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);
  const [selectedPay, setSelectedPay] = useState<typeof PAYMENT_METHODS[number]["id"] | null>(null);

  const { expert, serviceLabel, serviceEmoji, date, timeSlot, reset } = useBookingStore();

  const parsedDate = date ? new Date(date) : null;
  const dateStr    = parsedDate
    ? `${parsedDate.getDate()} ${MONTHS[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`
    : "—";

  const subtotal   = expert?.price ?? 0;
  const serviceFee = Math.round(subtotal * 0.05);
  const total      = subtotal + serviceFee;

  const handleConfirm = async () => {
    if (!selectedPay) {
      Alert.alert("Select Payment", "Please choose a payment method to continue.");
      return;
    }
    setLoading(true);
    // Simulate booking API call
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    setConfirmed(true);
  };

  const handleDone = () => {
    reset();
    router.replace("/(customer)/home");
  };

  const centerWrap: any = r.isWeb ? { maxWidth: r.maxW, width: "100%", alignSelf: "center" } : {};

  /* ── SUCCESS SCREEN ── */
  if (confirmed) {
    return (
      <View style={{ flex:1, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", paddingHorizontal:r.px }}>
        <MotiView from={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", damping:12, delay:0 }}>
          <LinearGradient colors={["#1E3A8A","#3B82F6"]} style={{ width:100, height:100, borderRadius:32, alignItems:"center", justifyContent:"center", marginBottom:24, alignSelf:"center" }}>
            <CheckCircle size={48} color="#fff" fill="rgba(255,255,255,0.2)" />
          </LinearGradient>
        </MotiView>

        <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:300, type:"timing", duration:500 }} style={{ alignItems:"center" }}>
          <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(26), color:"#0F172A", marginBottom:8, textAlign:"center" }}>Booking Confirmed! 🎉</Text>
          <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(14), color:"#64748B", textAlign:"center", lineHeight:22, marginBottom:32 }}>
            Your booking with {expert?.name} has been confirmed.{"\n"}You'll receive a notification when they're on the way.
          </Text>

          {/* Booking summary card */}
          <View style={{ backgroundColor:"#fff", borderRadius:24, padding:20, width:"100%", maxWidth:400, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:16, elevation:4, borderWidth:1, borderColor:"#F1F5F9", marginBottom:28 }}>
            {[
              { label:"Service",  value:`${serviceEmoji} ${serviceLabel}` },
              { label:"Expert",   value:expert?.name ?? "—" },
              { label:"Date",     value:dateStr },
              { label:"Time",     value:timeSlot ?? "—" },
              { label:"Payment",  value:selectedPay ? PAYMENT_METHODS.find(p=>p.id===selectedPay)?.label ?? "—" : "—" },
              { label:"Total",    value:`${total} EGP`, highlight: true },
            ].map((row, i, arr) => (
              <View key={row.label} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor:"#F8FAFC" }}>
                <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"#94A3B8" }}>{row.label}</Text>
                <Text style={{ fontFamily: row.highlight ? "Poppins_800ExtraBold" : "Poppins_600SemiBold", fontSize: row.highlight ? r.fs(16) : r.fs(13), color: row.highlight ? "#1E3A8A" : "#0F172A" }}>{row.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={handleDone} style={{ backgroundColor:"#1E3A8A", paddingHorizontal:40, paddingVertical:14, borderRadius:18 }}>
            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#fff" }}>Back to Home</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  /* ── PAYMENT SCREEN ── */
  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={{ backgroundColor:"#fff", paddingTop: Platform.OS === "web" ? 20 : 52, paddingBottom:16, paddingHorizontal:r.px, borderBottomWidth:1, borderBottomColor:"#F1F5F9" }}>
        <View style={centerWrap}>
          <View style={{ flexDirection:"row", alignItems:"center", marginBottom:16 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width:40, height:40, borderRadius:12, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", marginRight:12 }}>
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(18), color:"#0F172A" }}>Payment</Text>
              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>Almost done!</Text>
            </View>
          </View>
          <StepBar step={4} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={[{ paddingHorizontal:r.px, paddingTop:24 }, centerWrap]}>

          {/* ORDER SUMMARY */}
          <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:100, type:"timing", duration:500 }}>
            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(17), color:"#0F172A", marginBottom:12 }}>Order Summary</Text>
            <View style={{ backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:24, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:2, borderWidth:1, borderColor:"#F1F5F9" }}>

              {/* Expert row */}
              {expert && (
                <View style={{ flexDirection:"row", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottomWidth:1, borderBottomColor:"#F8FAFC" }}>
                  <View style={{ width:48, height:48, borderRadius:14, backgroundColor:expert.avatarColor+"22", alignItems:"center", justifyContent:"center", marginRight:12 }}>
                    <Text style={{ fontFamily:"Poppins_700Bold", fontSize:15, color:expert.avatarColor }}>{expert.avatar}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color:"#0F172A" }}>{expert.name}</Text>
                    <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>{expert.rating} · {expert.profession}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems:"flex-end" }}>
                    <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#1E3A8A" }}>{expert.price}</Text>
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(11), color:"#94A3B8" }}>EGP/hr</Text>
                  </View>
                </View>
              )}

              {/* Details */}
              {[
                { icon: <Text style={{ fontSize:14 }}>{serviceEmoji}</Text>, label:"Service",  value:serviceLabel ?? "—" },
                { icon: <Clock size={14} color="#94A3B8" />,                  label:"Time",     value:`${dateStr} · ${timeSlot ?? "—"}` },
                { icon: <MapPin size={14} color="#94A3B8" />,                  label:"Location", value:"Your home address" },
              ].map((row) => (
                <View key={row.label} style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:10 }}>
                  <View style={{ width:28, height:28, borderRadius:8, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center" }}>{row.icon}</View>
                  <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8", width:70 }}>{row.label}</Text>
                  <Text style={{ fontFamily:"Poppins_500Medium", fontSize:r.fs(13), color:"#334155", flex:1 }}>{row.value}</Text>
                </View>
              ))}

              {/* Price breakdown */}
              <View style={{ marginTop:14, paddingTop:14, borderTopWidth:1, borderTopColor:"#F8FAFC" }}>
                {[
                  { label:"Service fee", value:`${subtotal} EGP` },
                  { label:"Platform fee (5%)", value:`${serviceFee} EGP` },
                ].map((row) => (
                  <View key={row.label} style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:8 }}>
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"#94A3B8" }}>{row.label}</Text>
                    <Text style={{ fontFamily:"Poppins_500Medium", fontSize:r.fs(13), color:"#334155" }}>{row.value}</Text>
                  </View>
                ))}
                <View style={{ flexDirection:"row", justifyContent:"space-between", paddingTop:10, borderTopWidth:1.5, borderTopColor:"#E2E8F0", marginTop:4 }}>
                  <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#0F172A" }}>Total</Text>
                  <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(18), color:"#1E3A8A" }}>{total} EGP</Text>
                </View>
              </View>
            </View>
          </MotiView>

          {/* PAYMENT METHODS */}
          <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:200, type:"timing", duration:500 }}>
            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(17), color:"#0F172A", marginBottom:12 }}>Payment Method</Text>
            {PAYMENT_METHODS.map((method, i) => {
              const sel = selectedPay === method.id;
              const IconComp = method.icon as any;
              return (
                <MotiView key={method.id} from={{ opacity:0, translateX:-16 }} animate={{ opacity:1, translateX:0 }} transition={{ delay:250 + i*60, type:"timing", duration:400 }}>
                  <TouchableOpacity onPress={() => setSelectedPay(method.id)} activeOpacity={0.88}
                    style={{ backgroundColor:"#fff", borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", marginBottom:10, borderWidth:2, borderColor: sel ? "#1E3A8A" : "#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:sel?4:1}, shadowOpacity:sel?0.1:0.04, shadowRadius:sel?12:4, elevation:sel?4:1 }}>
                    <View style={{ width:44, height:44, borderRadius:14, backgroundColor: sel ? "#1E3A8A" : method.bg, alignItems:"center", justifyContent:"center", marginRight:14 }}>
                      <IconComp size={20} color={sel ? "#06B6D4" : method.color} />
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color: sel ? "#1E3A8A" : "#0F172A" }}>{method.label}</Text>
                      <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>{method.subtitle}</Text>
                    </View>
                    <View style={{ width:22, height:22, borderRadius:11, borderWidth:2, borderColor: sel ? "#1E3A8A" : "#CBD5E1", backgroundColor: sel ? "#1E3A8A" : "transparent", alignItems:"center", justifyContent:"center" }}>
                      {sel && <View style={{ width:8, height:8, borderRadius:4, backgroundColor:"#fff" }} />}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </MotiView>

          {/* TRUST NOTE */}
          <MotiView from={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:500, type:"timing", duration:400 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F0FDF4", borderRadius:14, padding:12, marginTop:8 }}>
              <Shield size={16} color="#10B981" />
              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#10B981", flex:1 }}>
                Secure payment · Your info is encrypted and protected
              </Text>
            </View>
          </MotiView>

        </View>
      </ScrollView>

      {/* STICKY CONFIRM */}
      <View style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", paddingHorizontal:r.px, paddingTop:16, paddingBottom: Platform.OS === "ios" ? 32 : 20, borderTopWidth:1, borderTopColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:-4}, shadowOpacity:0.08, shadowRadius:16, elevation:10 }}>
        <View style={centerWrap}>
          <TouchableOpacity onPress={handleConfirm} disabled={loading} activeOpacity={0.9}
            style={{ backgroundColor: selectedPay ? "#1E3A8A" : "#94A3B8", borderRadius:18, paddingVertical:15, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:10 }}>
            {loading
              ? <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#fff" }}>Confirming booking…</Text>
              : <>
                  <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#fff" }}>Confirm Booking · {total} EGP</Text>
                  <ChevronRight size={16} color={selectedPay ? "#06B6D4" : "#fff"} />
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}