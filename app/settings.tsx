import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";

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

const SettingsScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback, language, setLanguage, isHighContrastEnabled, toggleHighContrast } =
    useAccessibility();
  const colors = useAccessibleColors();

  const onPrimary = onColor(colors.primary);
  const onCard = onColor(colors.card);

  const languages = [
    { code: "en", label: "English" },
    { code: "ur", label: "اردو" },
  ];

  useEffect(() => {
    speak?.("Settings page. Select language or toggle high contrast mode.", true);
  }, []);

  const handleLanguageSelect = (selected: "en" | "ur") => {
    setLanguage(selected);
    speak?.(`Language changed to ${selected === "ur" ? "Urdu" : "English"}`, true);
    hapticFeedback?.("success");
  };

  const handleBack = () => {
    hapticFeedback?.("success");
    router.back();
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.root, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <AccessibleText style={[styles.header, { color: colors.primary }]} level={1}>
        Settings
      </AccessibleText>

      {/* Language Support */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AccessibleText style={[styles.cardTitle, { color: onCard }]} level={2}>
          Language Support
        </AccessibleText>
        <View style={styles.row}>
          {languages.map(lang => (
            <AccessibleButton
              key={lang.code}
              title={lang.label}
              onPress={() => handleLanguageSelect(lang.code as "en" | "ur")}
              accessibilityLabel={lang.label}
              accessibilityHint={`Select ${lang.label} as the application language`}
              style={[
                styles.languageButton,
                { backgroundColor: language === lang.code ? colors.primary : colors.card, borderColor: colors.border },
              ]}
              textStyle={{ color: language === lang.code ? onPrimary : onCard }}
            />
          ))}
        </View>
      </View>

      {/* High Contrast Toggle */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AccessibleText style={[styles.cardTitle, { color: onCard }]} level={2}>
          Accessibility Options
        </AccessibleText>

        <View style={styles.accessibilityRow}>
          <AccessibleText style={[styles.label, { color: onCard }]}>High Contrast Mode</AccessibleText>
          <AccessibleButton
            title={isHighContrastEnabled ? "Enabled" : "Disabled"}
            onPress={() => {
              toggleHighContrast();
              speak?.(`High contrast mode ${!isHighContrastEnabled ? "enabled" : "disabled"}`, true);
              hapticFeedback?.("medium");
            }}
            accessibilityLabel="High contrast mode"
            accessibilityHint="Toggle high contrast color scheme for better visibility"
            style={[
              styles.toggleButton,
              {
                backgroundColor: isHighContrastEnabled ? colors.success : colors.secondary,
                borderColor: colors.border,
              },
            ]}
            textStyle={{ color: onColor(isHighContrastEnabled ? colors.success : colors.secondary) }}
          />
        </View>
      </View>

      {/* Back Button */}
      <AccessibleButton
        title="Back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        accessibilityHint="Return to the previous screen"
        style={[styles.backButton, { backgroundColor: colors.secondary }]}
        textStyle={{ color: onCard }}
      />
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  root: { flexGrow: 1, padding: 28 },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 24 },

  card: { marginBottom: 24, borderRadius: 18, borderWidth: 2, padding: 20 },
  cardTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },

  row: { flexDirection: "row", gap: 16 },
  languageButton: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: "center", borderWidth: 2 },

  accessibilityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 18, fontWeight: "600" },
  toggleButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2 },

  backButton: { paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
