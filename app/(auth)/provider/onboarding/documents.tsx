import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Platform, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import { uploadDocuments, submitOnboarding } from "@/services/authService";

interface DocumentState {
  nid_front: { uri: string; name: string; type: string } | null;
  nid_back: { uri: string; name: string; type: string } | null;
  police_clearance_certificate: { uri: string; name: string; type: string } | null;
  professional_certificate: { uri: string; name: string; type: string } | null;
  profile_photo: { uri: string; name: string; type: string } | null;
}

export default function ProviderOnboardingDocumentsScreen() {
  const onboardingToken = useAuthStore((s) => s.onboardingToken);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<DocumentState>({
    nid_front: null,
    nid_back: null,
    police_clearance_certificate: null,
    professional_certificate: null,
    profile_photo: null,
  });
  const [uploading, setUploading] = useState<keyof DocumentState | null>(null);

  React.useEffect(() => {
    if (!onboardingToken) {
      router.replace("/(auth)/provider/register" as any);
    }
  }, [onboardingToken]);

  if (!onboardingToken) {
    return null;
  }

  const pickDocument = async (type: keyof DocumentState, isPhoto: boolean = false) => {
    try {
      let result;
      
      if (isPhoto) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission needed", "Please grant gallery access to upload photos");
          return;
        }
        const imageResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: false,
        });
        if (!imageResult.canceled && imageResult.assets[0]) {
          const asset = imageResult.assets[0];
          result = {
            uri: asset.uri,
            name: asset.uri.split("/").pop() || `${type}.jpg`,
            type: "image/jpeg",
          };
        }
      } else {
        // For documents like PDF
        const docResult = await DocumentPicker.getDocumentAsync({
          type: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
          copyToCacheDirectory: true,
        });
        if (!docResult.canceled && docResult.assets && docResult.assets[0]) {
          const asset = docResult.assets[0];
          result = {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/pdf",
          };
        }
      }

      if (result) {
        setDocuments((prev) => ({ ...prev, [type]: result }));
        await uploadFile(type, result);
      }
    } catch (error) {
      console.error("Pick error:", error);
      Alert.alert("Error", "Failed to select file");
    }
  };

  const uploadFile = async (type: keyof DocumentState, file: { uri: string; name: string; type: string }) => {
    setUploading(type);
    try {
      const formData = new FormData();
      
      // Create the file object for React Native
      const fileObj: any = {
        uri: file.uri,
        type: file.type,
        name: file.name,
      };
      
      // Use the exact field names expected by the API
      formData.append(type, fileObj);

      await uploadDocuments(onboardingToken, formData);
      Alert.alert("Success", `${getDocumentLabel(type)} uploaded successfully`);
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Upload Failed", err?.data?.detail || "Please try again");
      setDocuments((prev) => ({ ...prev, [type]: null }));
    } finally {
      setUploading(null);
    }
  };

  const getDocumentLabel = (type: keyof DocumentState): string => {
    switch (type) {
      case "nid_front": return "NID Front";
      case "nid_back": return "NID Back";
      case "police_clearance_certificate": return "Police Clearance Certificate";
      case "professional_certificate": return "Professional Certificate";
      case "profile_photo": return "Profile Photo";
      default: return "Document";
    }
  };

  const isAllRequiredUploaded = (): boolean => {
    return !!(
      documents.nid_front && 
      documents.nid_back && 
      documents.police_clearance_certificate
    );
  };

  const handleSubmit = async () => {
    if (!isAllRequiredUploaded()) {
      Alert.alert("Missing Documents", "Please upload NID Front, NID Back, and Police Clearance Certificate before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOnboarding(onboardingToken);
      Alert.alert("Application Submitted", result.detail, [
        { text: "OK", onPress: () => router.replace("/(auth)/provider/pending" as any) }
      ]);
    } catch (err: any) {
      const missingFields = err?.data?.missing_fields;
      if (missingFields && missingFields.length > 0) {
        Alert.alert("Missing Information", `Please complete: ${missingFields.join(", ")}`);
      } else {
        Alert.alert("Submission Failed", err?.data?.detail || "Please try again");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentRow = (type: keyof DocumentState, label: string, required: boolean) => {
    const doc = documents[type];
    const isUploading = uploading === type;

    return (
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B" }}>
            {label} {required && <Text style={{ color: "#EF4444" }}>*</Text>}
          </Text>
          {doc && <CheckCircle size={16} color="#10B981" />}
        </View>

        <TouchableOpacity
          onPress={() => pickDocument(type, type === "profile_photo")}
          disabled={isUploading}
          style={{
            backgroundColor: doc ? "#F0FDF4" : "#fff",
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: doc ? "#A7F3D0" : "#E2E8F0",
            borderStyle: doc ? "solid" : "dashed",
            padding: 16,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 100,
          }}
        >
          {isUploading ? (
            <ActivityIndicator size="large" color="#06B6D4" />
          ) : doc ? (
            <>
              <CheckCircle size={32} color="#10B981" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#065F46", marginTop: 8 }}>Uploaded</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#64748B", marginTop: 4 }} numberOfLines={1}>{doc.name}</Text>
            </>
          ) : (
            <>
              <Upload size={32} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#64748B", marginTop: 8 }}>Tap to upload</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginTop: 4 }}>JPG, PNG, or PDF (max 10MB)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 24, color: "#fff" }}>Upload Documents</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>We need these to verify your identity</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: "#FEF3C7", borderRadius: 12, padding: 12, marginBottom: 20, flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "#FDE68A" }}>
          <AlertCircle size={18} color="#D97706" />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#92400E", flex: 1 }}>
            All documents will be verified by AI and our team. Make sure they're clear and readable.
          </Text>
        </View>

        {renderDocumentRow("nid_front", "National ID (Front)", true)}
        {renderDocumentRow("nid_back", "National ID (Back)", true)}
        {renderDocumentRow("police_clearance_certificate", "Police Clearance Certificate", true)}
        {renderDocumentRow("professional_certificate", "Professional Certificate (Optional)", false)}
        {renderDocumentRow("profile_photo", "Profile Photo (Optional)", false)}

        <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 24 }} />

        <TouchableOpacity onPress={handleSubmit} disabled={submitting || !isAllRequiredUploaded()} activeOpacity={0.85}
          style={{ borderRadius: 18, overflow: "hidden", opacity: (submitting || !isAllRequiredUploaded()) ? 0.5 : 1 }}>
          <LinearGradient colors={["#06B6D4", "#0284C7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 54, alignItems: "center", justifyContent: "center" }}>
            {submitting ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Submit Application</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#06B6D4" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#06B6D4" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#06B6D4" }} />
          <View style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" }} />
        </View>
      </ScrollView>
    </View>
  );
}