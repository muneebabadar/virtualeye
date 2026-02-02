// import { AccessibleButton } from "@/components/AccessibleButton";
// import { AccessibleText } from "@/components/AccessibleText";
// import { useAccessibility } from "@/contexts/AccessibilityContext";
// import { useAccessibleColors } from "@/hooks/useAccessibleColors";
// import { useRouter } from "expo-router";
// import React, { useEffect, useMemo } from "react";
// import { I18nManager, StyleSheet, View } from "react-native";
// import { useTranslation } from "react-i18next";

// /** Readable on-color (black/white) */
// const onColor = (bg: string) => {
//   const hex = (bg || "").replace("#", "");
//   if (hex.length !== 6) return "#000000";
//   const r = parseInt(hex.slice(0, 2), 16) / 255;
//   const g = parseInt(hex.slice(2, 4), 16) / 255;
//   const b = parseInt(hex.slice(4, 6), 16) / 255;
//   const toLin = (c: number) =>
//     c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
//   const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
//   return L > 0.45 ? "#000000" : "#FFFFFF";
// };

// const PersonRegistrationScreen = () => {
//   const router = useRouter();
//   const { speak, hapticFeedback } = useAccessibility();
//   const colors = useAccessibleColors();
//   const { t } = useTranslation();

//   const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);

//   /** Screen announcement */
//   useEffect(() => {
//     speak?.(t("personRegistration.announcement"), true);
//   }, []);

//   return (
//     <View style={[styles.root, { backgroundColor: colors.background }]}>
//       {/* Header */}
//       <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
//         <AccessibleText
//           level={1}
//           accessibilityRole="header"
//           style={[styles.topTitle, { color: onPrimary }]}
//         >
//           {t("personRegistration.title")}
//         </AccessibleText>
//       </View>

//       {/* Main Action */}
//       <View style={styles.centerArea}>
//         <AccessibleButton
//           title={t("personRegistration.register")}
//           onPress={() => {
//             hapticFeedback?.("medium");
//             speak?.(t("personRegistration.openCamera"), true);
//             router.push("/person-capture");
//           }}
//           accessibilityLabel={t("personRegistration.register")}
//           accessibilityHint={t("personRegistration.registerHint")}
//           style={[
//             styles.registerPersonButton,
//             { backgroundColor: colors.primary, borderColor: colors.border },
//           ]}
//           textStyle={{ color: onPrimary }}
//         />
//       </View>

//       {/* Bottom Navigation */}
//       <View style={[styles.bottomBar, { backgroundColor: colors.background , flexDirection: I18nManager.isRTL ? "row-reverse" : "row"}]}>
//         <AccessibleButton
//           title={t("common.modes")}
//           onPress={() => {
//             hapticFeedback?.("light");
//             speak?.(t("common.goToModes"), true);
//             router.push("/features");
//           }}
//           accessibilityLabel={t("common.modes")}
//           accessibilityHint={t("common.modesHint")}
//           style={styles.bottomButton}
//         />

//         <AccessibleButton
//           title={t("common.languageEnglish")}
//           onPress={() => {
//             hapticFeedback?.("light");
//             speak?.(t("common.languageEnglish"), true);
//           }}
//           accessibilityLabel={t("common.languageEnglish")}
//           accessibilityHint={t("common.languageHint")}
//           style={styles.bottomButton}
//         />
//       </View>
//     </View>
//   );
// };

// export default PersonRegistrationScreen;

// const styles = StyleSheet.create({
//   root: { flex: 1 },

//   topBar: {
//     minHeight: 120,
//     justifyContent: "center",
//     alignItems: "center",
//     borderBottomLeftRadius: 8,
//     borderBottomRightRadius: 8,
//     paddingTop: 40,
//   },
//   topTitle: {
//     fontSize: 24,
//     fontWeight: "800",
//     textAlign: "center",
//   },

//   centerArea: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 24,
//   },

//   registerPersonButton: {
//     width: "100%",
//     borderRadius: 24,
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//     borderWidth: 2,
//     alignItems: "center",
//     minHeight: 64, // Android touch target safe
//   },

//   bottomBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     gap:12
//   },

//   bottomButton: {
//     flex: 1,
//     height: 80,
//     minHeight: 48, // Android minimum
//     borderRadius: 18,
//     marginHorizontal: 6,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });


import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { I18nManager, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

/** Readable on-color (black/white) */
const onColor = (bg: string) => {
  const hex = (bg || "").replace("#", "");
  if (hex.length !== 6) return "#000000";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return L > 0.45 ? "#000000" : "#FFFFFF";
};

const FALLBACK_COLORS = {
  background: "#000000",
  primary: "#1f2937",
  text: "#ffffff",
  textInverse: "#ffffff",
  card: "#111827",
  border: "#374151",
  secondary: "#9ca3af",
  disabled: "#6b7280",
};

const PersonRegistrationScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();

  const hookColors = useAccessibleColors();
  const colors = useMemo(() => hookColors ?? FALLBACK_COLORS, [hookColors]);

  const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);

  /** Screen announcement */
  useEffect(() => {
    speak?.(t("personRegistration.announcement"), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const handleRegister = () => {
    hapticFeedback?.("medium");
    speak?.(t("personRegistration.openCamera"), true);
    router.push("/person-capture");
  };

  const handleGoModes = () => {
    hapticFeedback?.("light");
    speak?.(t("common.goToModes"), true);
    router.push("/features");
  };

  const handleLanguageButton = () => {
    hapticFeedback?.("light");

    // Just announce current language (your PersonName does this style)
    // If you actually want to SWITCH language here, tell me and I'll add it.
    if (i18n.language === "ur") {
      speak?.(t("common.languageChangedUrdu"), true);
    } else {
      speak?.(t("common.languageChangedEnglish"), true);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          level={1}
          accessibilityRole="header"
          style={[styles.topTitle, { color: onPrimary }]}
        >
          {t("personRegistration.title")}
        </AccessibleText>
      </View>

      {/* Main Action */}
      <View style={styles.centerArea}>
        <AccessibleButton
          title={t("personRegistration.register")}
          onPress={handleRegister}
          accessibilityLabel={t("personRegistration.register")}
          accessibilityHint={t("personRegistration.registerHint")}
          style={[
            styles.registerPersonButton,
            { backgroundColor: colors.primary, borderColor: colors.border },
          ]}
          textStyle={{ color: onPrimary }}
        />
      </View>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <AccessibleButton
          title={t("common.modes")}
          onPress={handleGoModes}
          accessibilityLabel={t("common.modes")}
          accessibilityHint={t("common.modesHint")}
          style={styles.bottomButton}
        />

        <AccessibleButton
          // same UX as your PersonNameScreen: show current indicator
          title={i18n.language === "ur" ? "اردو" : "ENG"}
          onPress={handleLanguageButton}
          accessibilityLabel={
            i18n.language === "ur" ? t("common.languageUrdu") : t("common.languageEnglish")
          }
          accessibilityHint={t("common.languageHint")}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default PersonRegistrationScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  topTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  registerPersonButton: {
    width: "100%",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: "center",
    minHeight: 64, // Android touch target safe
  },

  bottomBar: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },

  bottomButton: {
    flex: 1,
    height: 80,
    minHeight: 48,
    borderRadius: 18,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
