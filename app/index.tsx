import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";

const LoadingScreen = () => {
  const router = useRouter();
  const { speak } = useAccessibility();
  const colors = useAccessibleColors();

  // Announce loading screen for screen readers
  useEffect(() => {
    speak?.("V-EYE Virtual Eye Assistant is loading", true);
  }, []);

  // Navigate to welcome screen after loading
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
          accessible={true}
          accessibilityLabel="V-EYE logo"
          accessibilityRole="image"
        >
          <View
            style={[styles.logoInnerCircle, { backgroundColor: colors.background }]}
          >
            <Feather name="camera" size={60} color={colors.text} />
          </View>
        </View>

        <AccessibleText
          style={[styles.title, { color: colors.primary }]}
          accessibilityRole="header"
          level={1}
        >
          V-EYE
        </AccessibleText>

        <AccessibleText
          style={[styles.subtitle, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          Virtual Eye Assistant
        </AccessibleText>

        <AccessibleText
          style={[styles.loadingText, { color: colors.textSecondary }]}
          accessibilityRole="text"
          accessibilityLabel="Application is loading"
        >
          Loading...
        </AccessibleText>
      </View>
    </View>
  );
}
export default LoadingScreen;

const styles = StyleSheet.create({
  // Full screen background and centering
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Text and logo centered
  centerContent: {
    alignItems: "center",
  },
  // Outer circle for logo
  logoOuterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  // Inner circle for logo
  logoInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 30,
  },
  loadingText: {
    fontSize: 16,
  },
});
