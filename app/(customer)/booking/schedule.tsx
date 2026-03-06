import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Star, Calendar } from "lucide-react-native";
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

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
];
const UNAVAILABLE = ["11:00 AM", "01:00 PM", "05:00 PM"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function ScheduleScreen() {
  const r          = useR();
  const today      = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selDate,  setSelDate]  = useState<Date | null>(null);
  const [selTime,  setSelTime]  = useState<string | null>(null);

  const expert      = useBookingStore((s) => s.expert);
  const setSchedule = useBookingStore((s) => s.setSchedule);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  /* Build calendar days grid */
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isPast = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d: number) => selDate?.getDate() === d && selDate?.getMonth() === month && selDate?.getFullYear() === year;
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleConfirm = () => {
    if (!selDate || !selTime) return;
    setSchedule(selDate.toISOString(), selTime);
    router.push("/(customer)/booking/payment");
  };

  const centerWrap: any = r.isWeb ? { maxWidth: r.maxW, width: "100%", alignSelf: "center" } : {};

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
              <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(18), color:"#0F172A" }}>Pick a Date & Time</Text>
              {expert && <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>with {expert.name}</Text>}
            </View>
          </View>
          <StepBar step={3} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[{ paddingHorizontal:r.px, paddingTop:24 }, centerWrap]}>

          {/* EXPERT MINI CARD */}
          {expert && (
            <MotiView from={{ opacity:0, translateY:12 }} animate={{ opacity:1, translateY:0 }} transition={{ type:"timing", duration:400 }}>
              <View style={{ backgroundColor:"#fff", borderRadius:18, padding:14, flexDirection:"row", alignItems:"center", marginBottom:24, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2, borderWidth:1, borderColor:"#F1F5F9" }}>
                <View style={{ width:46, height:46, borderRadius:14, backgroundColor:expert.avatarColor+"22", alignItems:"center", justifyContent:"center", marginRight:12 }}>
                  <Text style={{ fontFamily:"Poppins_700Bold", fontSize:14, color:expert.avatarColor }}>{expert.avatar}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color:"#0F172A" }}>{expert.name}</Text>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>{expert.rating} · {expert.jobs} jobs</Text>
                  </View>
                </View>
                <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(16), color:"#1E3A8A" }}>{expert.price} <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(11), color:"#94A3B8" }}>EGP/hr</Text></Text>
              </View>
            </MotiView>
          )}

          {/* CALENDAR */}
          <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:100, type:"timing", duration:500 }}>
            <View style={{ backgroundColor:"#fff", borderRadius:24, padding:20, marginBottom:24, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:12, elevation:3, borderWidth:1, borderColor:"#F1F5F9" }}>

              {/* Month nav */}
              <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} style={{ width:36, height:36, borderRadius:10, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center" }}>
                  <ChevronLeft size={18} color="#64748B" />
                </TouchableOpacity>
                <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(16), color:"#0F172A" }}>
                  {MONTHS[month]} {year}
                </Text>
                <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} style={{ width:36, height:36, borderRadius:10, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center" }}>
                  <ChevronRight size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={{ flexDirection:"row", marginBottom:8 }}>
                {DAYS.map((d) => (
                  <View key={d} style={{ flex:1, alignItems:"center" }}>
                    <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(11), color:"#94A3B8" }}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Day cells */}
              <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
                {cells.map((day, ci) => {
                  if (!day) return <View key={`e-${ci}`} style={{ width:`${100/7}%`, aspectRatio:1 }} />;
                  const past   = isPast(day);
                  const sel    = isSelected(day);
                  const tod    = isToday(day);
                  return (
                    <TouchableOpacity key={day} disabled={past} onPress={() => setSelDate(new Date(year, month, day))}
                      style={{ width:`${100/7}%`, aspectRatio:1, alignItems:"center", justifyContent:"center", padding:2 }}>
                      <View style={{
                        width:"80%", aspectRatio:1, borderRadius:999, alignItems:"center", justifyContent:"center",
                        backgroundColor: sel ? "#1E3A8A" : tod ? "#EFF6FF" : "transparent",
                        borderWidth: tod && !sel ? 1.5 : 0,
                        borderColor: "#1E3A8A",
                      }}>
                        <Text style={{ fontFamily: sel ? "Poppins_700Bold" : "Poppins_400Regular", fontSize:r.fs(13), color: sel ? "#fff" : past ? "#CBD5E1" : tod ? "#1E3A8A" : "#334155" }}>{day}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </MotiView>

          {/* TIME SLOTS */}
          {selDate && (
            <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ type:"timing", duration:400 }}>
              <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(17), color:"#0F172A", marginBottom:14 }}>
                Available Times —{" "}
                <Text style={{ color:"#3B82F6" }}>{selDate.getDate()} {MONTHS[selDate.getMonth()]}</Text>
              </Text>
              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:24 }}>
                {TIME_SLOTS.map((slot) => {
                  const unavail = UNAVAILABLE.includes(slot);
                  const sel     = selTime === slot;
                  return (
                    <TouchableOpacity key={slot} disabled={unavail} onPress={() => setSelTime(slot)}
                      style={{ paddingHorizontal:16, paddingVertical:10, borderRadius:14, backgroundColor: sel ? "#1E3A8A" : unavail ? "#F8FAFC" : "#fff", borderWidth:1.5, borderColor: sel ? "#1E3A8A" : unavail ? "#F1F5F9" : "#E2E8F0" }}>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
                        <Clock size={12} color={sel ? "#06B6D4" : unavail ? "#CBD5E1" : "#94A3B8"} />
                        <Text style={{ fontFamily: sel ? "Poppins_600SemiBold" : "Poppins_400Regular", fontSize:r.fs(13), color: sel ? "#fff" : unavail ? "#CBD5E1" : "#334155" }}>
                          {slot}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection:"row", gap:16, alignItems:"center", marginBottom:8 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}><View style={{ width:12, height:12, borderRadius:4, backgroundColor:"#1E3A8A" }} /><Text style={{ fontFamily:"Poppins_400Regular", fontSize:12, color:"#64748B" }}>Selected</Text></View>
                <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}><View style={{ width:12, height:12, borderRadius:4, backgroundColor:"#F1F5F9", borderWidth:1, borderColor:"#E2E8F0" }} /><Text style={{ fontFamily:"Poppins_400Regular", fontSize:12, color:"#64748B" }}>Unavailable</Text></View>
              </View>
            </MotiView>
          )}

        </View>
      </ScrollView>

      {/* STICKY CONFIRM */}
      <View style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"#fff", paddingHorizontal:r.px, paddingTop:16, paddingBottom: Platform.OS === "ios" ? 32 : 20, borderTopWidth:1, borderTopColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:-4}, shadowOpacity:0.07, shadowRadius:12, elevation:10 }}>
        <View style={centerWrap}>
          {selDate && selTime ? (
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
              <View>
                <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>Selected slot</Text>
                <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#0F172A" }}>
                  {selDate.getDate()} {MONTHS[selDate.getMonth()]} · {selTime}
                </Text>
              </View>
              <TouchableOpacity onPress={handleConfirm} style={{ backgroundColor:"#1E3A8A", paddingHorizontal:28, paddingVertical:13, borderRadius:16, flexDirection:"row", alignItems:"center", gap:8 }}>
                <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(14), color:"#fff" }}>Continue</Text>
                <ChevronRight size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ backgroundColor:"#F8FAFC", borderRadius:14, padding:14, alignItems:"center" }}>
              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"#94A3B8" }}>
                {!selDate ? "👆 Select a date to continue" : "👆 Now pick a time slot"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}