// import { AccessibleButton } from "@/components/AccessibleButton";
// import { AccessibleText } from "@/components/AccessibleText";
// import { useAccessibility } from "@/contexts/AccessibilityContext";
// import { useAccessibleColors } from "@/hooks/useAccessibleColors";
// import { Feather } from "@expo/vector-icons";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useTranslation } from "react-i18next";
// import React, { useRef, useState } from "react";
// import {
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   View,
// } from "react-native";
// import { registerPerson } from "@/services/personRecognitionApi";
// import i18n from "../src/i18n";
// import { Audio } from "expo-av";

// const PersonNameScreen = () => {
//   const router = useRouter();
//   const { t } = useTranslation();
//   const { hapticFeedback } = useAccessibility();
//   const colors = useAccessibleColors();
//   const params = useLocalSearchParams<{ count?: string; imageUris?: string }>();

//   const [name, setName] = useState("");
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);
//   const [isRecording, setIsRecording] = useState(false);

//   const OPENAI_API_KEY =
//   process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
//   const inputRef = useRef<TextInput | null>(null);

//   // Parse image URIs
//   const imageUrisString = params.imageUris?.toString() || "[]";
//   let imageUris: string[] = [];
//   try {
//     imageUris = JSON.parse(imageUrisString);
//   } catch (e) {
//     console.error("Error parsing imageUris:", e);
//   }

//   // useEffect(() => {
//   //   speak?.(t("personName.announcement"), true);
//   // }, []);

//   // const handleContinue = () => {
//   const handleContinue = async () => {
//     const trimmed = name.trim();

//     if (!trimmed) {
//       // speak?.(t("personName.emptyError"), true);
//       hapticFeedback?.("error");
//       inputRef.current?.focus?.();
//       return;
//     }

//     hapticFeedback?.("medium");
//     // speak?.(t("personName.saving", { name: trimmed }), true);

//     // router.replace({
//     //   pathname: "/person-review",
//     //   params: {
//     //     name: trimmed,
//     //     count: params.count || "5",
//     //     imageUris: JSON.stringify(imageUris),
//     //   },
//     // } as any);
//     const result = await registerPerson(trimmed, imageUris);

//     if (result?.success) {
//       hapticFeedback?.("success");
//       router.replace("/features");
//     } else {
//       hapticFeedback?.("error");
//       inputRef.current?.focus?.();
//     }
//   };
// const handleMicPress = async () => {
//   try {
//     if (!OPENAI_API_KEY) {
//       console.log("Missing OpenAI API Key");
//       return;
//     }

//     if (!isRecording) {
//       const permission = await Audio.requestPermissionsAsync();

//       if (!permission.granted) {
//         console.log("Mic permission denied");
//         return;
//       }

//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });

//       const rec = new Audio.Recording();

//       await rec.prepareToRecordAsync(
//         Audio.RecordingOptionsPresets.HIGH_QUALITY
//       );

//       await rec.startAsync();

//       setRecording(rec);
//       setIsRecording(true);

//       hapticFeedback?.("medium");

//       return;
//     }

//     if (!recording) return;

//     setIsRecording(false);

//     await recording.stopAndUnloadAsync();

//     const uri = recording.getURI();

//     setRecording(null);

//     if (!uri) return;

//     const formData = new FormData();

//     formData.append("file", {
//       uri,
//       name: "speech.m4a",
//       type: "audio/m4a",
//     } as any);

//     formData.append("model", "whisper-1");
//     formData.append(
//       "language",
//       i18n.language === "ur" ? "ur" : "en"
//     );

//     const response = await fetch(
//       "https://api.openai.com/v1/audio/transcriptions",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//         },
//         body: formData,
//       }
//     );

//     const data = await response.json();

//     const spokenText = data?.text?.trim();

//     if (spokenText) {
//       setName(spokenText);
//       hapticFeedback?.("success");
//     }
//   } catch (error) {
//     console.log("Mic Error:", error);
//     setIsRecording(false);
//     setRecording(null);
//   }
// };
//   return (
//     <KeyboardAvoidingView
//       style={[styles.root, { backgroundColor: colors.background }]}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* HEADER */}
//         <View style={[styles.header, { backgroundColor: colors.primary }]}>
//           <Pressable
//             onPress={() => {
//               hapticFeedback?.("light");
//               // speak?.(t("common.back"), true);
//               router.back();
//             }}
//             style={styles.backButton}
//             hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//             accessible
//             accessibilityRole="button"
//             accessibilityLabel={t("common.back")}
//             accessibilityHint={t("personName.backHint")}
//           >
//             <Feather name="arrow-left" size={28} color={colors.textInverse} />
//           </Pressable>

//           <AccessibleText
//             style={[styles.headerTitle, { color: colors.textInverse }]}
//             accessibilityRole="header"
//             level={1}
//           >
//             {t("personRegistration.title")}
//           </AccessibleText>
//         </View>

//         {/* CONTENT */}
//         <View style={styles.content}>
//           <AccessibleText
//             style={[styles.title, { color: colors.text }]}
//             accessibilityRole="header"
//             level={2}
//           >
//             {t("personName.title")}
//           </AccessibleText>

//           <AccessibleText
//             nativeID="personNameLabel"
//             style={[styles.subtitle, { color: colors.text }]}
//             accessibilityRole="text"
//           >
//             {t("personName.instruction")}
//           </AccessibleText>

//           <View
//             style={[
//               styles.inputWrapper,
//               { borderColor: colors.border, backgroundColor: colors.card },
//             ]}
//           >
//             <TextInput
//               ref={inputRef}
//               style={[styles.input, { color: colors.text }]}
//               placeholder={t("personName.placeholder")}
//               placeholderTextColor={colors.secondary}
//               value={name}
//               onChangeText={setName}
//               accessibilityLabelledBy="personNameLabel"
//               accessibilityLabel={t("personName.placeholder")}
//               accessibilityHint={t("personName.instruction")}
//               autoCapitalize="words"
//               returnKeyType="done"
//               onSubmitEditing={handleContinue}
//             />
//           </View>

//           {/* <AccessibleButton
//             title={t("personName.continue")}
//             onPress={handleContinue}
//             accessibilityLabel={t("personName.continue")}
//             accessibilityHint={t("personReview.saveHint")}
//             style={styles.button}
//           /> */}
//           {/* <AccessibleButton
//           title="Save Person"
//           onPress={handleContinue}
//           accessibilityLabel="Save person"
//           accessibilityHint="Saves the registered person"
//           style={styles.button}
//         /> */}
//         {/* <AccessibleButton
//             title={i18n.language === "ur" ? "محفوظ کریں" : "Save Person"}
//             onPress={handleContinue}
//             accessibilityLabel={
//               i18n.language === "ur" ? "محفوظ کریں" : "Save person"
//             }
//             accessibilityHint={
//               i18n.language === "ur"
//                 ? "رجسٹر شدہ شخص کو محفوظ کرتا ہے"
//                 : "Saves the registered person"
//             }
//             style={styles.button}
//           /> */}
//           <AccessibleButton
//             title={
//               isRecording
//                 ? i18n.language === "ur"
//                   ? "ریکارڈنگ بند کریں"
//                   : "Stop Recording"
//                 : i18n.language === "ur"
//                 ? "مائیک سے نام بولیں"
//                 : "Speak Name"
//             }
//             onPress={handleMicPress}
//             accessibilityLabel="Mic input"
//             accessibilityHint="Speak the person's name"
//             style={[
//               styles.button,
//               {
//                 marginBottom: 18,
//                 backgroundColor: colors.card,
//                 borderWidth: 2,
//                 borderColor: colors.border,
//               },
//             ]}
//           />
//           <AccessibleButton
//             title={i18n.language === "ur" ? "محفوظ کریں" : "Save Person"}
//             onPress={handleContinue}
//             accessibilityLabel={
//               i18n.language === "ur" ? "محفوظ کریں" : "Save person"
//             }
//             accessibilityHint={
//               i18n.language === "ur"
//                 ? "رجسٹر شدہ شخص کو محفوظ کرتا ہے"
//                 : "Saves the registered person"
//             }
//             style={styles.button}
//           />
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// export default PersonNameScreen;

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   scrollContent: { paddingBottom: 40 },

//   header: {
//     height: 120,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     gap: 14,
//   },
//   headerTitle: { fontSize: 24, fontWeight: "700" },

//   backButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   content: {
//     flex: 1,
//     justifyContent: "center",
//     paddingHorizontal: 24,
//     paddingTop: 30,
//   },

//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//     textAlign: "center",
//     marginBottom: 10,
//   },

//   subtitle: {
//     fontSize: 18,
//     textAlign: "center",
//     marginBottom: 20,
//   },

//   inputWrapper: {
//     borderRadius: 14,
//     borderWidth: 2,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 30,
//   },

//   input: {
//     height: 50,
//     fontSize: 20,
//   },

//   button: {
//     height: 80,
//     borderRadius: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     marginHorizontal: 6,
//   },
// });

import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { registerPerson } from "@/services/personRecognitionApi";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import i18n from "../src/i18n";

const PersonNameScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const params = useLocalSearchParams<{ count?: string; imageUris?: string }>();

  const [name, setName] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const inputRef = useRef<TextInput | null>(null);

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";

  const imageUrisString = params.imageUris?.toString() || "[]";
  let imageUris: string[] = [];

  try {
    imageUris = JSON.parse(imageUrisString);
  } catch (e) {
    console.error("Error parsing imageUris:", e);
  }

  const handleContinue = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      hapticFeedback?.("error");
      inputRef.current?.focus?.();
      return;
    }

    hapticFeedback?.("medium");

    const result = await registerPerson(trimmed, imageUris);

    if (result?.success) {
      hapticFeedback?.("success");
      router.replace("/features");
    } else {
      hapticFeedback?.("error");
      inputRef.current?.focus?.();
    }
  };

  const handleMicPress = async () => {
    try {
      if (!OPENAI_API_KEY) {
        console.log("Missing OpenAI API Key");
        hapticFeedback?.("error");
        return;
      }

      if (!isRecording) {
        const permission = await Audio.requestPermissionsAsync();

        if (!permission.granted) {
          console.log("Mic permission denied");
          hapticFeedback?.("error");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const rec = new Audio.Recording();

        await rec.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        await rec.startAsync();

        setRecording(rec);
        setIsRecording(true);
        hapticFeedback?.("medium");

        return;
      }

      if (!recording) return;

      setIsRecording(false);
      setIsTranscribing(true);

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setIsTranscribing(false);
        return;
      }

      const formData = new FormData();

      formData.append("file", {
        uri,
        name: "speech.m4a",
        type: "audio/m4a",
      } as any);

      formData.append("model", "whisper-1");
      formData.append("language", i18n.language === "ur" ? "ur" : "en");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("OpenAI transcription error:", data);
        hapticFeedback?.("error");
        setIsTranscribing(false);
        return;
      }

      const spokenText = data?.text?.trim();

      if (spokenText) {
        setName(spokenText);
        hapticFeedback?.("success");
      } else {
        hapticFeedback?.("error");
      }

      setIsTranscribing(false);
    } catch (error) {
      console.log("Mic Error:", error);
      setIsRecording(false);
      setIsTranscribing(false);
      setRecording(null);
      hapticFeedback?.("error");
    }
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
          <Pressable
            onPress={() => {
              hapticFeedback?.("light");
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

          <Pressable
            onPress={handleMicPress}
            disabled={isTranscribing}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording
                ? "Stop recording name"
                : "Speak name using microphone"
            }
            accessibilityHint="Records your voice and fills the name field"
            style={[
              styles.micContainer,
              {
                borderColor: isRecording ? "#ef4444" : colors.border,
                backgroundColor: colors.card,
                opacity: isTranscribing ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.micCircle,
                {
                  backgroundColor: isRecording ? "#fee2e2" : "#f3f4f6",
                  borderColor: isRecording ? "#ef4444" : "#d1d5db",
                },
              ]}
            >
              {isTranscribing ? (
                <ActivityIndicator size="large" />
              ) : (
                <Feather
                  name="mic"
                  size={46}
                  color={isRecording ? "#ef4444" : "#111827"}
                />
              )}
            </View>

            <AccessibleText
              style={[
                styles.micText,
                { color: isRecording ? "#ef4444" : colors.text },
              ]}
            >
              {isTranscribing
                ? i18n.language === "ur"
                  ? "نام سمجھا جا رہا ہے..."
                  : "Converting speech..."
                : isRecording
                ? i18n.language === "ur"
                  ? "روکنے کے لیے دبائیں"
                  : "Tap to stop"
                : i18n.language === "ur"
                ? "مائیک سے نام بولیں"
                : "Speak Name"}
            </AccessibleText>
          </Pressable>

          <AccessibleButton
            title={i18n.language === "ur" ? "محفوظ کریں" : "Save Person"}
            onPress={handleContinue}
            accessibilityLabel={
              i18n.language === "ur" ? "محفوظ کریں" : "Save person"
            }
            accessibilityHint={
              i18n.language === "ur"
                ? "رجسٹر شدہ شخص کو محفوظ کرتا ہے"
                : "Saves the registered person"
            }
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

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },

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
    marginBottom: 26,
  },

  input: {
    height: 50,
    fontSize: 20,
  },

  micContainer: {
    height: 130,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    marginBottom: 22,
  },

  micCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  micText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  button: {
    height: 80,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
});