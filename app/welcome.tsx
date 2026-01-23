import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";

const WelcomeFeaturesScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  // Announce welcome message and auto-navigate
  useEffect(() => {
    const message =
      "Navigate the world through audio feedback. " +
      "Available features: Object Navigation, Color Identification, Currency Reader, and Person Recognition.";

    speak?.(message, true);

    // Automatically navigate after announcement
    const timer = setTimeout(() => {
      hapticFeedback?.("medium");
      speak?.("Continuing to setup", true);
      router.replace("/setup");
    }, 6000); // match approximate duration of speech

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        {/* Logo */}
        <View
          style={[styles.logoOuterCircle, { backgroundColor: colors.primary }]}
          accessible={true}
          accessibilityLabel="V-EYE logo"
          accessibilityRole="image"
        >
          <View style={[styles.logoInnerCircle, { backgroundColor: colors.background }]}>
            <Feather name="camera" size={40} color={colors.text} />
          </View>
        </View>

        {/* App Name */}
        <AccessibleText
          style={[styles.title, { color: colors.primary }]}
          accessibilityRole="header"
          level={1}
        >
          V-EYE
        </AccessibleText>

        <AccessibleText
          style={[styles.subtitle, { color: colors.secondary }]}
          accessibilityRole="text"
        >
          Virtual Eye Assistant
        </AccessibleText>

        {/* Core Message */}
        <AccessibleText
          style={[styles.mainMessage, { color: colors.text }]}
          accessibilityRole="header"
          level={2}
        >
          Navigate the world through audio feedback
        </AccessibleText>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AccessibleText
            style={[styles.featuresTitle, { color: colors.primary }]}
            accessibilityRole="header"
            level={3}
          >
            Available Features
          </AccessibleText>

          {[
            { title: "Object Navigation", desc: "Detect objects and navigate indoors", color: colors.warning },
            { title: "Person Recognition", desc: "Recognize registered people by face", color: colors.secondary },
            { title: "Color Identification", desc: "Identify colors of nearby objects", color: colors.warning },
            { title: "Currency Reader", desc: "Read currency denominations", color: colors.success }
          ].map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <View style={[styles.featureDot, { backgroundColor: feature.color }]} />
              <View>
                <AccessibleText style={[styles.featureTitle, { color: colors.text }]} accessibilityRole="text">
                  {feature.title}
                </AccessibleText>
                <AccessibleText style={[styles.featureSub, { color: colors.secondary }]} accessibilityRole="text">
                  {feature.desc}
                </AccessibleText>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default WelcomeFeaturesScreen;

const styles = StyleSheet.create({
  root: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  centerContent: { alignItems: "center", width: "100%" },

  logoOuterCircle: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoInnerCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },

  title: { fontSize: 32, fontWeight: "800", letterSpacing: 2, textAlign: "center" },
  subtitle: { fontSize: 16, marginTop: 6, textAlign: "center" },

  mainMessage: { fontSize: 20, fontWeight: "600", marginTop: 32, marginBottom: 24, textAlign: "center" },

  featuresCard: { borderRadius: 22, borderWidth: 2, padding: 22, width: "100%" },
  featuresTitle: { fontSize: 20, fontWeight: "700", marginBottom: 18, textAlign: "center" },

  featureRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  featureDot: { width: 22, height: 22, borderRadius: 11, marginRight: 14 },
  featureTitle: { fontSize: 18, fontWeight: "600" },
  featureSub: { fontSize: 14 },
});