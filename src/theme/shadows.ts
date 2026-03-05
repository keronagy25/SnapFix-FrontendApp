import { Platform } from "react-native";

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: "#1E3A8A",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: "#1E3A8A",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: "#1E3A8A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: "#1E3A8A",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.20,
      shadowRadius: 32,
    },
    android: { elevation: 12 },
  }),
};