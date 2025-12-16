import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const PersonRegistrationScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  // Announce screen on mount
  useEffect(() => {
    speak?.("Person Registration Screen. Register new people for recognition.", true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Person Registration
        </AccessibleText>
      </View>

      <View style={styles.centerArea}>
        <AccessibleButton
          title="Register New Person"
          onPress={() => {
            hapticFeedback?.('medium');
            speak?.('Opening camera for person registration', true);
            router.push("/person-capture");
          }}
          accessibilityLabel="Register a new person for face recognition"
          accessibilityHint="Start the process to register a new person's face"
          style={styles.registerPersonButton}
        />
      </View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title="Modes"
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Navigating to modes selection', true);
            router.push("/features");
          }}
          accessibilityLabel="Navigate to modes selection screen"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />
        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Language is English', true);
          }}
          accessibilityLabel="Current language: English"
          accessibilityHint="Application language indicator"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}
export default PersonRegistrationScreen
const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {height: 120, justifyContent: "center", alignItems: "center",
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24, fontWeight: "800"},

  centerArea: {flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24,},
  registerPersonButton: {width: "100%", borderRadius: 24, paddingVertical: 40,
    paddingHorizontal: 20, borderWidth: 2, alignItems: "center",},

  bottomBar: {flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12,},
  bottomButton: {flex: 1, height: 80, borderRadius: 18, marginHorizontal: 6,
    alignItems: "center", justifyContent: "center",},


}

);
