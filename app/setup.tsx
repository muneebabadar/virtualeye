import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

/** Choose readable text color (black/white) based on background */
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

const SetupScreen = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { speak, hapticFeedback, language, setLanguage, isHighContrastEnabled, toggleHighContrast } =
    useAccessibility();
  const colors = useAccessibleColors();

  const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);
  const onCard = useMemo(() => onColor(colors.card), [colors.card]);
  const onBackground = useMemo(() => onColor(colors.background), [colors.background]);

  useEffect(() => {
    speak?.(
      "Setup Screen. Choose your language and enter your email. Language options: English or Urdu.",
      true
    );
  }, []);

  useEffect(() => {
    speak?.(language === "ur" ? "Language changed to Urdu" : "Language changed to English", true);
  }, [language]);

  const handleLanguageSelect = (selectedLanguage: "en" | "ur") => {
    hapticFeedback?.("success");
    setLanguage(selectedLanguage);
  };

  const handleGetStarted = () => {
    hapticFeedback?.("success");
    speak?.("Starting V-EYE application", true);
    router.replace("/features");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.topBar, { backgroundColor: colors.primary }]}
          accessible
          accessibilityRole="header"
          accessibilityLabel="V-EYE Setup Screen Header"
        />

        {/* Language card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AccessibleText
            style={[styles.cardTitle, { color: onCard }]}
            level={2}
          >
            Language Support
          </AccessibleText>

          <View style={styles.row}>
            <AccessibleButton
              title="English"
              onPress={() => handleLanguageSelect("en")}
              accessibilityLabel="English"
              accessibilityHint="Select English as the application language"
              style={[
                styles.languageButton,
                { backgroundColor: language === "en" ? colors.primary : colors.card, borderColor: colors.border },
              ]}
              textStyle={{ color: language === "en" ? onPrimary : onCard }}
            />

            <AccessibleButton
              title="Urdu"
              onPress={() => handleLanguageSelect("ur")}
              accessibilityLabel="Urdu"
              accessibilityHint="Select Urdu as the application language"
              style={[
                styles.languageButton,
                { backgroundColor: language === "ur" ? colors.primary : colors.card, borderColor: colors.border },
              ]}
              textStyle={{ color: language === "ur" ? onPrimary : onCard }}
            />
          </View>
        </View>

        {/* Accessibility card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AccessibleText style={[styles.cardTitle, { color: onCard }]} level={2}>
            Accessibility Options
          </AccessibleText>

          <View style={styles.accessibilityRow}>
            <AccessibleText style={[styles.label, { color: onCard }]}>
              High Contrast Mode
            </AccessibleText>

            <AccessibleButton
              title={isHighContrastEnabled ? "Enabled" : "Disabled"}
              onPress={() => {
                hapticFeedback?.("medium");
                toggleHighContrast();
                speak?.(`High contrast mode ${!isHighContrastEnabled ? "enabled" : "disabled"}`, true);
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

        {/* Email section */}
        <View style={styles.emailSection}>
          <AccessibleText style={[styles.sectionTitle, { color: onBackground }]} level={2}>
            Enter Your Email
          </AccessibleText>

          <AccessibleText style={[styles.sectionSubtitle, { color: onBackground }]}>
            We'll use this to save your person recognition data on your device.
          </AccessibleText>

          <AccessibleText nativeID="emailLabel" style={{ position: "absolute", left: -9999 }}>
            Email address
          </AccessibleText>

          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: onCard }]}
              placeholder="your.email@example.com"
              placeholderTextColor={onCard === "#000000" ? "#444444" : "#DDDDDD"}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              accessibilityLabelledBy="emailLabel"
              accessibilityHint="Enter your email address for data storage"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <AccessibleButton
          title="Get Started"
          onPress={handleGetStarted}
          accessibilityLabel="Get started"
          accessibilityHint="Navigate to the main features screen"
          style={[styles.getStartedButton, { backgroundColor: colors.primary, borderColor: colors.border }]}
          textStyle={{ color: onPrimary }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SetupScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40 },

  topBar: {
    height: 80,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    width: "100%",
    marginBottom: 18,
  },

  card: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 2,
    padding: 22,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: "700", marginBottom: 18 },

  row: { flexDirection: "row", gap: 16 },
  languageButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 2,
    minHeight: 56,
  },

  accessibilityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 18, fontWeight: "600" },
  toggleButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 2, minHeight: 48 },

  emailSection: { width: "100%", marginTop: 6, marginBottom: 22 },
  sectionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  sectionSubtitle: { fontSize: 16, marginBottom: 16 },

  inputWrapper: { borderRadius: 16, borderWidth: 2, paddingHorizontal: 16 },
  input: { height: 50, fontSize: 18 },

  getStartedButton: {
    width: "100%",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 2,
    minHeight: 56,
  },
});
