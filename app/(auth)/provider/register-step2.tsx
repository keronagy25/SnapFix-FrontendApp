import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView }      from "moti";
import { ArrowLeft, Briefcase, ChevronDown, ChevronUp, Star } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { StepProgress }  from "@/components/shared/StepProgress";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";
import { Shadows }       from "@/theme/shadows";
import { PROFESSIONS }   from "@/types";

/* ─── Years of Experience Options ─── */
const EXPERIENCE_OPTIONS = [
  { label: "Less than 1 year", value: 0  },
  { label: "1 – 2 years",      value: 1  },
  { label: "3 – 5 years",      value: 3  },
  { label: "6 – 10 years",     value: 6  },
  { label: "10+ years",        value: 10 },
];

/* ── Profession Picker ── */
const ProfessionPicker: React.FC<{
  selected: string;
  onSelect: (id: string) => void;
  error?:   string;
}> = ({ selected, onSelect, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = PROFESSIONS.find((p) => p.id === selected);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontFamily:   Typography.fonts.medium,
          fontSize:     Typography.sizes.sm,
          color:        error ? Colors.error : Colors.text.secondary,
          marginBottom: 6,
        }}
      >
        Profession <Text style={{ color: Colors.error }}>*</Text>
      </Text>

      {/* Trigger */}
      <TouchableOpacity
        onPress={() => setIsOpen((o) => !o)}
        activeOpacity={0.85}
        style={{
          flexDirection:   "row",
          alignItems:      "center",
          justifyContent:  "space-between",
          borderRadius:    16,
          borderWidth:     1.5,
          borderColor:     error
            ? Colors.error
            : isOpen
            ? Colors.accent.DEFAULT
            : Colors.border,
          backgroundColor: Colors.surface,
          paddingHorizontal: 16,
          height:          52,
          ...Shadows.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Briefcase size={18} color={Colors.text.secondary} />
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.base,
              color:      selectedItem
                ? Colors.text.primary
                : Colors.text.muted,
            }}
          >
            {selectedItem
              ? `${selectedItem.emoji}  ${selectedItem.label}`
              : "Select your profession"}
          </Text>
        </View>
        {isOpen
          ? <ChevronUp   size={18} color={Colors.text.secondary} />
          : <ChevronDown size={18} color={Colors.text.secondary} />}
      </TouchableOpacity>

      {/* Dropdown */}
      {isOpen && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={{
            backgroundColor: Colors.surface,
            borderRadius:    16,
            borderWidth:     1,
            borderColor:     Colors.border,
            marginTop:       8,
            overflow:        "hidden",
            ...Shadows.md,
          }}
        >
          {PROFESSIONS.map((p, i) => {
            const isSelected = p.id === selected;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  onSelect(p.id);
                  setIsOpen(false);
                }}
                style={{
                  flexDirection:   "row",
                  alignItems:      "center",
                  gap:             12,
                  paddingVertical:   12,
                  paddingHorizontal: 16,
                  backgroundColor: isSelected
                    ? `${Colors.accent.DEFAULT}15`
                    : "transparent",
                  borderBottomWidth: i < PROFESSIONS.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.border,
                }}
              >
                <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
                <Text
                  style={{
                    flex:       1,
                    fontFamily: isSelected
                      ? Typography.fonts.semibold
                      : Typography.fonts.regular,
                    fontSize:   Typography.sizes.base,
                    color:      isSelected
                      ? Colors.accent.DEFAULT
                      : Colors.text.primary,
                  }}
                >
                  {p.label}
                </Text>
                {isSelected && (
                  <View
                    style={{
                      width:           20,
                      height:          20,
                      borderRadius:    10,
                      backgroundColor: Colors.accent.DEFAULT,
                      alignItems:      "center",
                      justifyContent:  "center",
                    }}
                  >
                    <Text
                      style={{
                        color:      Colors.text.inverse,
                        fontSize:   12,
                        fontFamily: Typography.fonts.bold,
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </MotiView>
      )}

      {/* Error */}
      {error && (
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.xs,
            color:      Colors.error,
            marginTop:  4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

/* ── Experience Selector ── */
const ExperienceSelector: React.FC<{
  selected: number | null;
  onSelect: (value: number) => void;
  error?:   string;
}> = ({ selected, onSelect, error }) => (
  <View style={{ marginBottom: 16 }}>
    <Text
      style={{
        fontFamily:   Typography.fonts.medium,
        fontSize:     Typography.sizes.sm,
        color:        error ? Colors.error : Colors.text.secondary,
        marginBottom: 6,
      }}
    >
      Years of Experience <Text style={{ color: Colors.error }}>*</Text>
    </Text>

    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {EXPERIENCE_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={{
              paddingHorizontal: 14,
              paddingVertical:   10,
              borderRadius:      12,
              borderWidth:       1.5,
              borderColor:       isSelected
                ? Colors.accent.DEFAULT
                : Colors.border,
              backgroundColor:   isSelected
                ? `${Colors.accent.DEFAULT}15`
                : Colors.surface,
            }}
          >
            <Text
              style={{
                fontFamily: isSelected
                  ? Typography.fonts.semibold
                  : Typography.fonts.regular,
                fontSize:   Typography.sizes.sm,
                color:      isSelected
                  ? Colors.accent.DEFAULT
                  : Colors.text.secondary,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    {error && (
      <Text
        style={{
          fontFamily: Typography.fonts.regular,
          fontSize:   Typography.sizes.xs,
          color:      Colors.error,
          marginTop:  4,
        }}
      >
        {error}
      </Text>
    )}
  </View>
);

/* ══════════════════════════════════════════════════════════════════ */

export default function ProviderRegisterStep2() {
  const params = useLocalSearchParams<{
    fullName: string;
    email:    string;
    phone:    string;
  }>();

  const [profession,      setProfession]      = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [bio,             setBio]             = useState("");
  const [errors, setErrors] = useState<{
    profession?:      string;
    yearsExperience?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!profession)
      newErrors.profession = "Please select your profession";
    if (yearsExperience === null)
      newErrors.yearsExperience = "Please select your experience level";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: "/(auth)/provider/register-step3",
      params:   {
        ...params,
        profession,
        yearsExperience: String(yearsExperience),
        bio,
      },
    });
  };

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
          current={2}
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
            STEP 2 OF 3
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
          Professional{"\n"}
          <Text style={{ color: Colors.accent.DEFAULT }}>Details</Text>
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
          Tell us about your skills and expertise{"\n"}
          so customers can find you easily.
        </Text>
      </MotiView>

      {/* ── Form ── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        {/* Profession Picker */}
        <ProfessionPicker
          selected={profession}
          onSelect={(id) => {
            setProfession(id);
            setErrors((e) => ({ ...e, profession: undefined }));
          }}
          error={errors.profession}
        />

        {/* Experience */}
        <ExperienceSelector
          selected={yearsExperience}
          onSelect={(v) => {
            setYearsExperience(v);
            setErrors((e) => ({ ...e, yearsExperience: undefined }));
          }}
          error={errors.yearsExperience}
        />

        {/* Bio */}
        <Input
          label="Short Bio (Optional)"
          placeholder="Describe your skills, specialties, and experience..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ height: 100, paddingTop: 12 }}
          hint="This appears on your public profile"
          leftIcon={<Star size={18} color={Colors.text.secondary} />}
        />
      </MotiView>

      {/* ── Tip Card ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{
          flexDirection:   "row",
          alignItems:      "flex-start",
          gap:             12,
          backgroundColor: `${Colors.warning}15`,
          borderRadius:    16,
          padding:         16,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     `${Colors.warning}30`,
        }}
      >
        <Text style={{ fontSize: 20 }}>💡</Text>
        <Text
          style={{
            flex:       1,
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.sm,
            color:      Colors.text.secondary,
            lineHeight: 20,
          }}
        >
          Providers with{" "}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.warning,
            }}
          >
            complete profiles
          </Text>{" "}
          get up to 3x more job requests than those with incomplete ones.
        </Text>
      </MotiView>

      {/* ── Next Button ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: "timing", duration: 500 }}
        style={{ marginBottom: 32 }}
      >
        <Button
          label="Continue"
          variant="secondary"
          size="lg"
          onPress={handleNext}
          rightIcon={
            <Text style={{ color: "#fff", fontSize: 18 }}>→</Text>
          }
        />
      </MotiView>

    </ScreenWrapper>
  );
}