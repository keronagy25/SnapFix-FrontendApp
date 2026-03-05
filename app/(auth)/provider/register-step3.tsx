import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MotiView }       from "moti";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  Camera,
  X,
} from "lucide-react-native";
import { ScreenWrapper }  from "@/components/shared/ScreenWrapper";
import { StepProgress }   from "@/components/shared/StepProgress";
import { Button }         from "@/components/ui/Button";
import { useAuthStore }   from "@/store/authStore";
import { Colors }         from "@/theme/colors";
import { Typography }     from "@/theme/typography";
import { Shadows }        from "@/theme/shadows";
import { PROFESSIONS }    from "@/types";

/* ── Document Upload Card ── */
interface DocUploadCardProps {
  title:       string;
  description: string;
  emoji:       string;
  imageUri:    string | null;
  isRequired:  boolean;
  onUpload:    () => void;
  onRemove:    () => void;
  isLoading?:  boolean;
  error?:      string;
}

const DocUploadCard: React.FC<DocUploadCardProps> = ({
  title,
  description,
  emoji,
  imageUri,
  isRequired,
  onUpload,
  onRemove,
  isLoading,
  error,
}) => {
  const hasImage = !!imageUri;

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius:    20,
          borderWidth:     1.5,
          borderColor:     error
            ? Colors.error
            : hasImage
            ? Colors.success
            : Colors.border,
          overflow:        "hidden",
          ...Shadows.sm,
        }}
      >
        {/* Card Header */}
        <View
          style={{
            flexDirection:   "row",
            alignItems:      "center",
            gap:             12,
            padding:         16,
            borderBottomWidth: hasImage ? 1 : 0,
            borderBottomColor: Colors.border,
          }}
        >
          <View
            style={{
              width:           44,
              height:          44,
              borderRadius:    14,
              backgroundColor: hasImage
                ? `${Colors.success}20`
                : `${Colors.accent.DEFAULT}15`,
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems:    "center",
                gap:           6,
              }}
            >
              <Text
                style={{
                  fontFamily: Typography.fonts.semibold,
                  fontSize:   Typography.sizes.base,
                  color:      Colors.text.primary,
                }}
              >
                {title}
              </Text>
              {isRequired && (
                <Text
                  style={{
                    fontFamily:      Typography.fonts.semibold,
                    fontSize:        Typography.sizes.xs,
                    color:           Colors.error,
                    backgroundColor: `${Colors.error}15`,
                    paddingHorizontal: 6,
                    paddingVertical:   2,
                    borderRadius:     6,
                  }}
                >
                  Required
                </Text>
              )}
            </View>
            <Text
              style={{
                fontFamily: Typography.fonts.regular,
                fontSize:   Typography.sizes.xs,
                color:      Colors.text.secondary,
                marginTop:  2,
              }}
            >
              {description}
            </Text>
          </View>

          {/* Status Icon */}
          {hasImage ? (
            <CheckCircle
              size={22}
              color={Colors.success}
              fill={Colors.success}
            />
          ) : (
            <Upload size={20} color={Colors.text.muted} />
          )}
        </View>

        {/* Preview or Upload Area */}
        {hasImage ? (
          <View>
            <Image
              source={{ uri: imageUri! }}
              style={{ width: "100%", height: 160 }}
              resizeMode="cover"
            />
            {/* Remove Button */}
            <TouchableOpacity
              onPress={onRemove}
              style={{
                position:        "absolute",
                top:             8,
                right:           8,
                width:           32,
                height:          32,
                borderRadius:    16,
                backgroundColor: "rgba(0,0,0,0.6)",
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <X size={16} color={Colors.text.inverse} />
            </TouchableOpacity>

            {/* Re-upload */}
            <TouchableOpacity
              onPress={onUpload}
              style={{
                flexDirection:   "row",
                alignItems:      "center",
                justifyContent:  "center",
                gap:             6,
                padding:         12,
                borderTopWidth:  1,
                borderTopColor:  Colors.border,
              }}
            >
              <Camera size={16} color={Colors.text.secondary} />
              <Text
                style={{
                  fontFamily: Typography.fonts.medium,
                  fontSize:   Typography.sizes.sm,
                  color:      Colors.text.secondary,
                }}
              >
                Replace Image
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onUpload}
            disabled={isLoading}
            style={{
              alignItems:      "center",
              justifyContent:  "center",
              padding:         28,
              gap:             8,
              borderStyle:     "dashed",
              borderTopWidth:  1.5,
              borderTopColor:  Colors.border,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.accent.DEFAULT} />
            ) : (
              <>
                <View
                  style={{
                    width:           52,
                    height:          52,
                    borderRadius:    16,
                    backgroundColor: `${Colors.accent.DEFAULT}15`,
                    alignItems:      "center",
                    justifyContent:  "center",
                  }}
                >
                  <Camera size={24} color={Colors.accent.DEFAULT} />
                </View>
                <Text
                  style={{
                    fontFamily: Typography.fonts.semibold,
                    fontSize:   Typography.sizes.sm,
                    color:      Colors.accent.DEFAULT,
                  }}
                >
                  Tap to Upload
                </Text>
                <Text
                  style={{
                    fontFamily: Typography.fonts.regular,
                    fontSize:   Typography.sizes.xs,
                    color:      Colors.text.muted,
                  }}
                >
                  JPG, PNG — Max 5MB
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error */}
      {error && (
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.xs,
            color:      Colors.error,
            marginTop:  4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

/* ══════════════════════════════════════════════════════════════════ */

export default function ProviderRegisterStep3() {
  const params = useLocalSearchParams<{
    fullName:        string;
    email:           string;
    phone:           string;
    profession:      string;
    yearsExperience: string;
    bio:             string;
  }>();

  const [nationalIdImage,  setNationalIdImage]  = useState<string | null>(null);
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [uploadingNid,     setUploadingNid]     = useState(false);
  const [uploadingCert,    setUploadingCert]    = useState(false);
  const [isLoading,        setIsLoading]        = useState(false);
  const [errors, setErrors] = useState<{
    nationalIdImage?:  string;
    certificateImage?: string;
  }>({});

  const setUser  = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  /* ─── Pick Image ─── */
  const pickImage = async (
    setter:     (uri: string | null) => void,
    setLoading: (v: boolean) => void,
    errorKey:   "nationalIdImage" | "certificateImage"
  ) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload documents.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
      allowsEditing: true,
      aspect:     [4, 3],
    });
    setLoading(false);

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
      setErrors((e) => ({ ...e, [errorKey]: undefined }));
    }
  };

  /* ─── Validate ─── */
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!nationalIdImage)
      newErrors.nationalIdImage = "National ID photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 2500));

    const professionLabel =
      PROFESSIONS.find((p) => p.id === params.profession)?.label ??
      params.profession;

    // Create provider profile in store
    setUser({
      id:                 Math.random().toString(36).slice(2),
      fullName:           params.fullName,
      email:              params.email,
      phone:              params.phone,
      role:               "provider",
      nationalId:         "",
      nationalIdImage:    nationalIdImage!,
      profession:         professionLabel,
      yearsExperience:    Number(params.yearsExperience),
      certificate:        certificateImage ?? undefined,
      verificationStatus: "pending",
      rating:             0,
      totalJobs:          0,
      walletBalance:      0,
      isOnline:           false,
      createdAt:          new Date().toISOString(),
    });

    setToken("mock-provider-token");
    setIsLoading(false);

    // Go to pending screen
    router.replace("/(auth)/provider/pending");
  };

  /* ─── UI ─── */
  return (
    <ScreenWrapper scrollable>

      {/* ── Back ── */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop:       16,
          width:           44,
          height:          44,
          borderRadius:    14,
          backgroundColor: Colors.surface,
          alignItems:      "center",
          justifyContent:  "center",
          borderWidth:     1,
          borderColor:     Colors.border,
        }}
      >
        <ArrowLeft size={20} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={{ paddingTop: 24 }}
      >
        <StepProgress
          current={3}
          total={3}
          color={Colors.accent.DEFAULT}
        />

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical:   4,
            borderRadius:      20,
            backgroundColor:   `${Colors.accent.DEFAULT}20`,
            alignSelf:         "flex-start",
            marginBottom:      12,
          }}
        >
          <Text
            style={{
              fontFamily:   Typography.fonts.semibold,
              fontSize:     Typography.sizes.xs,
              color:        Colors.accent.DEFAULT,
              letterSpacing: 1,
            }}
          >
            STEP 3 OF 3 — FINAL STEP
          </Text>
        </View>

        <Text
          style={{
            fontFamily:   Typography.fonts.extrabold,
            fontSize:     Typography.sizes["3xl"],
            color:        Colors.text.primary,
            marginBottom: 8,
            lineHeight:   36,
          }}
        >
          Upload{"\n"}
          <Text style={{ color: Colors.accent.DEFAULT }}>
            Documents
          </Text>
        </Text>

        <Text
          style={{
            fontFamily:   Typography.fonts.regular,
            fontSize:     Typography.sizes.base,
            color:        Colors.text.secondary,
            lineHeight:   22,
            marginBottom: 32,
          }}
        >
          We verify every provider to ensure{"\n"}
          safety and trust for our customers.
        </Text>
      </MotiView>

      {/* ── Profile Summary ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 150, type: "spring", damping: 15 }}
        style={{
          backgroundColor: Colors.surface,
          borderRadius:    20,
          padding:         16,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     Colors.border,
          ...Shadows.sm,
        }}
      >
        <Text
          style={{
            fontFamily:   Typography.fonts.semibold,
            fontSize:     Typography.sizes.sm,
            color:        Colors.text.secondary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}
        >
          YOUR PROFILE SO FAR
        </Text>
        <View
          style={{
            flexDirection:  "row",
            flexWrap:       "wrap",
            gap:            8,
          }}
        >
          {[
            { label: params.fullName,    emoji: "👤" },
            {
              label: PROFESSIONS.find(
                (p) => p.id === params.profession
              )?.label ?? params.profession,
              emoji: PROFESSIONS.find(
                (p) => p.id === params.profession
              )?.emoji ?? "🔧",
            },
            {
              label: `${params.yearsExperience}+ yrs exp`,
              emoji: "⭐",
            },
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection:   "row",
                alignItems:      "center",
                gap:             6,
                paddingHorizontal: 12,
                paddingVertical:   8,
                borderRadius:    12,
                backgroundColor: Colors.background,
                borderWidth:     1,
                borderColor:     Colors.border,
              }}
            >
              <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
              <Text
                style={{
                  fontFamily: Typography.fonts.medium,
                  fontSize:   Typography.sizes.sm,
                  color:      Colors.text.primary,
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </MotiView>

      {/* ── Document Upload Cards ── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 250, type: "timing", duration: 600 }}
      >
        {/* National ID */}
        <DocUploadCard
          title="National ID"
          description="Clear photo of the front side of your Egyptian National ID"
          emoji="🪪"
          imageUri={nationalIdImage}
          isRequired
          isLoading={uploadingNid}
          error={errors.nationalIdImage}
          onUpload={() =>
            pickImage(setNationalIdImage, setUploadingNid, "nationalIdImage")
          }
          onRemove={() => setNationalIdImage(null)}
        />

        {/* Certificate */}
        <DocUploadCard
          title="Professional Certificate"
          description="Any relevant trade license, diploma, or certificate (Optional)"
          emoji="📜"
          imageUri={certificateImage}
          isRequired={false}
          isLoading={uploadingCert}
          onUpload={() =>
            pickImage(
              setCertificateImage,
              setUploadingCert,
              "certificateImage"
            )
          }
          onRemove={() => setCertificateImage(null)}
        />
      </MotiView>

      {/* ── Security Note ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 450, type: "timing", duration: 600 }}
        style={{
          flexDirection:   "row",
          alignItems:      "flex-start",
          gap:             12,
          backgroundColor: `${Colors.primary.DEFAULT}10`,
          borderRadius:    16,
          padding:         16,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     `${Colors.primary.DEFAULT}20`,
        }}
      >
        <Text style={{ fontSize: 20 }}>🔒</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily:   Typography.fonts.semibold,
              fontSize:     Typography.sizes.sm,
              color:        Colors.text.primary,
              marginBottom: 4,
            }}
          >
            Your documents are safe
          </Text>
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.xs,
              color:      Colors.text.secondary,
              lineHeight: 18,
            }}
          >
            Documents are encrypted and used only for identity verification.
            They are never shared publicly.
          </Text>
        </View>
      </MotiView>

      {/* ── Submit Button ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 550, type: "timing", duration: 500 }}
        style={{ marginBottom: 32 }}
      >
        <Button
          label={isLoading ? "Submitting..." : "Submit for Review"}
          variant="secondary"
          size="lg"
          isLoading={isLoading}
          onPress={handleSubmit}
        />

        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.xs,
            color:      Colors.text.muted,
            textAlign:  "center",
            marginTop:  12,
          }}
        >
          By submitting, you agree to our{" "}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.primary.DEFAULT,
            }}
          >
            Provider Terms of Service
          </Text>
        </Text>
      </MotiView>

    </ScreenWrapper>
  );
}