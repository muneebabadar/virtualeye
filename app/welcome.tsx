import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const WelcomeFeaturesScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [showContinueButton, setShowContinueButton] = useState(false);

  // Announce welcome screen and show continue button after speech
  useEffect(() => {
    const welcomeMessage =
      "Welcome to V-EYE, Virtual Eye Assistant. " +
      "Navigate the world through audio feedback. " +
      "Available features: Object Navigation, Color Identification, Currency Reader, and Person Recognition.";

    speak?.(welcomeMessage, true);

    // Show continue button after welcome message
    const timer = setTimeout(() => {
      setShowContinueButton(true);
      speak?.("Tap continue to proceed to setup", true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    hapticFeedback?.("medium");
    speak?.("Continuing to setup", true);
    router.replace("/setup");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View
          style={[styles.logoOuterCircle, { backgroundColor: colors.primary }]}
          accessible={true}
          accessibilityLabel="V-EYE logo"
          accessibilityRole="image"
        >
          <View
            style={[styles.logoInnerCircle, { backgroundColor: colors.background }]}
          >
            <Feather name="camera" size={40} color={colors.text} />
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
      </View>

      <AccessibleText
        style={[styles.welcomeTitle, { color: colors.text, marginTop: 32, textAlign: "center" }]}
        accessibilityRole="header"
        level={2}
      >
        Welcome
      </AccessibleText>

      <AccessibleText
        style={[styles.welcomeSubtitle, { color: colors.textSecondary, textAlign: "center" }]}
        accessibilityRole="text"
      >
        Navigate the world through audio feedback
      </AccessibleText>

      <View style={[styles.featuresCard, {
        backgroundColor: colors.card,
        borderColor: colors.border
      }]}>
        <AccessibleText
          style={[styles.featuresTitle, { color: colors.primary }]}
          accessibilityRole="header"
          level={3}
        >
          Available Features
        </AccessibleText>

        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: colors.warning }]} />
          <View>
            <AccessibleText
              style={[styles.featureTitle, { color: colors.text }]}
              accessibilityRole="text"
            >
              Object Navigation
            </AccessibleText>
            <AccessibleText
              style={[styles.featureSub, { color: colors.textSecondary }]}
              accessibilityRole="text"
            >
              Detect objects and navigate indoors
            </AccessibleText>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: colors.secondary }]} />
          <View>
            <AccessibleText
              style={[styles.featureTitle, { color: colors.text }]}
              accessibilityRole="text"
            >
              Person Recognition
            </AccessibleText>
            <AccessibleText
              style={[styles.featureSub, { color: colors.textSecondary }]}
              accessibilityRole="text"
            >
              Recognize registered people by face
            </AccessibleText>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: colors.warning }]} />
          <View>
            <AccessibleText
              style={[styles.featureTitle, { color: colors.text }]}
              accessibilityRole="text"
            >
              Color Identification
            </AccessibleText>
            <AccessibleText
              style={[styles.featureSub, { color: colors.textSecondary }]}
              accessibilityRole="text"
            >
              Identify colors of nearby objects
            </AccessibleText>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
          <View>
            <AccessibleText
              style={[styles.featureTitle, { color: colors.text }]}
              accessibilityRole="text"
            >
              Currency Reader
            </AccessibleText>
            <AccessibleText
              style={[styles.featureSub, { color: colors.textSecondary }]}
              accessibilityRole="text"
            >
              Read currency denominations
            </AccessibleText>
          </View>
        </View>
      </View>

      {showContinueButton && (
        <AccessibleButton
          title="Continue to Setup"
          onPress={handleContinue}
          accessibilityLabel="Continue to application setup"
          accessibilityHint="Navigate to the setup screen to configure language and preferences"
          style={styles.continueButton}
        />
      )}
    </View>
  );
}
export default WelcomeFeaturesScreen

const styles = StyleSheet.create({
  root: {flex: 1, paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40},
  //horizontally centres the logo and text
  header: {alignItems: "center",},
  //logo
  logoOuterCircle: {width: 110,height: 110,borderRadius: 55,
    alignItems: "center",justifyContent: "center",marginBottom: 12,},
  logoInnerCircle: {width: 90,height: 90,borderRadius: 45,
    alignItems: "center",justifyContent: "center",},

  title: {fontSize: 32,fontWeight: "800",letterSpacing: 2,},
  subtitle: {fontSize: 16,marginTop: 6,},

  welcomeTitle: {fontSize: 28,fontWeight: "700",marginBottom: 6,},
  welcomeSubtitle: {fontSize: 16,textAlign: "center",width: "80%",},

  featuresCard: {marginTop: 32,borderRadius: 22,borderWidth: 2,padding: 22,},

  //heading
  featuresTitle: {fontSize: 20,fontWeight: "700",marginBottom: 18,},

  featureRow: {flexDirection: "row",alignItems: "center",paddingVertical: 14,},
  featureDot: {width: 22,height: 22,borderRadius: 11,marginRight: 14,},
  featureTitle: {fontSize: 18,fontWeight: "600",},
  featureSub: {fontSize: 14,},




}


);
