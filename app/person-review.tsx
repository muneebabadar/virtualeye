// import { AccessibleButton } from "@/components/AccessibleButton";
// import { AccessibleText } from "@/components/AccessibleText";
// import { useAccessibility } from "@/contexts/AccessibilityContext";
// import { useAccessibleColors } from "@/hooks/useAccessibleColors";
// import { Feather } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useMemo, useState } from "react";
// import { Pressable, StyleSheet, View } from "react-native";
// import { registerPerson } from "@/services/personRecognitionApi";

// /** Choose readable text color (black/white) */
// const onColor = (bg: string) => {
//   const hex = (bg || "").replace("#", "");
//   if (hex.length !== 6) return "#000000";
//   const r = parseInt(hex.slice(0, 2), 16) / 255;
//   const g = parseInt(hex.slice(2, 4), 16) / 255;
//   const b = parseInt(hex.slice(4, 6), 16) / 255;
//   const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
//   const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
//   return L > 0.45 ? "#000000" : "#FFFFFF";
// };

// const PersonReviewScreen = () => {
//   const router = useRouter();
//   const { speak, hapticFeedback } = useAccessibility();
//   const colors = useAccessibleColors();
//   const params = useLocalSearchParams<{ name?: string; count?: string; imageUris?: string }>();
//   const [isSaving, setIsSaving] = useState(false);

//   const personName = (params.name ?? "name").toString();
//   const photosCount = Number(params.count ?? "5");
  
//   // Parse image URIs from params
//   const imageUrisString = params.imageUris?.toString() || "[]";
//   let imageUris: string[] = [];
//   try {
//     imageUris = JSON.parse(imageUrisString);
//   } catch (e) {
//     console.error("Error parsing imageUris:", e);
//   }

//   const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);
//   const onCard = useMemo(() => onColor(colors.card), [colors.card]);
//   const onSuccess = useMemo(() => onColor(colors.success), [colors.success]);

//   useEffect(() => {
//     speak?.(
//       `Reviewing person: ${personName}. ${photosCount} photos captured. Ready to save profile.`,
//       true
//     );
//   }, [personName, photosCount]);

//   const handleSave = async () => {
//     if (isSaving) return;
    
//     setIsSaving(true);
//     hapticFeedback?.("medium");
    
//     try {
//       speak?.(`Saving profile for ${personName}...`, true);
      
//       const result = await registerPerson(personName, imageUris);
      
//       if (result.success) {
//         hapticFeedback?.("success");
//         speak?.(`Profile for ${personName} saved successfully. Returning to registration screen.`, true);
//         router.replace("/person-registration" as any);
//       } else {
//         hapticFeedback?.("error");
//         speak?.(result.error || "Failed to save profile. Please try again.", true);
//       }
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : "Unknown error";
//       console.error("Registration error:", errorMsg);
//       hapticFeedback?.("error");
//       speak?.(`Error saving profile: ${errorMsg}`, true);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <View style={[styles.root, { backgroundColor: colors.background }]}>
//       <View style={[styles.header, { backgroundColor: colors.primary }]}>
//         <Pressable
//           onPress={() => {
//             hapticFeedback?.("light");
//             speak?.("Going back to name entry screen", true);
//             router.back();
//           }}
//           style={styles.backButton}
//           hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//           accessible
//           accessibilityLabel="Go back"
//           accessibilityHint="Return to name entry screen"
//           accessibilityRole="button"
//         >
//           <Feather name="arrow-left" size={28} color={onPrimary} />
//         </Pressable>

//         <AccessibleText style={[styles.headerTitle, { color: onPrimary }]} level={1}>
//           Profile Ready to Save
//         </AccessibleText>
//       </View>

//       <View style={styles.content}>
//         {/* FIX: Make this a single accessible element to avoid "Unexposed Text" */}
//         <View
//           style={[styles.nameCardOuter, { borderColor: colors.primary }]}
//           accessible
//           accessibilityRole="text"
//           accessibilityLabel={`Name: ${personName}. ${photosCount} photos captured.`}
//         >
//           {/* Decorative inner: keep it, but don’t rely on it for accessibility */}
//           <View style={[styles.nameCardInner, { backgroundColor: colors.card }]} accessible={false}>
//             <AccessibleText style={[styles.nameText, { color: onCard }]}>
//               {personName}
//             </AccessibleText>

//             <AccessibleText style={[styles.countText, { color: onCard }]}>
//               {photosCount} photos captured
//             </AccessibleText>
//           </View>
//         </View>

//         {/* FIX: avoid too-light gray → use readable text */}
//         <AccessibleText style={[styles.description, { color: colors.text }]}>
//           Review completed. Tap below to save this person's profile.
//         </AccessibleText>

//         <AccessibleButton
//           onPress={handleSave}
//           accessibilityLabel={`Save profile for ${personName}`}
//           accessibilityHint="Save this person's registration data and return to the registration screen"
//           style={[styles.saveButton, { backgroundColor: colors.success, borderColor: colors.success }]}
//         >
//           <AccessibleText style={{ color: onSuccess, fontSize: 18, fontWeight: "700" }}>
//             Save Profile
//           </AccessibleText>
//         </AccessibleButton>
//       </View>
//     </View>
//   );
// };

// export default PersonReviewScreen;

// const styles = StyleSheet.create({
//   root: { flex: 1 },

//   header: {
//     height: 120,
//     borderBottomLeftRadius: 16,
//     borderBottomRightRadius: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     gap: 12,
//   },
//   headerTitle: { fontSize: 22, fontWeight: "700" },

//   backButton: {
//     width: 48,
//     height: 48,
//     minWidth: 48,
//     minHeight: 48,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingTop: 40,
//   },

//   nameCardOuter: {
//     borderRadius: 18,
//     borderWidth: 3,
//     padding: 4,
//     backgroundColor: "transparent",
//     marginBottom: 28,
//     width: "85%",
//     height: 120,
//   },
//   nameCardInner: {
//     borderRadius: 14,
//     paddingVertical: 20,
//     paddingHorizontal: 16,
//     alignItems: "center",
//   },
//   nameText: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
//   countText: { fontSize: 14 },

//   description: { fontSize: 14, textAlign: "center", marginBottom: 30 },

//   saveButton: {
//     height: 80,
//     borderRadius: 18,
//     borderWidth: 3,
//     alignItems: "center",
//     justifyContent: "center",
//     width: "85%",
//     minHeight: 56,
//   },
// });


import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { I18nManager, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { registerPerson } from "@/services/personRecognitionApi";

/** Choose readable text color (black/white) */
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
  success: "#22c55e",
  disabled: "#6b7280",
};

const PersonReviewScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();

  const hookColors = useAccessibleColors();
  const colors = useMemo(() => hookColors ?? FALLBACK_COLORS, [hookColors]);

  const params = useLocalSearchParams<{ name?: string; count?: string; imageUris?: string }>();
  const [isSaving, setIsSaving] = useState(false);

  const personName =
    (params.name ?? t("personReview.defaultName")).toString();
  const photosCount = Number(params.count ?? "5");

  // Parse image URIs
  const imageUrisString = params.imageUris?.toString() || "[]";
  let imageUris: string[] = [];
  try {
    imageUris = JSON.parse(imageUrisString);
  } catch (e) {
    console.error("Error parsing imageUris:", e);
  }

  const onPrimary = useMemo(() => onColor(colors.primary), [colors.primary]);
  const onCard = useMemo(() => onColor(colors.card), [colors.card]);
  const onSuccess = useMemo(() => onColor(colors.success), [colors.success]);

  /** Screen announcement */
  useEffect(() => {
    speak?.(
      t("personReview.announcement", {
        name: personName,
        count: String(photosCount),
      }),
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, personName, photosCount]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    hapticFeedback?.("medium");

    try {
      const result = await registerPerson(personName, imageUris);

      if (result?.success) {
        hapticFeedback?.("success");
        speak?.(t("personReview.saved", { name: personName }), true);
        router.replace("/person-registration" as any);
      } else {
        hapticFeedback?.("error");
        speak?.(
          result?.error || t("common.apiErrorBody"),
          true
        );
      }
    } catch (error) {
      hapticFeedback?.("error");
      speak?.(t("common.apiErrorBody"), true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Pressable
          onPress={() => {
            hapticFeedback?.("light");
            speak?.(t("personReview.backHint"), true);
            router.back();
          }}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          accessibilityHint={t("personReview.backHint")}
        >
          <Feather name="arrow-left" size={28} color={onPrimary} />
        </Pressable>

        <AccessibleText
          style={[styles.headerTitle, { color: onPrimary }]}
          accessibilityRole="header"
          level={1}
        >
          {t("personReview.title")}
        </AccessibleText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View
          style={[styles.nameCardOuter, { borderColor: colors.primary }]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={t("personReview.summary", {
            name: personName,
            count: String(photosCount),
          })}
        >
          <View style={[styles.nameCardInner, { backgroundColor: colors.card }]} accessible={false}>
            <AccessibleText style={[styles.nameText, { color: onCard }]}>
              {personName}
            </AccessibleText>

            <AccessibleText style={[styles.countText, { color: onCard }]}>
              {t("personReview.photos", { count: String(photosCount) })}
            </AccessibleText>
          </View>
        </View>

        <AccessibleText style={[styles.description, { color: colors.text }]}>
          {t("personReview.description")}
        </AccessibleText>

        <AccessibleButton
          onPress={handleSave}
          disabled={isSaving}
          accessibilityLabel={t("personReview.saveLabel", { name: personName })}
          accessibilityHint={t("personReview.saveHint")}
          style={[
            styles.saveButton,
            {
              backgroundColor: isSaving ? colors.disabled : colors.success,
              borderColor: isSaving ? colors.disabled : colors.success,
            },
          ]}
        >
          <AccessibleText style={{ color: onSuccess, fontSize: 18, fontWeight: "700" }}>
            {t("personReview.save")}
          </AccessibleText>
        </AccessibleButton>
      </View>
    </View>
  );
};

export default PersonReviewScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    height: 120,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },

  nameCardOuter: {
    borderRadius: 18,
    borderWidth: 3,
    padding: 4,
    marginBottom: 28,
    width: "85%",
    height: 120,
  },
  nameCardInner: {
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  nameText: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  countText: { fontSize: 14 },

  description: { fontSize: 14, textAlign: "center", marginBottom: 30 },

  saveButton: {
    height: 80,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    width: "85%",
    minHeight: 56,
  },
});
