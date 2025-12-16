import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const SetupScreen = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { speak, hapticFeedback, language, setLanguage, isHighContrastEnabled, toggleHighContrast } = useAccessibility();
  const colors = useAccessibleColors();

  // Announce setup screen
  useEffect(() => {
    const setupMessage =
      "Setup Screen. Choose your language and enter your email. " +
      "Language options: English or Urdu. Currently selected: English.";

    speak?.(setupMessage, true);
  }, []);

  // Announce language changes
  useEffect(() => {
    if (language === "ur") {
      speak?.("Language changed to Urdu", true);
    } else {
      speak?.("Language changed to English", true);
    }
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[styles.topBar, { backgroundColor: colors.primary }]}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="V-EYE Setup Screen Header"
      />

      <View style={[styles.languageCard, {
        backgroundColor: colors.card,
        borderColor: colors.border
      }]}>
        <AccessibleText
          style={[styles.languageCardTitle, { color: colors.primary }]}
          accessibilityRole="header"
          level={2}
        >
          Language Support
        </AccessibleText>

        <View style={styles.languageRow}>
          <AccessibleButton
            title="English"
            onPress={() => handleLanguageSelect("en")}
            accessibilityLabel={`English language. ${language === "en" ? "Selected" : "Not selected"}`}
            accessibilityHint="Select English as the application language"
            style={[
              styles.languageButton,
              { backgroundColor: colors.card },
              language === "en" && { backgroundColor: colors.primary }
            ]}
            textStyle={[
              styles.languageText,
              { color: colors.textSecondary },
              language === "en" && { color: colors.textInverse }
            ]}
          />

          <AccessibleButton
            title="Urdu"
            onPress={() => handleLanguageSelect("ur")}
            accessibilityLabel={`Urdu language. ${language === "ur" ? "Selected" : "Not selected"}`}
            accessibilityHint="Select Urdu as the application language"
            style={[
              styles.languageButton,
              { backgroundColor: colors.card },
              language === "ur" && { backgroundColor: colors.primary }
            ]}
            textStyle={[
              styles.languageText,
              { color: colors.textSecondary },
              language === "ur" && { color: colors.textInverse }
            ]}
          />
        </View>
      </View>

      <View style={[styles.accessibilityCard, {
        backgroundColor: colors.card,
        borderColor: colors.border
      }]}>
        <AccessibleText
          style={[styles.accessibilityCardTitle, { color: colors.primary }]}
          accessibilityRole="header"
          level={2}
        >
          Accessibility Options
        </AccessibleText>

        <View style={styles.accessibilityRow}>
          <AccessibleText
            style={[styles.accessibilityLabel, { color: colors.text }]}
            accessibilityRole="text"
          >
            High Contrast Mode
          </AccessibleText>

          <AccessibleButton
            title={isHighContrastEnabled ? "Enabled" : "Disabled"}
            onPress={() => {
              hapticFeedback?.("medium");
              toggleHighContrast();
              speak?.(`High contrast mode ${!isHighContrastEnabled ? "enabled" : "disabled"}`, true);
            }}
            accessibilityLabel={`High contrast mode is currently ${isHighContrastEnabled ? "enabled" : "disabled"}`}
            accessibilityHint="Toggle high contrast color scheme for better visibility"
            style={[
              styles.toggleButton,
              { backgroundColor: isHighContrastEnabled ? colors.success : colors.secondary }
            ]}
          />
        </View>
      </View>

      <View style={styles.emailSection}>
        <AccessibleText
          style={[styles.emailSectionTitle, { color: colors.primary }]}
          accessibilityRole="header"
          level={2}
        >
          Enter Your Email
        </AccessibleText>

        <AccessibleText
          style={[styles.emailSectionSubtitle, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          We'll use this to save your person recognition data on your device.
        </AccessibleText>

        <View style={[styles.emailInputWrapper, {
          borderColor: colors.border,
          backgroundColor: colors.card
        }]}>
          <TextInput
            style={[styles.emailInput, { color: colors.text }]}
            placeholder="your.email@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email address input field"
            accessibilityHint="Enter your email address for data storage"
          />
        </View>
      </View>

      <AccessibleButton
        title="Get Started"
        onPress={handleGetStarted}
        accessibilityLabel="Get started with V-EYE application"
        accessibilityHint="Navigate to the main features screen"
        style={styles.getStartedButton}
      />
    </View>
  );
}
export default SetupScreen

const styles = StyleSheet.create({
  root: {flex: 1, paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40},

  topBar: {height: 80,justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 12,borderBottomRightRadius: 12,width:"100%"},

  languageCard: {width: "100%",borderRadius: 18,borderWidth: 2,
    padding: 22,marginTop:24,marginBottom: 28,},
  languageCardTitle: {fontSize: 22,fontWeight: "700",marginBottom: 20,},
  languageRow: {flexDirection: "row",gap: 16,},
  languageButton: {flex: 1,borderRadius: 14,paddingVertical: 20,
    alignItems: "center",},
  languageText: {fontSize: 18,},

  accessibilityCard: {width: "100%",borderRadius: 18,borderWidth: 2,
    padding: 22,marginTop: 0,marginBottom: 28,},
  accessibilityCardTitle: {fontSize: 22,fontWeight: "700",marginBottom: 20,},
  accessibilityRow: {flexDirection: "row",alignItems: "center",justifyContent: "space-between",},
  accessibilityLabel: {fontSize: 18,fontWeight: "600",},
  toggleButton: {paddingHorizontal: 20,paddingVertical: 12,borderRadius: 12,},

  emailSection: {width: "100%",marginBottom: 30,},
  emailSectionTitle: {fontSize: 22,fontWeight: "700",marginBottom: 10,},
  emailSectionSubtitle: {fontSize: 16,marginBottom: 16,},
  emailInputWrapper: {borderRadius: 16,borderWidth: 2,paddingHorizontal: 16,},
  emailInput: {height: 50,fontSize: 18,},

  getStartedButton: {width: "100%",borderRadius: 18,paddingVertical: 20,
    alignItems: "center",marginBottom: 16,},


}

);
