import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StatusBar, Platform, ActivityIndicator, Alert, Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Calendar, MapPin, Building2, Clock, Briefcase, AlertCircle, CheckCircle, ChevronDown } from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import { updatePersonalInfo, getOnboardingStatus, type PersonalInfoPayload } from "@/services/authService";
import { getCategories, getRegions, type Category, type Region } from "@/services/coreService";
import DateTimePicker from "@react-native-community/datetimepicker";

interface FormData {
  date_of_birth: string;
  address: string;
  region_id: number;
  category_id: number;
  hourly_rate: string;
  years_of_experience: string;
  bio: string;
}

interface PickerItem {
  id: number;
  name: string;
}

export default function ProviderOnboardingPersonalScreen() {
  const onboardingToken = useAuthStore((s) => s.onboardingToken);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Data from APIs
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Picker modals
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [form, setForm] = useState<FormData>({
    date_of_birth: "",
    address: "",
    region_id: 0,
    category_id: 0,
    hourly_rate: "",
    years_of_experience: "",
    bio: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Get selected region and category names for display
  const selectedRegion = regions.find(r => r.id === form.region_id);
  const selectedCategory = categories.find(c => c.id === form.category_id);

  // Load data on mount
  useEffect(() => {
    if (!onboardingToken) {
      router.replace("/(auth)/provider/register" as any);
      return;
    }
    loadInitialData();
    loadStatus();
  }, []);

  const loadInitialData = async () => {
    // Load regions
    setLoadingRegions(true);
    try {
      const regionsData = await getRegions(onboardingToken ?? undefined);
      setRegions(regionsData);
    } catch (error) {
      console.error("Failed to load regions:", error);
      Alert.alert("Error", "Failed to load regions. Please try again.");
    } finally {
      setLoadingRegions(false);
    }

    // Load categories
    setLoadingCategories(true);
    try {
      const categoriesData = await getCategories(onboardingToken ?? undefined);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load categories:", error);
      Alert.alert("Error", "Failed to load service categories. Please try again.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadStatus = async () => {
    if (!onboardingToken) return;
    setLoading(true);
    try {
      const status = await getOnboardingStatus(onboardingToken);
      // If already submitted, redirect to pending
      if (status.status === "pending" || status.status === "under_review") {
        router.replace("/(auth)/provider/pending" as any);
      }
      // TODO: Load existing data from status if available
    } catch (error) {
      console.error("Failed to load status:", error);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.region_id || form.region_id === 0) e.region_id = "Please select a region";
    if (!form.category_id || form.category_id === 0) e.category_id = "Please select a service category";
    if (!form.hourly_rate) e.hourly_rate = "Hourly rate is required";
    else if (isNaN(Number(form.hourly_rate)) || Number(form.hourly_rate) <= 0) e.hourly_rate = "Enter a valid hourly rate";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    if (!onboardingToken) return;

    setSaving(true);
    try {
      const payload: PersonalInfoPayload = {
        date_of_birth: form.date_of_birth,
        address: form.address.trim(),
        region: form.region_id,
        category: form.category_id,
        hourly_rate: form.hourly_rate,
        years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience, 10) : 0,
        bio: form.bio.trim() || undefined,
      };

      await updatePersonalInfo(onboardingToken, payload);
      // Navigate to document upload
      router.push("/(auth)/provider/onboarding/documents" as any);
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || "Failed to save information";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setForm({ ...form, date_of_birth: `${year}-${month}-${day}` });
      setErrors({ ...errors, date_of_birth: undefined });
    }
  };

  // Picker Modal Component
  const PickerModal = ({ 
    visible, 
    onClose, 
    items, 
    selectedId, 
    onSelect, 
    title,
    loading 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    items: PickerItem[]; 
    selectedId: number; 
    onSelect: (id: number) => void; 
    title: string;
    loading: boolean;
  }) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A" }}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 16, color: "#06B6D4" }}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {loading ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <ActivityIndicator size="large" color="#06B6D4" />
                </View>
              ) : items.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#64748B" }}>No items available</Text>
                </View>
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F1F5F9",
                      backgroundColor: selectedId === item.id ? "#F0FDF4" : "#fff",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ 
                      fontFamily: Typography.fonts.regular, 
                      fontSize: 16, 
                      color: selectedId === item.id ? "#065F46" : "#0F172A" 
                    }}>
                      {item.name}
                    </Text>
                    {selectedId === item.id && <CheckCircle size={20} color="#10B981" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 24, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 24, color: "#fff" }}>Professional Info</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Tell us about yourself and your services</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Date of Birth */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>
            Date of Birth <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: errors.date_of_birth ? "#FCA5A5" : "#E2E8F0" }}>
            <Calendar size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: form.date_of_birth ? "#0F172A" : "#CBD5E1" }}>
              {form.date_of_birth || "Select date (must be 18+)"}
            </Text>
          </TouchableOpacity>
          {errors.date_of_birth && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 5 }}>{errors.date_of_birth}</Text>}
        </View>

        {/* Address */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>
            Address <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: errors.address ? "#FCA5A5" : "#E2E8F0" }}>
            <MapPin size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              value={form.address}
              onChangeText={(t) => { setForm({ ...form, address: t }); setErrors({ ...errors, address: undefined }); }}
              placeholder="Full address"
              placeholderTextColor="#CBD5E1"
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A" }}
            />
          </View>
          {errors.address && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 5 }}>{errors.address}</Text>}
        </View>

        {/* Region - Dropdown */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>
            Region <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowRegionPicker(true)}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: errors.region_id ? "#FCA5A5" : "#E2E8F0" }}>
            <Building2 size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: selectedRegion ? "#0F172A" : "#CBD5E1" }}>
              {selectedRegion?.name || "Select your region"}
            </Text>
            <ChevronDown size={18} color="#94A3B8" />
          </TouchableOpacity>
          {errors.region_id && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 5 }}>Please select a region</Text>}
        </View>

        {/* Category - Dropdown */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>
            Service Category <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: errors.category_id ? "#FCA5A5" : "#E2E8F0" }}>
            <Briefcase size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: selectedCategory ? "#0F172A" : "#CBD5E1" }}>
              {selectedCategory?.name || "Select your service category"}
            </Text>
            <ChevronDown size={18} color="#94A3B8" />
          </TouchableOpacity>
          {errors.category_id && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 5 }}>Please select a category</Text>}
        </View>

        {/* Hourly Rate */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>
            Hourly Rate (EGP) <Text style={{ color: "#EF4444" }}>*</Text>
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: errors.hourly_rate ? "#FCA5A5" : "#E2E8F0" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#64748B", marginRight: 8 }}>EGP</Text>
            <TextInput
              value={form.hourly_rate}
              onChangeText={(t) => { setForm({ ...form, hourly_rate: t }); setErrors({ ...errors, hourly_rate: undefined }); }}
              placeholder="150.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="decimal-pad"
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A" }}
            />
          </View>
          {errors.hourly_rate && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 5 }}>{errors.hourly_rate}</Text>}
        </View>

        {/* Years of Experience */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>Years of Experience</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52, borderColor: "#E2E8F0" }}>
            <Clock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              value={form.years_of_experience}
              onChangeText={(t) => setForm({ ...form, years_of_experience: t })}
              placeholder="Years (e.g., 5)"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A" }}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>Bio / Description</Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, borderColor: "#E2E8F0" }}>
            <TextInput
              value={form.bio}
              onChangeText={(t) => setForm({ ...form, bio: t })}
              placeholder="Tell clients about your experience and skills..."
              placeholderTextColor="#CBD5E1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A", minHeight: 100 }}
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity onPress={handleSaveAndContinue} disabled={saving} activeOpacity={0.85}
          style={{ borderRadius: 18, overflow: "hidden", opacity: saving ? 0.75 : 1 }}>
          <LinearGradient colors={["#06B6D4", "#0284C7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 54, alignItems: "center", justifyContent: "center" }}>
            {saving ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Continue to Documents →</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#06B6D4" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(2000, 0, 1)}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
        />
      )}

      {/* Region Picker Modal */}
      <PickerModal
        visible={showRegionPicker}
        onClose={() => setShowRegionPicker(false)}
        items={regions}
        selectedId={form.region_id}
        onSelect={(id) => {
          setForm({ ...form, region_id: id });
          setErrors({ ...errors, region_id: undefined });
        }}
        title="Select Region"
        loading={loadingRegions}
      />

      {/* Category Picker Modal */}
      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        items={categories}
        selectedId={form.category_id}
        onSelect={(id) => {
          setForm({ ...form, category_id: id });
          setErrors({ ...errors, category_id: undefined });
        }}
        title="Select Service Category"
        loading={loadingCategories}
      />
    </View>
  );
}