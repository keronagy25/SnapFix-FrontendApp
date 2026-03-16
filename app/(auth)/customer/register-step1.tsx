import React, { useState } from "react";
import {
  View, Text, TouchableOpacity,
  TextInput, StatusBar, Platform, ScrollView,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { User, Mail, Phone, ArrowLeft, AlertCircle } from "lucide-react-native";
import { Typography } from "@/theme/typography";

const StepProgress = ({ current, total }: { current: number; total: number }) => (
  <View style={{ flexDirection:"row", gap:8, marginBottom:28 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{ flex: i < current ? 1.5 : 1, height:4, borderRadius:2, backgroundColor: i < current ? "#1E3A8A" : "#E2E8F0" }} />
    ))}
  </View>
);

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
      <AlertCircle size={12} color="#EF4444" />
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{msg}</Text>
    </View>
  );
}

const FIELDS = [
  { key:"first_name", label:"First Name",    placeholder:"e.g. Ahmed",          icon: User,  kb:"default",       cap:"words"        },
  { key:"last_name",  label:"Last Name",     placeholder:"e.g. Mohamed",        icon: User,  kb:"default",       cap:"words"        },
  { key:"email",      label:"Email Address", placeholder:"ahmed@example.com",    icon: Mail,  kb:"email-address", cap:"none"         },
  { key:"phone",      label:"Phone Number",  placeholder:"+20 100 000 0000",     icon: Phone, kb:"phone-pad",     cap:"none"         },
];

export default function CustomerRegisterStep1() {
  const [form,   setForm]   = useState({ first_name:"", last_name:"", email:"", phone:"" });
  const [errors, setErrors] = useState<Record<string,string>>({});

  const update = (field: string) => (val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined as any }));
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (form.first_name.trim().length < 2)  e.first_name = "At least 2 characters";
    if (form.last_name.trim().length  < 2)  e.last_name  = "At least 2 characters";
    if (!/\S+@\S+\.\S+/.test(form.email))   e.email      = "Enter a valid email address";
    if (!/^[+]?[\d\s\-()]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({ pathname:"/(auth)/customer/register-step2" as any, params: { ...form } });
  };

  const inputWrap = (field: string): any => ({
    flexDirection:"row", alignItems:"center", backgroundColor:"#fff",
    borderRadius:14, borderWidth:1.5, paddingHorizontal:14, height:52,
    borderColor: errors[field] ? "#FCA5A5" : "#E2E8F0",
  });

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:32, paddingHorizontal:24, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,0.05)" }} />
        <TouchableOpacity onPress={() => router.back()}
          style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View >
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:26, color:"#fff", marginBottom:4 }}>Personal Information</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"rgba(255,255,255,0.6)" }}>Step 1 of 2 — Tell us about yourself</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding:24, paddingBottom:60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StepProgress current={1} total={2} />

        {FIELDS.map((field, i) => (
          <View key={field.key} style={{ marginBottom:16 }}>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>
              {field.label} <Text style={{ color:"#EF4444" }}>*</Text>
            </Text>
            <View style={inputWrap(field.key)}>
              <field.icon size={18} color="#94A3B8" style={{ marginRight:10 }} />
              <TextInput
                value={(form as any)[field.key]}
                onChangeText={update(field.key)}
                placeholder={field.placeholder} placeholderTextColor="#CBD5E1"
                keyboardType={field.kb as any} autoCapitalize={field.cap as any}
                style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A" }}
              />
            </View>
            <FieldError msg={errors[field.key]} />
          </View>
        ))}

        {/* Privacy note */}
        <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, backgroundColor:"#EFF6FF", borderRadius:14, padding:14, marginBottom:28, borderWidth:1, borderColor:"#BFDBFE" }}>
          <Text style={{ fontSize:18 }}>🔒</Text>
          <Text style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:13, color:"#1E40AF", lineHeight:20 }}>
            Your information is encrypted and <Text style={{ fontFamily: Typography.fonts.semibold }}>never shared</Text> with third parties.
          </Text>
        </View>

        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}
          style={{ borderRadius:18, overflow:"hidden" }}>
          <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:0}}
            style={{ height:54, alignItems:"center", justifyContent:"center", flexDirection:"row", gap:8 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Continue</Text>
            <Text style={{ color:"#fff", fontSize:18 }}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}