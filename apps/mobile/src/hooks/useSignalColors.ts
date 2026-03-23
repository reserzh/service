import { useColorScheme } from "react-native";

export interface SignalColors {
  accent: string;
  accentMuted: string;
  bg: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
}

const lightColors: SignalColors = {
  accent: "#EA580C",
  accentMuted: "#FB923C",
  bg: "#FFFBF5",
  card: "#FFFFFF",
  text: "#1C1917",
  textSecondary: "#57534E",
  textMuted: "#A8A29E",
  border: "#F5F0EB",
  borderStrong: "#D6D3D1",
};

const darkColors: SignalColors = {
  accent: "#FB923C",
  accentMuted: "#EA580C",
  bg: "#1C1917",
  card: "#292524",
  text: "#FAFAF9",
  textSecondary: "#A8A29E",
  textMuted: "#78716C",
  border: "#44403C",
  borderStrong: "#57534E",
};

export function useSignalColors(): SignalColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}
