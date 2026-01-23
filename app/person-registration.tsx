import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";

/** Readable on-color (black/white) */
const onColor = (bg: string) => {
  const hex = (bg || "").replace("#", "");
  if (hex.length !== 6) return "#000000";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L > 0.45 ? "#000000" : "#FFFFFF";
};

const PersonRegistrationScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);

  useEffect(() => {
    speak?.("Person Registration Screen. Register new people for recognition.", true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          level={1}
        >
          Person Registration
        </AccessibleText>
      </View>

      <View style={styles.centerArea}>
        <AccessibleButton
          title="Register New Person"
          onPress={() => {
            hapticFeedback?.("medium");
            speak?.("Opening camera for person registration", true);
            router.push("/person-capture");
          }}
          accessibilityLabel="Register New Person"
          accessibilityHint="Starts capturing five photos to register a person"
          style={[
            styles.registerPersonButton,
            { backgroundColor: colors.primary, borderColor: colors.border },
          ]}
          textStyle={{ color: onPrimary }}
        />
      </View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title="Modes"
          onPress={() => {
            hapticFeedback?.("light");
            speak?.("Navigating to modes selection", true);
            router.push("/features");
          }}
          accessibilityLabel="Modes"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />
        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.("light");
            speak?.("Language is English", true);
          }}
          accessibilityLabel="Language"
          accessibilityHint="Current language is English"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default PersonRegistrationScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  topTitle: { fontSize: 24, fontWeight: "800" },

  centerArea: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  registerPersonButton: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: "center",
    minHeight: 64,
  },

  bottomBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  bottomButton: { flex: 1, height: 80, borderRadius: 18, marginHorizontal: 6, alignItems: "center", justifyContent: "center" },
});
