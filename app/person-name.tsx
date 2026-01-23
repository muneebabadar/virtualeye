import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const PersonNameScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    speak?.("Name entry screen. Enter the person's name to complete registration.", true);
  }, []);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      speak?.("Please enter a name first", true);
      hapticFeedback?.("error");
      inputRef.current?.focus?.();
      return;
    }
    hapticFeedback?.("medium");
    speak?.(`Saving person named ${trimmed}. Proceeding to review.`, true);
    router.replace({ pathname: "/person-review", params: { name: trimmed, count: "5" } } as any);
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
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          {/* FIX: Back button touch target >= 48x48 */}
          <Pressable
            onPress={() => {
              hapticFeedback?.("light");
              speak?.("Going back to previous screen", true);
              router.back();
            }}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible
            accessibilityLabel="Go back"
            accessibilityHint="Return to person capture screen"
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={28} color={colors.textInverse} />
          </Pressable>

          <AccessibleText
            style={[styles.headerTitle, { color: colors.textInverse }]}
            accessibilityRole="header"
            level={1}
          >
            Person Registration
          </AccessibleText>
        </View>

        <View style={styles.content}>
          <AccessibleText style={[styles.title, { color: colors.text }]} accessibilityRole="header" level={2}>
            Photos Complete!
          </AccessibleText>

          {/* Visible label + association */}
          <AccessibleText
            nativeID="personNameLabel"
            style={[styles.subtitle, { color: colors.text }]}
            accessibilityRole="text"
          >
            Enter name for this person
          </AccessibleText>

          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter name"
              placeholderTextColor={colors.secondary}
              value={name}
              onChangeText={setName}
              accessibilityLabelledBy="personNameLabel"
              accessibilityLabel="Person name"
              accessibilityHint="Type the name of the person you just photographed"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <AccessibleButton
            title="Continue"
            onPress={handleContinue}
            accessibilityLabel="Continue"
            accessibilityHint="Save the person's name and proceed to review"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonNameScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: { paddingBottom: 40 },

  header: {
    height: 120,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },

  // FIX: 48x48 minimum
  backButton: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: 30 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 },

  // FIX: avoid too-light contrast → use colors.text (not secondary)
  subtitle: { fontSize: 18, textAlign: "center", marginBottom: 20 },

  inputWrapper: { borderRadius: 14, borderWidth: 2, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 30 },
  input: { height: 50, fontSize: 20 },

  button: { height: 80, borderRadius: 18, alignItems: "center", justifyContent: "center", marginHorizontal: 6 },
});
