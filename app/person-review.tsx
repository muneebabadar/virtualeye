import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const PersonReviewScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const params = useLocalSearchParams<{ name?: string; count?: string }>();

  const personName = (params.name ?? "name").toString();
  const photosCount = Number(params.count ?? "5");

  // Announce screen on mount
  useEffect(() => {
    speak?.(`Reviewing person: ${personName}. ${photosCount} photos captured. Ready to save profile.`, true);
  }, [personName, photosCount]);

  const handleSave = () => {
    hapticFeedback?.('success');
    speak?.(`Profile for ${personName} saved successfully. Returning to registration screen.`, true);
    router.replace("/person-registration" as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Going back to name entry screen', true);
            router.back();
          }}
          accessible={true}
          accessibilityLabel="Go back to previous screen"
          accessibilityHint="Return to name entry screen"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={28} color={colors.textInverse} />
        </TouchableOpacity>
        <AccessibleText
          style={[styles.headerTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Profile Ready to Save
        </AccessibleText>
      </View>

      <View style={styles.content}>
        <View style={[styles.nameCardOuter, { borderColor: colors.primary }]}>
          <View style={[styles.nameCardInner, { backgroundColor: colors.card }]}>
            <AccessibleText
              style={[styles.nameText, { color: colors.text }]}
              accessibilityRole="text"
              accessibilityLabel={`Person name: ${personName}`}
            >
              {personName}
            </AccessibleText>
            <AccessibleText
              style={[styles.countText, { color: colors.textSecondary }]}
              accessibilityRole="text"
              accessibilityLabel={`${photosCount} photos captured for this person`}
            >
              {photosCount} photos captured
            </AccessibleText>
          </View>
        </View>

        <AccessibleText
          style={[styles.description, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          Review completed. Tap below to save this person's profile.
        </AccessibleText>

        <AccessibleButton
          title="Save Profile"
          onPress={handleSave}
          accessibilityLabel={`Save profile for ${personName}`}
          accessibilityHint="Save this person's registration data and return to the registration screen"
          style={[styles.saveButton, { backgroundColor: colors.success, borderColor: colors.textInverse }]}
        />
      </View>
    </View>
  );
}
export default PersonReviewScreen
const styles = StyleSheet.create({
  root: {flex: 1},

  header: {height: 120, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12,},
  headerTitle: {fontSize: 22, fontWeight: "700"},

  content: {flex: 1, paddingHorizontal: 24, justifyContent: "center", alignItems: "center", paddingTop: 40,},
  nameCardOuter: {borderRadius: 18, borderWidth: 3, padding: 4, backgroundColor: "transparent",
    marginBottom: 28, width: "85%", height: 120,},
  nameCardInner: {borderRadius: 14, paddingVertical: 20, paddingHorizontal: 16,
    alignItems: "center",},
  nameText: {fontSize: 22, fontWeight: "700", marginBottom: 6,},

  countText: {fontSize: 14},
  description: {fontSize: 14, textAlign: "center", marginBottom: 30,},

  saveButton: {height: 80, borderRadius: 18, borderWidth: 3,
    alignItems: "center", justifyContent: "center", width: "85%"},

}
);
