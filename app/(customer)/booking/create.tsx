import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  TextInput, Switch, Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, ChevronDown, CheckCircle, Zap,
  Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle,
} from "@/components/ui/lucide-icon";
import { useAuthStore }  from "@/store/authStore";
import { Typography }    from "@/theme/typography";
import { getCategories, getRegions, type Category, type Region } from "@/services/coreService";
import { createBooking } from "@/services/bookingService";


function getApiError(err: any, fallback = "Something went wrong."): string {
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail)           return tryExtract(v.detail);
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
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          <View style={{ backgroundColor:ok?"#10B981":"#EF4444", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>{ok?"✅":"⚠️"}</Text>
          </View>
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>{title}</Text>
            <View style={{ backgroundColor:ok?"#ECFDF5":"#FEF2F2", borderRadius:14, padding:14, borderWidth:1, borderColor:ok?"#A7F3D0":"#FECACA", marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:ok?"#065F46":"#991B1B", textAlign:"center", lineHeight:22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor:ok?"#10B981":"#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────── */
function Field({ label, required = false, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B", marginBottom: 6 }}>
        {label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      {children}
      {!!error && (
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</Text>
      )}
    </View>
  );
}

const baseInput: any = {
  fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A",
  backgroundColor: "#F8FAFC", borderRadius: 14, borderWidth: 1.5,
  borderColor: "#E2E8F0", paddingHorizontal: 14, height: 50,
};
const errInput: any = { ...baseInput, borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" };

/* ─── Select pill ────────────────────────────────────────────────── */
function SelectPill({ selected, onPress, placeholder, hasError }: {
  selected: string; onPress: () => void; placeholder: string; hasError?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress}
      style={[hasError ? errInput : baseInput, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: selected ? "#0F172A" : "#94A3B8", flex: 1 }}>
        {selected || placeholder}
      </Text>
      <ChevronDown size={16} color="#94A3B8" />
    </TouchableOpacity>
  );
}

/* ─── Category Picker Modal ───────────────────────────────────────── */
function CategoryPickerModal({ visible, items, onSelect, onClose }: {
  visible: boolean; items: Category[]; onSelect: (item: Category) => void; onClose: () => void;
}) {
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ 
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
      }}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          onPress={onClose} 
          activeOpacity={1} 
        />
        <View style={{ 
          backgroundColor: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          maxHeight: "80%",
          paddingBottom: Platform.OS === "ios" ? 40 : 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 20,
        }}>
          <View style={{ 
            width: 40, 
            height: 4, 
            borderRadius: 2, 
            backgroundColor: "#E2E8F0", 
            alignSelf: "center", 
            marginBottom: 16 
          }} />
          <Text style={{ 
            fontFamily: Typography.fonts.bold, 
            fontSize: 17, 
            color: "#0F172A", 
            marginBottom: 14 
          }}>Select Service Category</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => { onSelect(item); onClose(); }}
                style={{ 
                  paddingVertical: 14, 
                  borderBottomWidth: 1, 
                  borderBottomColor: "#F1F5F9" 
                }}>
                <Text style={{ 
                  fontFamily: Typography.fonts.medium, 
                  fontSize: 15, 
                  color: "#0F172A" 
                }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Region Picker Modal ───────────────────────────────────────── */
function RegionPickerModal({ visible, items, onSelect, onClose }: {
  visible: boolean; items: Region[]; onSelect: (item: Region) => void; onClose: () => void;
}) {
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ 
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
      }}>
        <TouchableOpacity 
          style={{ flex: 1 }} 
          onPress={onClose} 
          activeOpacity={1} 
        />
        <View style={{ 
          backgroundColor: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          maxHeight: "80%",
          paddingBottom: Platform.OS === "ios" ? 40 : 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 20,
        }}>
          <View style={{ 
            width: 40, 
            height: 4, 
            borderRadius: 2, 
            backgroundColor: "#E2E8F0", 
            alignSelf: "center", 
            marginBottom: 16 
          }} />
          <Text style={{ 
            fontFamily: Typography.fonts.bold, 
            fontSize: 17, 
            color: "#0F172A", 
            marginBottom: 14 
          }}>Select Region</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => { onSelect(item); onClose(); }}
                style={{ 
                  paddingVertical: 14, 
                  borderBottomWidth: 1, 
                  borderBottomColor: "#F1F5F9" 
                }}>
                <Text style={{ 
                  fontFamily: Typography.fonts.medium, 
                  fontSize: 15, 
                  color: "#0F172A" 
                }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CALENDAR PICKER
══════════════════════════════════════════════════════════════════ */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarPicker({ visible, value, onSelect, onClose }: {
  visible: boolean; value: string; onSelect: (d: string) => void; onClose: () => void;
}) {
  const today = new Date();
  const init  = value ? new Date(value) : today;
  const [viewYear,  setViewYear]  = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [selected,  setSelected]  = useState(value);

  if (!visible) return null;

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth= new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells      = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const isSelected = (d: number) => toDateStr(d) === selected;
  const isToday    = (d: number) => {
    const t = new Date();
    return d === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };
  const isPast     = (d: number) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:20 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:28, padding:20, shadowColor:"#000", shadowOffset:{width:0,height:12}, shadowOpacity:0.15, shadowRadius:32, elevation:16 }}>

          {/* Month nav */}
          <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <TouchableOpacity onPress={prevMonth} style={{ width:38, height:38, borderRadius:12, backgroundColor:"#F1F5F9", alignItems:"center", justifyContent:"center" }}>
              <ChevronLeft size={18} color="#334155" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#0F172A" }}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ width:38, height:38, borderRadius:12, backgroundColor:"#F1F5F9", alignItems:"center", justifyContent:"center" }}>
              <ChevronRight size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={{ flexDirection:"row", marginBottom:8 }}>
            {DAYS.map(d => (
              <View key={d} style={{ flex:1, alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#94A3B8" }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Date cells */}
          <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={{ width:`${100/7}%`, height:42 }} />;
              const past = isPast(day);
              const sel  = isSelected(day);
              const tod  = isToday(day);
              return (
                <TouchableOpacity key={day} disabled={past} onPress={() => setSelected(toDateStr(day))}
                  style={{ width:`${100/7}%`, height:42, alignItems:"center", justifyContent:"center" }}>
                  <View style={{
                    width:36, height:36, borderRadius:12, alignItems:"center", justifyContent:"center",
                    backgroundColor: sel ? "#1E3A8A" : tod ? "#EFF6FF" : "transparent",
                    borderWidth: tod && !sel ? 1.5 : 0,
                    borderColor: "#1E3A8A",
                  }}>
                    <Text style={{
                      fontFamily: sel ? Typography.fonts.bold : Typography.fonts.regular,
                      fontSize:14,
                      color: sel ? "#fff" : past ? "#CBD5E1" : tod ? "#1E3A8A" : "#0F172A",
                    }}>{day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={{ flexDirection:"row", gap:12, marginTop:20 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (selected) { onSelect(selected); onClose(); } }}
              disabled={!selected}
              style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor: selected ? "#1E3A8A" : "#E2E8F0", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color: selected ? "#fff" : "#94A3B8" }}>
                {selected ? `Confirm ${selected}` : "Select a date"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TIME PICKER
══════════════════════════════════════════════════════════════════ */
function TimePicker({ visible, value, onSelect, onClose }: {
  visible: boolean; value: string; onSelect: (t: string) => void; onClose: () => void;
}) {
  const parseTime = (v: string) => {
    const parts = v?.split(":") ?? [];
    return { h: parseInt(parts[0] ?? "9") || 9, m: parseInt(parts[1] ?? "0") || 0 };
  };
  const init = parseTime(value);
  const [hour,   setHour]   = useState(init.h);
  const [minute, setMinute] = useState(init.m);
  const [ampm,   setAmpm]   = useState(init.h < 12 ? "AM" : "PM");

  if (!visible) return null;

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const confirm = () => {
    let h24 = hour % 12;
    if (ampm === "PM") h24 += 12;
    const timeStr = `${String(h24).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`;
    onSelect(timeStr);
    onClose();
  };

  const display12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:20 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:28, padding:20 }}>

          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:20 }}>
            Select Time
          </Text>

          {/* AM / PM toggle */}
          <View style={{ flexDirection:"row", backgroundColor:"#F1F5F9", borderRadius:14, padding:4, marginBottom:20 }}>
            {["AM","PM"].map(p => (
              <TouchableOpacity key={p} onPress={() => setAmpm(p)} style={{ flex:1, paddingVertical:10, borderRadius:11, backgroundColor: ampm===p ? "#1E3A8A" : "transparent", alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color: ampm===p ? "#fff" : "#64748B" }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hours */}
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#94A3B8", marginBottom:10, letterSpacing:0.8 }}>HOUR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, marginBottom:20 }}>
            {hours12.map(h => (
              <TouchableOpacity key={h} onPress={() => setHour(h)}
                style={{ width:44, height:44, borderRadius:13, backgroundColor: display12===h ? "#1E3A8A" : "#F8FAFC", borderWidth:1.5, borderColor: display12===h ? "#1E3A8A" : "#E2E8F0", alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color: display12===h ? "#fff" : "#334155" }}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Minutes */}
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#94A3B8", marginBottom:10, letterSpacing:0.8 }}>MINUTE</Text>
          <View style={{ flexDirection:"row", gap:10, marginBottom:24 }}>
            {minutes.map(m => (
              <TouchableOpacity key={m} onPress={() => setMinute(m)}
                style={{ flex:1, paddingVertical:12, borderRadius:13, backgroundColor: minute===m ? "#1E3A8A" : "#F8FAFC", borderWidth:1.5, borderColor: minute===m ? "#1E3A8A" : "#E2E8F0", alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color: minute===m ? "#fff" : "#334155" }}>:{String(m).padStart(2,"0")}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <View style={{ backgroundColor:"#EFF6FF", borderRadius:14, padding:14, alignItems:"center", marginBottom:20 }}>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:28, color:"#1E3A8A", letterSpacing:2 }}>
              {String(display12).padStart(2,"0")}:{String(minute).padStart(2,"0")} {ampm}
            </Text>
          </View>

          <View style={{ flexDirection:"row", gap:12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirm} style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor:"#1E3A8A", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
export default function BookingCreateScreen() {
  const token  = useAuthStore((s) => s.token);
  const params = useLocalSearchParams<{ category_id?: string; category_name?: string; is_urgent?: string }>();

  const [categories,   setCategories]   = useState<Category[]>([]);
  const [regions,      setRegions]      = useState<Region[]>([]);
  const [catPicker,    setCatPicker]    = useState(false);
  const [regPicker,    setRegPicker]    = useState(false);
  const [calPicker,    setCalPicker]    = useState(false);
  const [timePicker,   setTimePicker]   = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [loadingData,  setLoadingData]  = useState(true);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [apiError,     setApiError]     = useState<string | null>(null);
  const [feedback,     setFeedback]     = useState<{ ok:boolean; title:string; msg:string } | null>(null);

  const [form, setForm] = useState({
    category_id:    params.category_id ? Number(params.category_id) : 0,
    category_name:  params.category_name ?? "",
    region_id:      0,
    region_name:    "",
    address:        "",
    title:          "",
    description:    "",
    preferred_date: "",
    preferred_time: "09:00:00",
    is_urgent:      params.is_urgent === "true",
    estimated_price:"",
  });

  const set = (key: string, val: any) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  useEffect(() => {
    (async () => {
      setLoadingData(true);
      try {
        const [cats, regs] = await Promise.all([
          getCategories(token ?? undefined),
          getRegions(token ?? undefined),
        ]);
        setCategories(cats);
        setRegions(regs);
      } catch {
        setFeedback({ ok:false, title:"Failed to Load", msg:"Could not load form data. Please go back and try again." });
      } finally {
        setLoadingData(false);
      }
    })();
  }, [token]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.category_id)           e.category       = "Please select a service category";
    if (!form.region_id)             e.region         = "Please select a region";
    if (!form.address.trim())        e.address        = "Address is required";
    if (!form.title.trim())          e.title          = "Title is required";
    if (!form.description.trim())    e.description    = "Description is required";
    if (!form.preferred_date)        e.preferred_date = "Please select a date";
    if (!form.preferred_time)        e.preferred_time = "Please select a time";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { setFeedback({ ok:false, title:"Required Fields", msg:"Please fill in all required fields before submitting." }); return; }
    if (!token)      { setFeedback({ ok:false, title:"Not Logged In", msg:"Your session has expired. Please log in again." }); return; }

    setSubmitting(true);
    setApiError(null);
    try {
      await createBooking({
        category:        form.category_id,
        region:          form.region_id,
        address:         form.address.trim(),
        title:           form.title.trim(),
        description:     form.description.trim(),
        preferred_date:  form.preferred_date,
        preferred_time:  form.preferred_time,
        is_urgent:       form.is_urgent,
        estimated_price: form.estimated_price.trim() || undefined,
      }, token);
      setSuccess(true);
    } catch (err: any) {
      const d = err?.data ?? {};
      console.log("[BookingCreate] error:", JSON.stringify(d));
      const fieldMap: Record<string, string> = {
        category:"category", region:"region", address:"address",
        title:"title", description:"description",
        preferred_date:"preferred_date", preferred_time:"preferred_time",
      };
      const inline: Record<string, string> = {};
      let hasInline = false;
      for (const [k, fk] of Object.entries(fieldMap)) {
        if (d[k]) { inline[fk] = Array.isArray(d[k]) ? d[k][0] : d[k]; hasInline = true; }
      }
      if (hasInline) {
        setErrors(inline);
        setApiError("Please fix the highlighted fields below.");
      } else {
        const msg = getApiError(err, "Failed to create booking.");
        setApiError(msg);
        setFeedback({ ok:false, title:"Booking Failed", msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* format display */
  const displayTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm   = h >= 12 ? "PM" : "AM";
    const h12    = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,"0")} ${ampm}`;
  };

  const displayDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-EG", { weekday:"short", year:"numeric", month:"short", day:"numeric" });
  };

  if (success) {
    return (
      <View style={{ flex:1, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
        <StatusBar barStyle="dark-content" />
        <View >
          <View style={{ width:100, height:100, borderRadius:30, backgroundColor:"#ECFDF5", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
            <CheckCircle size={52} color="#10B981" />
          </View>
        </View>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:24, color:"#0F172A", marginBottom:10, textAlign:"center" }}>Booking Submitted!</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#64748B", textAlign:"center", lineHeight:22, marginBottom:32 }}>
          Your request is now pending.{"\n"}We'll assign a provider shortly.
        </Text>
        <TouchableOpacity onPress={() => router.replace("/(customer)/booking" as any)}
          style={{ backgroundColor:"#1E3A8A", paddingHorizontal:36, paddingVertical:16, borderRadius:18, width:"100%", alignItems:"center", marginBottom:12 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(customer)/home" as any)}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize:14, color:"#94A3B8" }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingData) {
    return (
      <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:24, paddingHorizontal:20 }}>
          <View style={{ flexDirection:"row", alignItems:"center", gap:14 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width:40, height:40, borderRadius:13, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:22, color:"#fff" }}>New Booking</Text>
          </View>
        </LinearGradient>
        {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#94A3B8", marginTop:12 }}>Loading form…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      {/* Header */}
      <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:24, paddingHorizontal:20 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width:40, height:40, borderRadius:13, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:22, color:"#fff" }}>New Booking</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.6)" }}>Fill in all required fields</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ padding:20, paddingBottom: Platform.OS === "ios" ? 120 : 100 }} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
      >

        {/* ── API error banner ── */}
        {apiError && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#FEF2F2", borderRadius:14, padding:14, marginBottom:4, marginTop:4, borderWidth:1, borderColor:"#FECACA" }}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={{ flex:1, fontFamily: Typography.fonts.medium, fontSize:13, color:"#EF4444" }}>{apiError}</Text>
          </View>
        )}
        
        {/* ── SERVICE DETAILS ── */}
        <View>
          <View style={{ backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:14, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:14 }}>🔧 Service Details</Text>
            <Field label="Service Category" required error={errors.category}>
              <SelectPill selected={form.category_name} onPress={() => setCatPicker(true)} placeholder="Select a category" hasError={!!errors.category} />
            </Field>
            <Field label="Title" required error={errors.title}>
              <TextInput value={form.title} onChangeText={v => set("title", v)} placeholder="e.g. Leaking pipe under sink"
                style={errors.title ? errInput : baseInput} />
            </Field>
            <Field label="Description" required error={errors.description}>
              <TextInput value={form.description} onChangeText={v => set("description", v)}
                placeholder="Describe the issue in detail…" multiline numberOfLines={3}
                style={[errors.description ? errInput : baseInput, { height:90, paddingTop:12, textAlignVertical:"top" }]} />
            </Field>
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:10, borderTopWidth:1, borderTopColor:"#F1F5F9", marginTop:4 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                <Zap size={16} color={form.is_urgent ? "#EF4444" : "#94A3B8"} />
                <View>
                  <Text style={{ fontFamily: Typography.fonts.medium, fontSize:14, color: form.is_urgent ? "#EF4444" : "#64748B" }}>Mark as Urgent</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#94A3B8" }}>Provider arrives within 30 min</Text>
                </View>
              </View>
              <Switch value={form.is_urgent} onValueChange={v => set("is_urgent", v)}
                trackColor={{ false:"#E2E8F0", true:"#FECACA" }} thumbColor={form.is_urgent ? "#EF4444" : "#94A3B8"} />
            </View>
          </View>
        </View>

        {/* ── LOCATION ── */}
        <View>
          <View style={{ backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:14, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:14 }}>📍 Location</Text>
            <Field label="Region" required error={errors.region}>
              <SelectPill selected={form.region_name} onPress={() => setRegPicker(true)} placeholder="Select your region" hasError={!!errors.region} />
            </Field>
            <Field label="Full Address" required error={errors.address}>
              <TextInput value={form.address} onChangeText={v => set("address", v)}
                placeholder="Street name, building number, apartment…" multiline numberOfLines={2}
                style={[errors.address ? errInput : baseInput, { height:70, paddingTop:12, textAlignVertical:"top" }]} />
            </Field>
          </View>
        </View>

        {/* ── SCHEDULE ── */}
        <View>
          <View style={{ backgroundColor:"#fff", borderRadius:20, padding:16, marginBottom:14, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:14 }}>📅 Schedule</Text>

            <View style={{ flexDirection:"row", gap:12 }}>
              {/* Date picker trigger */}
              <View style={{ flex:1 }}>
                <Field label="Preferred Date" required error={errors.preferred_date}>
                  <TouchableOpacity onPress={() => setCalPicker(true)}
                    style={[errors.preferred_date ? errInput : baseInput, { flexDirection:"row", alignItems:"center", gap:10 }]}>
                    <Calendar size={17} color={form.preferred_date ? "#1E3A8A" : "#94A3B8"} />
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color: form.preferred_date ? "#0F172A" : "#94A3B8", flex:1 }} numberOfLines={1}>
                      {form.preferred_date ? displayDate(form.preferred_date) : "Pick date"}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>

              {/* Time picker trigger */}
              <View style={{ flex:1 }}>
                <Field label="Preferred Time" required error={errors.preferred_time}>
                  <TouchableOpacity onPress={() => setTimePicker(true)}
                    style={[errors.preferred_time ? errInput : baseInput, { flexDirection:"row", alignItems:"center", gap:10 }]}>
                    <Clock size={17} color={form.preferred_time ? "#1E3A8A" : "#94A3B8"} />
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color: form.preferred_time ? "#0F172A" : "#94A3B8" }}>
                      {form.preferred_time ? displayTime(form.preferred_time) : "Pick time"}
                    </Text>
                  </TouchableOpacity>
                </Field>
              </View>
            </View>

            <Field label="Estimated Price (EGP)">
              <TextInput value={form.estimated_price} onChangeText={v => set("estimated_price", v)}
                placeholder="Optional — leave blank if unsure" keyboardType="decimal-pad" style={baseInput} />
            </Field>
          </View>
        </View>

        {/* ── SUMMARY ── */}
        {(form.category_name || form.region_name || form.title) && (
          <View>
            <View style={{ backgroundColor:"#EFF6FF", borderRadius:18, padding:16, marginBottom:14, borderWidth:1, borderColor:"#BFDBFE" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#1D4ED8", marginBottom:10, letterSpacing:0.5 }}>📋 BOOKING SUMMARY</Text>
              {form.category_name  && <SRow label="Service"  value={form.category_name} />}
              {form.title          && <SRow label="Issue"    value={form.title} />}
              {form.region_name    && <SRow label="Region"   value={form.region_name} />}
              {form.preferred_date && <SRow label="Date"     value={displayDate(form.preferred_date)} />}
              {form.preferred_time && <SRow label="Time"     value={displayTime(form.preferred_time)} />}
              {form.is_urgent      && <SRow label="Urgency"  value="🚨 Urgent" />}
            </View>
          </View>
        )}

        {/* ── SUBMIT ── */}
        <View>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.88}
            style={{ borderRadius:18, overflow:"hidden", opacity: submitting ? 0.75 : 1 }}>
            <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:0}}
              style={{ paddingVertical:18, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:10 }}>
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <><CheckCircle size={18} color="#06B6D4" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Submit Booking</Text></>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Pickers ── Render at root level outside ScrollView */}
      <CategoryPickerModal 
        visible={catPicker} 
        items={categories} 
        onSelect={(item) => { 
          set("category_id", item.id); 
          set("category_name", item.name); 
        }}
        onClose={() => setCatPicker(false)} 
      />
      
      <RegionPickerModal 
        visible={regPicker} 
        items={regions} 
        onSelect={(item) => { 
          set("region_id", item.id); 
          set("region_name", item.name); 
        }}
        onClose={() => setRegPicker(false)} 
      />
      
      <CalendarPicker 
        visible={calPicker} 
        value={form.preferred_date}
        onSelect={d => set("preferred_date", d)} 
        onClose={() => setCalPicker(false)} 
      />
      
      <TimePicker 
        visible={timePicker} 
        value={form.preferred_time}
        onSelect={t => set("preferred_time", t)} 
        onClose={() => setTimePicker(false)} 
      />
    </View>
  );
}

function SRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection:"row", justifyContent:"space-between", marginBottom:6 }}>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#3B82F6" }}>{label}</Text>
      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#1D4ED8", maxWidth:"60%", textAlign:"right" }}>{value}</Text>
    </View>
  );
}