import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  Animated,
} from "react-native";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { Colors }     from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { Shadows }    from "@/theme/shadows";

interface InputProps extends TextInputProps {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  isPassword?:  boolean;
  isRequired?:  boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword  = false,
  isRequired  = false,
  ...rest
}) => {
  const [isFocused,    setIsFocused]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(borderAnim, {
      toValue: 1,
      useNativeDriver: false,
      damping: 15,
    }).start();
    rest.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(borderAnim, {
      toValue: 0,
      useNativeDriver: false,
      damping: 15,
    }).start();
    rest.onBlur?.(null as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      error ? Colors.error : Colors.border,
      error ? Colors.error : Colors.primary.DEFAULT,
    ],
  });

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      {label && (
        <Text
          style={{
            fontFamily:  Typography.fonts.medium,
            fontSize:    Typography.sizes.sm,
            color:       error ? Colors.error : Colors.text.secondary,
            marginBottom: 6,
          }}
        >
          {label}
          {isRequired && (
            <Text style={{ color: Colors.error }}> *</Text>
          )}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={{
          flexDirection:   "row",
          alignItems:      "center",
          borderRadius:    16,
          borderWidth:     1.5,
          borderColor,
          backgroundColor: Colors.surface,
          paddingHorizontal: 16,
          height:          52,
          ...Shadows.sm,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: 10 }}>{leftIcon}</View>
        )}

        <TextInput
          style={{
            flex:       1,
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.base,
            color:      Colors.text.primary,
            paddingVertical: 0,
          }}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            style={{ padding: 4 }}
          >
            {showPassword
              ? <Eye     size={18} color={Colors.text.secondary} />
              : <EyeOff  size={18} color={Colors.text.secondary} />}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={{ marginLeft: 10 }}>{rightIcon}</View>
        )}
      </Animated.View>

      {/* Error / Hint */}
      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems:    "center",
            marginTop:     4,
            gap:           4,
          }}
        >
          <AlertCircle size={12} color={Colors.error} />
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.xs,
              color:      Colors.error,
            }}
          >
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.xs,
            color:      Colors.text.muted,
            marginTop:  4,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
};