import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const PersonNameScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [name, setName] = useState("");

  // Announce screen on mount
  useEffect(() => {
    speak?.("Name entry screen. Enter the person's name to complete registration.", true);
  }, []);

  const handleContinue = () => {
    if (!name.trim()) {
      speak?.("Please enter a name first", true);
      hapticFeedback?.('error');
      return;
    }
    hapticFeedback?.('medium');
    speak?.(`Saving person named ${name}. Proceeding to review.`, true);
    router.replace({pathname: "/person-review", params: {name: name.trim(), count: "5"}});
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Going back to previous screen', true);
            router.back();
          }}
          accessible={true}
          accessibilityLabel="Go back to previous screen"
          accessibilityHint="Return to person capture screen"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={32} color={colors.textInverse} />
        </TouchableOpacity>
        <AccessibleText
          style={[styles.headerTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Person Registration
        </AccessibleText>
      </View>

      <View style={styles.content}>
        <AccessibleText
          style={[styles.title, { color: colors.primary }]}
          accessibilityRole="header"
          level={2}
        >
          Photos Complete!
        </AccessibleText>
        <AccessibleText
          style={[styles.subtitle, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          Enter name for this person
        </AccessibleText>

        <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            accessibilityLabel="Person name input field"
            accessibilityHint="Enter the name of the person you just photographed"
          />
        </View>
        <AccessibleButton
          title="Continue"
          onPress={handleContinue}
          accessibilityLabel="Continue to person review"
          accessibilityHint="Save the person's name and proceed to review the registration"
          style={styles.button}
        />
      </View>
    </View>
  );
}
export default PersonNameScreen
const styles = StyleSheet.create({
  root: {flex: 1},

  header: {height: 120, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 14,},
  headerTitle: {fontSize: 24, fontWeight: "700"},

  content: {flex: 1, justifyContent: "center", paddingHorizontal: 24,},
  title: {fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10,},
  subtitle: {fontSize: 18, textAlign: "center", marginBottom: 20,},
  inputWrapper: {borderRadius: 14, borderWidth: 2, paddingHorizontal: 12,
    paddingVertical: 10, marginBottom: 30,},
  input: {height: 50, fontSize: 20},

  button: {height: 80, borderRadius: 18, alignItems: "center", justifyContent: "center"},

}

);
