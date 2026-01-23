import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";

import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";

const FeaturesScreen: React.FC = () => {
  const router = useRouter();
  const { speak, stopSpeaking, hapticFeedback, isScreenReaderEnabled } = useAccessibility();
  const colors = useAccessibleColors();

  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  useEffect(() => {
    const welcomeMessage =
      "V-EYE Modes Selection. Four modes available: " +
      "Object Navigation, Color Identification, Currency Reader, and Person Registration. " +
      "Select a mode to begin.";

    const timer = setTimeout(() => {
      speak?.(welcomeMessage, true);
    }, 500);

    return () => {
      clearTimeout(timer);
      stopSpeaking?.();
    };
  }, []);

  const modes = [
    {
      id: "object-navigation",
      title: "Object Navigation",
      route: "/object-navigation",
      description: "Detect objects and navigate indoors",
      accessibilityHint: "Navigate to object navigation mode. Detects objects and obstacles.",
    },
    {
      id: "color-identification",
      title: "Color Identification",
      route: "/color-identification",
      description: "Identify colors of objects",
      accessibilityHint: "Navigate to color identification mode. Identifies dominant colors.",
    },
    {
      id: "currency-reader",
      title: "Currency Reader",
      route: "/currency-reader",
      description: "Read currency denominations",
      accessibilityHint: "Navigate to currency reader mode. Reads currency denominations.",
    },
    {
      id: "person-registration",
      title: "Person Registration",
      route: "/person-registration",
      description: "Register and manage people",
      accessibilityHint: "Navigate to person registration mode. Register new people for recognition.",
    },
  ];

  const handleModeSelect = (mode: typeof modes[0]) => {
    hapticFeedback?.("medium");
    speak?.(`${mode.title} selected.`, true);
    setSelectedMode(mode.id);

    setTimeout(() => {
      router.push(mode.route as any);
    }, 300);
  };

  const handleSettings = () => {
    hapticFeedback?.("medium");
    speak?.("Navigating to settings", true);
    router.push("/settings");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        accessible
        accessibilityRole="header"
        accessibilityLabel="V-EYE application modes selection"
      >
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Select Mode
        </AccessibleText>
      </View>

      {/* Mode Buttons */}
      <View style={styles.centerArea}>
        {modes.map((mode, index) => (
          <View key={mode.id} style={styles.modeWrapper}>
            <AccessibleButton
              onPress={() => handleModeSelect(mode)}
              accessibilityLabel={`${mode.title}. ${mode.description}`}
              accessibilityHint={mode.accessibilityHint}
              style={[
                styles.modeButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: selectedMode === mode.id ? colors.textInverse : colors.primary,
                },
                selectedMode === mode.id ? styles.modeButtonSelected : null,
              ]}
            >
              <View style={styles.modeInner}>
                <View style={styles.modeTextContainer}>
                  <AccessibleText
                    style={[styles.modeTitle, { color: colors.textInverse }]}
                    accessibilityRole="header"
                    level={2}
                  >
                    {mode.title}
                  </AccessibleText>
                  <AccessibleText
                    style={[styles.modeSub, { color: colors.textInverse }]}
                    accessibilityRole="text"
                  >
                    {mode.description}
                  </AccessibleText>
                </View>
              </View>
            </AccessibleButton>

            {isScreenReaderEnabled && (
              <AccessibleText
                accessible
                accessibilityLabel={`Mode ${index + 1} of ${modes.length}`}
                style={[
                  styles.srModeNumber,
                  { backgroundColor: colors.primary, color: colors.textInverse },
                ]}
              >
                {index + 1} / {modes.length}
              </AccessibleText>
            )}
          </View>
        ))}
      </View>

      {/* Settings Button - Footer */}
      <View style={styles.footer}>
        <AccessibleButton
          onPress={handleSettings}
          accessibilityLabel="Settings"
          accessibilityHint="Open settings to change language and high contrast options"
          style={[styles.settingsButton, { backgroundColor: colors.secondary }]}
        >
          <AccessibleText
            style={{ color: colors.textInverse, fontSize: 18, fontWeight: "700", textAlign: "center" }}
            accessibilityRole="header"
            level={2}
          >
            Settings
          </AccessibleText>
        </AccessibleButton>
      </View>
    </View>
  );
};

export default FeaturesScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  topTitle: { fontSize: 24, fontWeight: "800" },
  centerArea: { flex: 1, paddingHorizontal: 20, paddingVertical: 24 },
  modeWrapper: { marginBottom: 20, position: "relative" },
  modeButton: {
    borderRadius: 20,
    height: 100,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 2,
  },
  modeButtonSelected: { transform: [{ scale: 0.99 }] },
  modeInner: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  modeTextContainer: { flex: 1 },
  modeTitle: { fontSize: 20, fontWeight: "800" },
  modeSub: { fontSize: 14 },
  srModeNumber: {
    position: "absolute",
    top: 8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: { padding: 20, borderTopWidth: 1, borderColor: "#ccc" },
  settingsButton: {
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
