import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";

const LoadingScreen = () => {
  const router = useRouter();
  const { speak } = useAccessibility();
  const colors = useAccessibleColors();

  useEffect(() => {
    speak?.("V-EYE Virtual Eye Assistant is loading", true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <View
          style={[styles.logoOuterCircle, { backgroundColor: colors.primary }]}
          accessible
          accessibilityLabel="V-EYE logo"
          accessibilityRole="image"
        >
          <View style={[styles.logoInnerCircle, { backgroundColor: colors.background }]}>
            <Feather name="camera" size={60} color={colors.text} />
          </View>
        </View>

        <AccessibleText style={[styles.title, { color: colors.text }]} accessibilityRole="header" level={1}>
          V-EYE
        </AccessibleText>

        <AccessibleText style={[styles.subtitle, { color: colors.secondary }]} accessibilityRole="text">
          Virtual Eye Assistant
        </AccessibleText>

        <AccessibleText
          style={[styles.loadingText, { color: colors.secondary }]}
          accessibilityRole="text"
          accessibilityLabel="Application is loading"
        >
          Loading...
        </AccessibleText>
      </View>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerContent: { alignItems: "center" },
  logoOuterCircle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoInnerCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "800", marginTop: 20 },
  subtitle: { fontSize: 16, marginTop: 8, marginBottom: 30 },
  loadingText: { fontSize: 16 },
});
