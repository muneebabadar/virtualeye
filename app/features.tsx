// import { useRouter } from "expo-router";
// import React from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


// const FeaturesScreen=() =>{
//   const router = useRouter();

//   return (
//     <View style={styles.root}>
//       <View style={styles.topBar}>
//         <Text style={styles.topTitle}>Select Mode</Text>
//       </View>

//       <View style={styles.centerArea}>
//         <TouchableOpacity
//           style={styles.modeButton}
//           onPress={() => router.push("/object-navigation")}>
//           <Text style={styles.modeTitle}>Object Navigation</Text>
//           <Text style={styles.modeSub}>Detect objects and navigate indoors</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.modeButton}
//           onPress={() => router.push("/color-identification")}>
//           <Text style={styles.modeTitle}>Color Identification</Text>
//           <Text style={styles.modeSub}>Identify colors of objects</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.modeButton}
//           onPress={() => router.push("/currency-reader")}>
//           <Text style={styles.modeTitle}>Currency Reader</Text>
//           <Text style={styles.modeSub}>Read currency denominations</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.modeButton}
//           onPress={() => router.push("/person-registration")}>
//           <Text style={styles.modeTitle}>Person Registration</Text>
//           <Text style={styles.modeSub}>Register and manage people</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }
// export default FeaturesScreen
// const styles = StyleSheet.create({
//   root: {flex: 1,backgroundColor: "#020713",},
//   topBar: {height: 120,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
//     borderBottomLeftRadius: 8,borderBottomRightRadius: 8,},
//   topTitle: {fontSize: 24,fontWeight: "800",color: "#000",},

//   centerArea: {flex: 1,paddingHorizontal: 20,paddingVertical: 24,},
//   modeButton: {backgroundColor: "#f4b500",borderRadius: 20,height: 100,marginBottom: 20,paddingHorizontal: 16,
//     justifyContent: "center",
//   },
//   modeTitle: {fontSize: 20,fontWeight: "800",color: "#000",marginBottom: 4,},
//   modeSub: {fontSize: 14,color: "#111827",},

// }

// );
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { useAccessibility } from "@/contexts/AccessibilityContext";

import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";

const FeaturesScreen: React.FC = () => {
  const router = useRouter();
  const { speak, stopSpeaking, hapticFeedback, isScreenReaderEnabled } = useAccessibility();

  // 🔥 Your accessible colors hook is used *here*
  const colors = useAccessibleColors();

  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Announce screen on mount for screen readers
  useEffect(() => {
    const welcomeMessage =
      "V-EYE Modes Selection. Four modes available: " +
      "Object Navigation, " +
      "Color Identification, " +
      "Currency Reader, " +
      "and Person Registration. " +
      "Select a mode to begin.";

    const timer = setTimeout(() => {
      speak?.(welcomeMessage, true);
    }, 500);

    return () => {
      clearTimeout(timer);
      stopSpeaking?.();
    };
  }, []);

  const modes = [
    {
      id: "object-navigation",
      title: "Object Navigation",
      route: "/object-navigation",
      description: "Detect objects and navigate indoors",
      accessibilityHint: "Navigate to object navigation mode. Detects objects and obstacles.",
    },
    {
      id: "color-identification",
      title: "Color Identification",
      route: "/color-identification",
      description: "Identify colors of objects",
      accessibilityHint:
        "Navigate to color identification mode. Identifies dominant colors of objects.",
    },
    {
      id: "currency-reader",
      title: "Currency Reader",
      route: "/currency-reader",
      description: "Read currency denominations",
      accessibilityHint: "Navigate to currency reader mode. Reads currency denominations.",
    },
    {
      id: "person-registration",
      title: "Person Registration",
      route: "/person-registration",
      description: "Register and manage people",
      accessibilityHint:
        "Navigate to person registration mode. Register new people for recognition.",
    },
  ];

  const handleModeSelect = (mode: typeof modes[0]) => {
    hapticFeedback?.("medium");
    speak?.(`${mode.title} selected.`, true);
    setSelectedMode(mode.id);

    setTimeout(() => {
      router.push(mode.route as any);
    }, 300);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="V-EYE Application. Modes Selection Screen"
      >
        <AccessibleText
          style={[styles.topTitle, { color: '#FFFFFF' }]}
          accessibilityRole="header"
          level={1}
        >
          Select Mode
        </AccessibleText>
      </View>

      <View style={styles.centerArea}>
        {modes.map((mode, index) => (
          <View key={mode.id} style={styles.modeWrapper}>
            <AccessibleButton
              onPress={() => handleModeSelect(mode)}
              accessibilityLabel={`${mode.title}. ${mode.description}`}
              accessibilityHint={mode.accessibilityHint}
              style={[
                styles.modeButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: selectedMode === mode.id ? colors.accent : colors.primary,
                },
                selectedMode === mode.id ? styles.modeButtonSelected : null,
              ]}
            >
              <View style={styles.modeInner}>
                <View style={styles.modeTextContainer}>
                  <AccessibleText
                    style={[styles.modeTitle, { color: '#FFFFFF' }]}
                    accessibilityRole="header"
                    level={2}
                  >
                    {mode.title}
                  </AccessibleText>

                  <AccessibleText style={[styles.modeSub, { color: '#FFFFFF', opacity: 0.9 }]}>
                    {mode.description}
                  </AccessibleText>
                </View>
              </View>
            </AccessibleButton>

            {isScreenReaderEnabled && (
              <AccessibleText
                accessible={true}
                accessibilityLabel={`Mode ${index + 1} of ${modes.length}`}
                style={[
                  styles.srModeNumber,
                  { backgroundColor: colors.primary, color: '#FFFFFF' },
                ]}
              >
                {index + 1} / {modes.length}
              </AccessibleText>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default FeaturesScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  topTitle: { fontSize: 24, fontWeight: "800" },

  centerArea: { flex: 1, paddingHorizontal: 20, paddingVertical: 24 },

  modeWrapper: { marginBottom: 20, position: "relative" },

  modeButton: {
    borderRadius: 20,
    height: 100,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 2,
  },
  modeButtonSelected: {
    transform: [{ scale: 0.99 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 3,
  },

  modeInner: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  modeTextContainer: { flex: 1 },

  modeTitle: { fontSize: 20, fontWeight: "800" },
  modeSub: { fontSize: 14 },

  srModeNumber: {
    position: "absolute",
    top: 8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
  },
});
