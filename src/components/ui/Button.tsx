import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  label:       string;
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  isLoading?:  boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  fullWidth?:  boolean;
}

const variantStyles: Record<ButtonVariant, { container: object; text: object }> = {
  primary: {
    container: { backgroundColor: Colors.primary.DEFAULT },
    text:      { color: Colors.text.inverse },
  },
  secondary: {
    container: { backgroundColor: Colors.accent.DEFAULT },
    text:      { color: Colors.text.inverse },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: Colors.primary.DEFAULT,
    },
    text: { color: Colors.primary.DEFAULT },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text:      { color: Colors.primary.DEFAULT },
  },
  danger: {
    container: { backgroundColor: Colors.error },
    text:      { color: Colors.text.inverse },
  },
};

const sizeStyles: Record<ButtonSize, { container: object; text: object; height: number }> = {
  sm: {
    container: { paddingHorizontal: 16, paddingVertical: 8 },
    text:      { fontSize: Typography.sizes.sm },
    height:    36,
  },
  md: {
    container: { paddingHorizontal: 24, paddingVertical: 12 },
    text:      { fontSize: Typography.sizes.base },
    height:    48,
  },
  lg: {
    container: { paddingHorizontal: 32, paddingVertical: 16 },
    text:      { fontSize: Typography.sizes.md },
    height:    56,
  },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant   = "primary",
  size      = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  disabled,
  ...rest
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || isLoading;

  return (
    <MotiView
      animate={{ scale: isDisabled ? 0.98 : 1 }}
      transition={{ type: "spring", damping: 15 }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[
          {
            flexDirection:  "row",
            alignItems:     "center",
            justifyContent: "center",
            borderRadius:   24,
            height:         sStyle.height,
            gap:            8,
            ...(fullWidth && { width: "100%" }),
            ...vStyle.container,
            ...sStyle.container,
            ...(isDisabled && { opacity: 0.6 }),
          },
        ]}
        {...rest}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === "outline" || variant === "ghost"
              ? Colors.primary.DEFAULT
              : Colors.text.inverse}
            size="small"
          />
        ) : (
          <>
            {leftIcon && <View>{leftIcon}</View>}
            <Text
              style={[
                {
                  fontFamily: Typography.fonts.semibold,
                  letterSpacing: 0.3,
                  ...vStyle.text,
                  ...sStyle.text,
                },
              ]}
            >
              {label}
            </Text>
            {rightIcon && <View>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    </MotiView>
  );
};