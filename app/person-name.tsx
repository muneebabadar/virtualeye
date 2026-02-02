import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const params = useLocalSearchParams<{ count?: string; imageUris?: string }>();

  const [name, setName] = useState("");
  const inputRef = useRef<TextInput | null>(null);

  // Parse image URIs
  const imageUrisString = params.imageUris?.toString() || "[]";
  let imageUris: string[] = [];
  try {
    imageUris = JSON.parse(imageUrisString);
  } catch (e) {
    console.error("Error parsing imageUris:", e);
  }

  useEffect(() => {
    speak?.(t("personName.announcement"), true);
  }, []);

  const handleContinue = () => {
    const trimmed = name.trim();

    if (!trimmed) {
      speak?.(t("personName.emptyError"), true);
      hapticFeedback?.("error");
      inputRef.current?.focus?.();
      return;
    }

    hapticFeedback?.("medium");
    speak?.(t("personName.saving", { name: trimmed }), true);

    router.replace({
      pathname: "/person-review",
      params: {
        name: trimmed,
        count: params.count || "5",
        imageUris: JSON.stringify(imageUris),
      },
    } as any);
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
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => {
              hapticFeedback?.("light");
              speak?.(t("common.back"), true);
              router.back();
            }}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            accessibilityHint={t("personName.backHint")}
          >
            <Feather name="arrow-left" size={28} color={colors.textInverse} />
          </Pressable>

          <AccessibleText
            style={[styles.headerTitle, { color: colors.textInverse }]}
            accessibilityRole="header"
            level={1}
          >
            {t("personRegistration.title")}
          </AccessibleText>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <AccessibleText
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
            level={2}
          >
            {t("personName.title")}
          </AccessibleText>

          <AccessibleText
            nativeID="personNameLabel"
            style={[styles.subtitle, { color: colors.text }]}
            accessibilityRole="text"
          >
            {t("personName.instruction")}
          </AccessibleText>

          <View
            style={[
              styles.inputWrapper,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder={t("personName.placeholder")}
              placeholderTextColor={colors.secondary}
              value={name}
              onChangeText={setName}
              accessibilityLabelledBy="personNameLabel"
              accessibilityLabel={t("personName.placeholder")}
              accessibilityHint={t("personName.instruction")}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <AccessibleButton
            title={t("personName.continue")}
            onPress={handleContinue}
            accessibilityLabel={t("personName.continue")}
            accessibilityHint={t("personReview.saveHint")}
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

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },

  inputWrapper: {
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 30,
  },

  input: {
    height: 50,
    fontSize: 20,
  },

  button: {
    height: 80,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
});