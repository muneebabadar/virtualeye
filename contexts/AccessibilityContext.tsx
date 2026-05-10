// // import * as Haptics from "expo-haptics";
// // import * as Speech from "expo-speech";
// // import React, {
// //   createContext,
// //   ReactNode,
// //   useContext,
// //   useEffect,
// //   useState,
// // } from "react";
// // import { AccessibilityInfo } from "react-native";
// // import i18n from "@/src/i18n";
// // type HapticType =
// //   | "light"
// //   | "medium"
// //   | "heavy"
// //   | "success"
// //   | "error"
// //   | "warning";


// // interface AccessibilityContextType {
// //   speak: (text: string, immediate?: boolean) => void;
// //   stopSpeaking: () => void;
// //   isScreenReaderEnabled: boolean;
// //   hapticFeedback: (
// //     type?: "light" | "medium" | "heavy" | "success" | "error" | "warning"
// //   ) => void;
// //   isSpeaking: boolean;
// //   isHighContrastEnabled: boolean;
// //   toggleHighContrast: () => void;
// // }

// // const AccessibilityContext =
// //   createContext<AccessibilityContextType | undefined>(undefined);

// // export const AccessibilityProvider = ({
// //   children,
// // }: {
// //   children: ReactNode;
// // }) => {
// //   const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
// //   const [isSpeaking, setIsSpeaking] = useState(false);
// //   const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

// //   // Detect screen reader
// //   useEffect(() => {
// //     AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
// //   }, []);

// //   // 🔁 Stop speech whenever language changes (CRITICAL)
// //   useEffect(() => {
// //     Speech.stop();
// //     setIsSpeaking(false);
// //   }, [i18n.language]);

// //   const speak = async (text: string, immediate = false) => {
// //     if (!text) return;

// //     try {
// //       if (immediate) {
// //         await Speech.stop();
// //       }

// //       const langCode = i18n.language === "ur" ? "ur-PK" : "en-US";

// //       setIsSpeaking(true);

// //       Speech.speak(text, {
// //         language: langCode,
// //         rate: langCode === "ur-PK" ? 0.85 : 0.95,
// //         pitch: 1.0,
// //         onDone: () => setIsSpeaking(false),
// //         onStopped: () => setIsSpeaking(false),
// //         onError: () => setIsSpeaking(false),
// //       });
// //     } catch (e) {
// //       setIsSpeaking(false);
// //     }
// //   };

// //   const stopSpeaking = async () => {
// //     await Speech.stop();
// //     setIsSpeaking(false);
// //   };

// //   const toggleHighContrast = () => {
// //     setIsHighContrastEnabled((prev) => !prev);
// //   };
// // const hapticFeedback = (type: HapticType = "medium") => {
// //   const map: Record<HapticType, Haptics.ImpactFeedbackStyle> = {
// //     light: Haptics.ImpactFeedbackStyle.Light,
// //     medium: Haptics.ImpactFeedbackStyle.Medium,
// //     heavy: Haptics.ImpactFeedbackStyle.Heavy,
// //     success: Haptics.ImpactFeedbackStyle.Medium,
// //     error: Haptics.ImpactFeedbackStyle.Heavy,
// //     warning: Haptics.ImpactFeedbackStyle.Medium,
// //   };

// //   Haptics.impactAsync(map[type]);
// // };


// //   return (
// //     <AccessibilityContext.Provider
// //       value={{
// //         speak,
// //         stopSpeaking,
// //         isScreenReaderEnabled,
// //         hapticFeedback,
// //         isSpeaking,
// //         isHighContrastEnabled,
// //         toggleHighContrast,
// //       }}
// //     >
// //       {children}
// //     </AccessibilityContext.Provider>
// //   );
// // };

// // export const useAccessibility = () => {
// //   const ctx = useContext(AccessibilityContext);
// //   if (!ctx) {
// //     throw new Error("useAccessibility must be used within AccessibilityProvider");
// //   }
// //   return ctx;
// // };



// import * as Haptics from "expo-haptics";
// import * as Speech from "expo-speech";
// import React, {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useState,
// } from "react";
// import { AccessibilityInfo, Platform } from "react-native";
// import i18n from "@/src/i18n";

// type HapticType =
//   | "light"
//   | "medium"
//   | "heavy"
//   | "success"
//   | "error"
//   | "warning";

// interface AccessibilityContextType {
//   speak: (text: string, immediate?: boolean) => void;
//   stopSpeaking: () => void;
//   isScreenReaderEnabled: boolean;
//   hapticFeedback: (
//     type?: "light" | "medium" | "heavy" | "success" | "error" | "warning"
//   ) => void;
//   isSpeaking: boolean;
//   isHighContrastEnabled: boolean;
//   toggleHighContrast: () => void;
//   urduVoiceAvailable: boolean; // NEW: Track if Urdu is available
// }

// const AccessibilityContext =
//   createContext<AccessibilityContextType | undefined>(undefined);

// export const AccessibilityProvider = ({
//   children,
// }: {
//   children: ReactNode;
// }) => {
//   const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
//   const [urduVoiceAvailable, setUrduVoiceAvailable] = useState(false);

//   // 🔍 Check available voices on mount
//   useEffect(() => {
//     checkUrduVoiceAvailability();
//     AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
//   }, []);

//   // 🛑 Stop speech whenever language changes (CRITICAL)
//   useEffect(() => {
//     Speech.stop();
//     setIsSpeaking(false);
//   }, [i18n.language]);

//   /**
//    * 🔍 Check if Urdu voice is available on device
//    */
//   const checkUrduVoiceAvailability = async () => {
//     try {
//       const voices = await Speech.getAvailableVoicesAsync();
      
//       console.log("📢 Available TTS voices:", voices.length);
      
//       // Check for Urdu voices (ur-PK, ur-IN, or just "ur")
//       const hasUrdu = voices.some((voice) =>
//         voice.language.toLowerCase().startsWith("ur")
//       );

//       setUrduVoiceAvailable(hasUrdu);

//       if (!hasUrdu) {
//         console.warn("⚠️ No Urdu TTS voice found on device!");
//         console.log("Available languages:", 
//           [...new Set(voices.map(v => v.language))].slice(0, 20)
//         );
//       } else {
//         const urduVoices = voices.filter(v => 
//           v.language.toLowerCase().startsWith("ur")
//         );
//         console.log("✅ Urdu voices found:", urduVoices);
//       }
//     } catch (error) {
//       console.error("❌ Error checking voices:", error);
//       setUrduVoiceAvailable(false);
//     }
//   };

//   /**
//    * 🗣️ Speak text with improved Urdu support
//    */
//   const speak = async (text: string, immediate = false) => {
//     if (!text) return;

//     try {
//       if (immediate) {
//         await Speech.stop();
//       }

//       const isUrdu = i18n.language === "ur";
      
//       // 🎯 Better language code handling
//       let langCode = "en-US";
//       let voiceIdentifier: string | undefined = undefined;

//       if (isUrdu) {
//         if (!urduVoiceAvailable) {
//           console.warn("⚠️ Urdu voice not available, using transliteration fallback");
//           // You could transliterate Urdu text to Roman Urdu here if needed
//         }

//         // Try multiple Urdu locale codes
//         if (Platform.OS === "android") {
//           langCode = "ur-PK"; // Pakistani Urdu (primary)
//           // Android often needs explicit voice selection
//         } else if (Platform.OS === "ios") {
//           langCode = "ur-PK"; // iOS also supports ur-PK
//           // iOS might have specific voice identifiers
//         }
//       } else {
//         langCode = "en-US";
//       }

//       console.log(`🗣️ Speaking in ${langCode}: "${text.substring(0, 50)}..."`);

//       setIsSpeaking(true);

//       const speechOptions: Speech.SpeechOptions = {
//         language: langCode,
//         rate: isUrdu ? 0.75 : 0.95, // Slower rate for Urdu (better clarity)
//         pitch: 1.0,
//         onDone: () => {
//           setIsSpeaking(false);
//           console.log("✅ Speech completed");
//         },
//         onStopped: () => {
//           setIsSpeaking(false);
//           console.log("🛑 Speech stopped");
//         },
//         onError: (error) => {
//           setIsSpeaking(false);
//           console.error("❌ Speech error:", error);
//         },
//       };

//       // Add voice identifier if needed (for iOS)
//       if (voiceIdentifier) {
//         speechOptions.voice = voiceIdentifier;
//       }

//       Speech.speak(text, speechOptions);

//     } catch (e) {
//       console.error("❌ Speech exception:", e);
//       setIsSpeaking(false);
//     }
//   };

//   const stopSpeaking = async () => {
//     await Speech.stop();
//     setIsSpeaking(false);
//   };

//   const toggleHighContrast = () => {
//     setIsHighContrastEnabled((prev) => !prev);
//   };

//   const hapticFeedback = (type: HapticType = "medium") => {
//     const map: Record<HapticType, Haptics.ImpactFeedbackStyle> = {
//       light: Haptics.ImpactFeedbackStyle.Light,
//       medium: Haptics.ImpactFeedbackStyle.Medium,
//       heavy: Haptics.ImpactFeedbackStyle.Heavy,
//       success: Haptics.ImpactFeedbackStyle.Medium,
//       error: Haptics.ImpactFeedbackStyle.Heavy,
//       warning: Haptics.ImpactFeedbackStyle.Medium,
//     };

//     Haptics.impactAsync(map[type]);
//   };

//   return (
//     <AccessibilityContext.Provider
//       value={{
//         speak,
//         stopSpeaking,
//         isScreenReaderEnabled,
//         hapticFeedback,
//         isSpeaking,
//         isHighContrastEnabled,
//         toggleHighContrast,
//         urduVoiceAvailable,
//       }}
//     >
//       {children}
//     </AccessibilityContext.Provider>
//   );
// };

// export const useAccessibility = () => {
//   const ctx = useContext(AccessibilityContext);
//   if (!ctx) {
//     throw new Error("useAccessibility must be used within AccessibilityProvider");
//   }
//   return ctx;
// };

// // import * as Haptics from "expo-haptics";
// // import * as Speech from "expo-speech";
// // import React, {
// //   createContext,
// //   ReactNode,
// //   useContext,
// //   useEffect,
// //   useState,
// // } from "react";
// // import { AccessibilityInfo } from "react-native";
// // import i18n from "@/src/i18n";
// // type HapticType =
// //   | "light"
// //   | "medium"
// //   | "heavy"
// //   | "success"
// //   | "error"
// //   | "warning";


// // interface AccessibilityContextType {
// //   speak: (text: string, immediate?: boolean) => void;
// //   stopSpeaking: () => void;
// //   isScreenReaderEnabled: boolean;
// //   hapticFeedback: (
// //     type?: "light" | "medium" | "heavy" | "success" | "error" | "warning"
// //   ) => void;
// //   isSpeaking: boolean;
// //   isHighContrastEnabled: boolean;
// //   toggleHighContrast: () => void;
// // }

// // const AccessibilityContext =
// //   createContext<AccessibilityContextType | undefined>(undefined);

// // export const AccessibilityProvider = ({
// //   children,
// // }: {
// //   children: ReactNode;
// // }) => {
// //   const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
// //   const [isSpeaking, setIsSpeaking] = useState(false);
// //   const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

// //   // Detect screen reader
// //   useEffect(() => {
// //     AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
// //   }, []);

// //   // 🔁 Stop speech whenever language changes (CRITICAL)
// //   useEffect(() => {
// //     Speech.stop();
// //     setIsSpeaking(false);
// //   }, [i18n.language]);

// //   const speak = async (text: string, immediate = false) => {
// //     if (!text) return;

// //     try {
// //       if (immediate) {
// //         await Speech.stop();
// //       }

// //       const langCode = i18n.language === "ur" ? "ur-PK" : "en-US";

// //       setIsSpeaking(true);

// //       Speech.speak(text, {
// //         language: langCode,
// //         rate: langCode === "ur-PK" ? 0.85 : 0.95,
// //         pitch: 1.0,
// //         onDone: () => setIsSpeaking(false),
// //         onStopped: () => setIsSpeaking(false),
// //         onError: () => setIsSpeaking(false),
// //       });
// //     } catch (e) {
// //       setIsSpeaking(false);
// //     }
// //   };

// //   const stopSpeaking = async () => {
// //     await Speech.stop();
// //     setIsSpeaking(false);
// //   };

// //   const toggleHighContrast = () => {
// //     setIsHighContrastEnabled((prev) => !prev);
// //   };
// // const hapticFeedback = (type: HapticType = "medium") => {
// //   const map: Record<HapticType, Haptics.ImpactFeedbackStyle> = {
// //     light: Haptics.ImpactFeedbackStyle.Light,
// //     medium: Haptics.ImpactFeedbackStyle.Medium,
// //     heavy: Haptics.ImpactFeedbackStyle.Heavy,
// //     success: Haptics.ImpactFeedbackStyle.Medium,
// //     error: Haptics.ImpactFeedbackStyle.Heavy,
// //     warning: Haptics.ImpactFeedbackStyle.Medium,
// //   };

// //   Haptics.impactAsync(map[type]);
// // };


// //   return (
// //     <AccessibilityContext.Provider
// //       value={{
// //         speak,
// //         stopSpeaking,
// //         isScreenReaderEnabled,
// //         hapticFeedback,
// //         isSpeaking,
// //         isHighContrastEnabled,
// //         toggleHighContrast,
// //       }}
// //     >
// //       {children}
// //     </AccessibilityContext.Provider>
// //   );
// // };

// // export const useAccessibility = () => {
// //   const ctx = useContext(AccessibilityContext);
// //   if (!ctx) {
// //     throw new Error("useAccessibility must be used within AccessibilityProvider");
// //   }
// //   return ctx;
// // };



// // import * as Haptics from "expo-haptics";
// // import * as Speech from "expo-speech";
// // import React, {
// //   createContext,
// //   ReactNode,
// //   useContext,
// //   useEffect,
// //   useState,
// // } from "react";
// // import { AccessibilityInfo, Platform } from "react-native";
// // import i18n from "@/src/i18n";

// // type HapticType =
// //   | "light"
// //   | "medium"
// //   | "heavy"
// //   | "success"
// //   | "error"
// //   | "warning";

// // interface AccessibilityContextType {
// //   speak: (text: string, immediate?: boolean) => void;
// //   stopSpeaking: () => void;
// //   isScreenReaderEnabled: boolean;
// //   hapticFeedback: (
// //     type?: "light" | "medium" | "heavy" | "success" | "error" | "warning"
// //   ) => void;
// //   isSpeaking: boolean;
// //   isHighContrastEnabled: boolean;
// //   toggleHighContrast: () => void;
// //   urduVoiceAvailable: boolean; // NEW: Track if Urdu is available
// // }

// // const AccessibilityContext =
// //   createContext<AccessibilityContextType | undefined>(undefined);

// // export const AccessibilityProvider = ({
// //   children,
// // }: {
// //   children: ReactNode;
// // }) => {
// //   const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
// //   const [isSpeaking, setIsSpeaking] = useState(false);
// //   const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
// //   const [urduVoiceAvailable, setUrduVoiceAvailable] = useState(false);

// //   // 🔍 Check available voices on mount
// //   useEffect(() => {
// //     checkUrduVoiceAvailability();
// //     AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
// //   }, []);

// //   // 🛑 Stop speech whenever language changes (CRITICAL)
// //   useEffect(() => {
// //     Speech.stop();
// //     setIsSpeaking(false);
// //   }, [i18n.language]);

// //   /**
// //    * 🔍 Check if Urdu voice is available on device
// //    */
// //   const checkUrduVoiceAvailability = async () => {
// //     try {
// //       const voices = await Speech.getAvailableVoicesAsync();
      
// //       console.log("📢 Available TTS voices:", voices.length);
      
// //       // Check for Urdu voices (ur-PK, ur-IN, or just "ur")
// //       const hasUrdu = voices.some((voice) =>
// //         voice.language.toLowerCase().startsWith("ur")
// //       );

// //       setUrduVoiceAvailable(hasUrdu);

// //       if (!hasUrdu) {
// //         console.warn("⚠️ No Urdu TTS voice found on device!");
// //         console.log("Available languages:", 
// //           [...new Set(voices.map(v => v.language))].slice(0, 20)
// //         );
// //       } else {
// //         const urduVoices = voices.filter(v => 
// //           v.language.toLowerCase().startsWith("ur")
// //         );
// //         console.log("✅ Urdu voices found:", urduVoices);
// //       }
// //     } catch (error) {
// //       console.error("❌ Error checking voices:", error);
// //       setUrduVoiceAvailable(false);
// //     }
// //   };

// //   /**
// //    * 🗣️ Speak text with improved Urdu support
// //    */
// //   const speak = async (text: string, immediate = false) => {
// //     if (!text) return;

// //     try {
// //       if (immediate) {
// //         await Speech.stop();
// //       }

// //       const isUrdu = i18n.language === "ur";
      
// //       // 🎯 Better language code handling
// //       let langCode = "en-US";
// //       let voiceIdentifier: string | undefined = undefined;

// //       if (isUrdu) {
// //         if (!urduVoiceAvailable) {
// //           console.warn("⚠️ Urdu voice not available, using transliteration fallback");
// //           // You could transliterate Urdu text to Roman Urdu here if needed
// //         }

// //         // Try multiple Urdu locale codes
// //         if (Platform.OS === "android") {
// //           langCode = "ur-PK"; // Pakistani Urdu (primary)
// //           // Android often needs explicit voice selection
// //         } else if (Platform.OS === "ios") {
// //           langCode = "ur-PK"; // iOS also supports ur-PK
// //           // iOS might have specific voice identifiers
// //         }
// //       } else {
// //         langCode = "en-US";
// //       }

// //       console.log(`🗣️ Speaking in ${langCode}: "${text.substring(0, 50)}..."`);

// //       setIsSpeaking(true);

// //       const speechOptions: Speech.SpeechOptions = {
// //         language: langCode,
// //         rate: isUrdu ? 0.75 : 0.95, // Slower rate for Urdu (better clarity)
// //         pitch: 1.0,
// //         onDone: () => {
// //           setIsSpeaking(false);
// //           console.log("✅ Speech completed");
// //         },
// //         onStopped: () => {
// //           setIsSpeaking(false);
// //           console.log("🛑 Speech stopped");
// //         },
// //         onError: (error) => {
// //           setIsSpeaking(false);
// //           console.error("❌ Speech error:", error);
// //         },
// //       };

// //       // Add voice identifier if needed (for iOS)
// //       if (voiceIdentifier) {
// //         speechOptions.voice = voiceIdentifier;
// //       }

// //       Speech.speak(text, speechOptions);

// //     } catch (e) {
// //       console.error("❌ Speech exception:", e);
// //       setIsSpeaking(false);
// //     }
// //   };

// //   const stopSpeaking = async () => {
// //     await Speech.stop();
// //     setIsSpeaking(false);
// //   };

// //   const toggleHighContrast = () => {
// //     setIsHighContrastEnabled((prev) => !prev);
// //   };

// //   const hapticFeedback = (type: HapticType = "medium") => {
// //     const map: Record<HapticType, Haptics.ImpactFeedbackStyle> = {
// //       light: Haptics.ImpactFeedbackStyle.Light,
// //       medium: Haptics.ImpactFeedbackStyle.Medium,
// //       heavy: Haptics.ImpactFeedbackStyle.Heavy,
// //       success: Haptics.ImpactFeedbackStyle.Medium,
// //       error: Haptics.ImpactFeedbackStyle.Heavy,
// //       warning: Haptics.ImpactFeedbackStyle.Medium,
// //     };

// //     Haptics.impactAsync(map[type]);
// //   };

// //   return (
// //     <AccessibilityContext.Provider
// //       value={{
// //         speak,
// //         stopSpeaking,
// //         isScreenReaderEnabled,
// //         hapticFeedback,
// //         isSpeaking,
// //         isHighContrastEnabled,
// //         toggleHighContrast,
// //         urduVoiceAvailable,
// //       }}
// //     >
// //       {children}
// //     </AccessibilityContext.Provider>
// //   );
// // };

// // export const useAccessibility = () => {
// //   const ctx = useContext(AccessibilityContext);
// //   if (!ctx) {
// //     throw new Error("useAccessibility must be used within AccessibilityProvider");
// //   }
// //   return ctx;
// // };

// import * as Haptics from "expo-haptics";
// import * as Speech from "expo-speech";
// import React, {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useRef,
//   useState,
// } from "react";
// import { AccessibilityInfo, Platform } from "react-native";
// import i18n from "@/src/i18n";

// type HapticType =
//   | "light"
//   | "medium"
//   | "heavy"
//   | "success"
//   | "error"
//   | "warning";

// interface AccessibilityContextType {
//   speak: (text: string, immediate?: boolean) => void;
//   stopSpeaking: () => void;
//   isScreenReaderEnabled: boolean;
//   hapticFeedback: (type?: HapticType) => void;
//   isSpeaking: boolean;
//   isHighContrastEnabled: boolean;
//   toggleHighContrast: () => void;
//   urduVoiceAvailable: boolean;
// }

// const AccessibilityContext =
//   createContext<AccessibilityContextType | undefined>(undefined);

// export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
//   const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
//   const [urduVoiceAvailable, setUrduVoiceAvailable] = useState(false);

//   // Use a ref so speak() always sees the latest value without re-creating itself
//   const screenReaderRef = useRef(false);

//   // ─── Screen reader detection ───────────────────────────────────────────────
//   useEffect(() => {
//     AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
//       setIsScreenReaderEnabled(enabled);
//       screenReaderRef.current = enabled;
//     });

//     const sub = AccessibilityInfo.addEventListener(
//       "screenReaderChanged",
//       (enabled) => {
//         setIsScreenReaderEnabled(enabled);
//         screenReaderRef.current = enabled;
//       }
//     );

//     return () => sub.remove();
//   }, []);

//   // ─── Voice availability check ──────────────────────────────────────────────
//   useEffect(() => {
//     checkUrduVoiceAvailability();
//   }, []);

//   // ─── Stop speech on language switch ───────────────────────────────────────
//   // This prevents old-language audio from bleeding into new-language UI
//   useEffect(() => {
//     Speech.stop();
//     setIsSpeaking(false);
//   }, [i18n.language]);

//   const checkUrduVoiceAvailability = async () => {
//     try {
//       const voices = await Speech.getAvailableVoicesAsync();
//       const hasUrdu = voices.some((v) =>
//         v.language.toLowerCase().startsWith("ur")
//       );
//       setUrduVoiceAvailable(hasUrdu);

//       if (!hasUrdu) {
//         console.warn(
//           "[TTS] No Urdu voice on device. Available languages:",
//           [...new Set(voices.map((v) => v.language))].slice(0, 20)
//         );
//       }
//     } catch (e) {
//       console.error("[TTS] Voice check failed:", e);
//       setUrduVoiceAvailable(false);
//     }
//   };

//   /**
//    * speak()
//    *
//    * KEY RULE: When TalkBack/VoiceOver is active we SKIP custom TTS entirely.
//    * TalkBack already reads accessibilityRole="alert" elements and
//    * accessibilityLabel strings — firing expo-speech on top causes two voices
//    * talking simultaneously.
//    *
//    * ONLY call speak() for detection results and mode announcements that are
//    * NOT already covered by a native accessibility label on a visible element.
//    */
//   const speak = async (text: string, immediate = false) => {
//     if (!text) return;

//     // ── TalkBack clash prevention ─────────────────────────────────────────
//     if (screenReaderRef.current) {
//       // TalkBack is on → let it handle UI element announcements.
//       // We still allow speak() for detection results (object names, currency)
//       // because those are audio-only — no visible element announces them.
//       // The caller must decide; we provide the escape hatch here as a comment.
//       // If you want to block ALL custom TTS when TalkBack is on, uncomment:
//       // return;
//     }

//     try {
//       if (immediate) {
//         // Stop any previous speech before starting new one.
//         // await ensures the stop is processed before speak begins.
//         await Speech.stop();
//       }

//       const isUrdu = i18n.language === "ur";

//       // ── Language code selection ───────────────────────────────────────
//       // ur-PK is the correct BCP-47 tag for Pakistani Urdu.
//       // Both Android and iOS support it if the voice pack is installed.
//       // On Android the voice pack must be downloaded in Settings → TTS.
//       const langCode = isUrdu ? "ur-PK" : "en-US";

//       // ── Rate tuning ───────────────────────────────────────────────────
//       // Urdu TTS engines tend to rush nastaliq text; 0.75 keeps it clear.
//       // en-US at 0.95 feels natural for detection announcements.
//       const rate = isUrdu ? 0.75 : 0.95;

//       setIsSpeaking(true);

//       Speech.speak(text, {
//         language: langCode,
//         rate,
//         pitch: 1.0,
//         onDone: () => setIsSpeaking(false),
//         onStopped: () => setIsSpeaking(false),
//         onError: () => setIsSpeaking(false),
//       });
//     } catch (e) {
//       console.error("[TTS] speak() threw:", e);
//       setIsSpeaking(false);
//     }
//   };

//   const stopSpeaking = async () => {
//     await Speech.stop();
//     setIsSpeaking(false);
//   };

//   const toggleHighContrast = () => setIsHighContrastEnabled((p) => !p);

//   const hapticFeedback = (type: HapticType = "medium") => {
//     // "success" and "error" use notification feedback for stronger distinction
//     if (type === "success" || type === "error" || type === "warning") {
//       const notifMap: Record<string, Haptics.NotificationFeedbackType> = {
//         success: Haptics.NotificationFeedbackType.Success,
//         error: Haptics.NotificationFeedbackType.Error,
//         warning: Haptics.NotificationFeedbackType.Warning,
//       };
//       Haptics.notificationAsync(notifMap[type]);
//     } else {
//       const impactMap: Record<string, Haptics.ImpactFeedbackStyle> = {
//         light: Haptics.ImpactFeedbackStyle.Light,
//         medium: Haptics.ImpactFeedbackStyle.Medium,
//         heavy: Haptics.ImpactFeedbackStyle.Heavy,
//       };
//       Haptics.impactAsync(impactMap[type]);
//     }
//   };

//   return (
//     <AccessibilityContext.Provider
//       value={{
//         speak,
//         stopSpeaking,
//         isScreenReaderEnabled,
//         hapticFeedback,
//         isSpeaking,
//         isHighContrastEnabled,
//         toggleHighContrast,
//         urduVoiceAvailable,
//       }}
//     >
//       {children}
//     </AccessibilityContext.Provider>
//   );
// };

// export const useAccessibility = () => {
//   const ctx = useContext(AccessibilityContext);
//   if (!ctx) {
//     throw new Error("useAccessibility must be used within AccessibilityProvider");
//   }
//   return ctx;
// };



//FOR QURBA TTS
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo } from "react-native";
import i18n from "@/src/i18n";

type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning";

interface AccessibilityContextType {
  speak: (text: string, immediate?: boolean) => void;
  stopSpeaking: () => void;
  isScreenReaderEnabled: boolean;
  hapticFeedback: (type?: HapticType) => void;
  isSpeaking: boolean;
  isHighContrastEnabled: boolean;
  toggleHighContrast: () => void;
  urduVoiceAvailable: boolean;
}

const AccessibilityContext =
  createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [urduVoiceAvailable, setUrduVoiceAvailable] = useState(false);

  const screenReaderRef = useRef(false);
  // Keep a ref so speak() can check without a stale closure
  const urduVoiceRef = useRef(false);

  // ─── Screen reader detection ─────────────────────────────────────────────
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
      screenReaderRef.current = enabled;
    });

    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
        screenReaderRef.current = enabled;
      }
    );

    return () => sub.remove();
  }, []);

  // ─── Voice availability check on mount ──────────────────────────────────
  useEffect(() => {
    checkUrduVoiceAvailability();
  }, []);

  // ─── Stop speech on language switch ─────────────────────────────────────
  useEffect(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, [i18n.language]);

  const checkUrduVoiceAvailability = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const hasUrdu = voices.some((v) =>
        v.language.toLowerCase().startsWith("ur")
      );
      setUrduVoiceAvailable(hasUrdu);
      urduVoiceRef.current = hasUrdu;

      if (!hasUrdu) {
        // Informational only — Urdu TTS is handled by OpenAI in screens
        // that need it (e.g. CurrencyReaderScreen). No action needed here.
        console.log(
          "[TTS] No Urdu voice on device — OpenAI TTS will be used instead."
        );
      }
    } catch (e) {
      console.error("[TTS] Voice check failed:", e);
      setUrduVoiceAvailable(false);
      urduVoiceRef.current = false;
    }
  };

  /**
   * speak()
   *
   * Speaks text via the device's native TTS engine.
   *
   * URDU RULE: If the current language is Urdu and no Urdu voice is installed
   * on the device, this function silently returns without attempting speech.
   * Screens that need Urdu audio (e.g. CurrencyReaderScreen) use OpenAI TTS
   * directly and should NOT call speak() in Urdu mode.
   *
   * ENGLISH: Always proceeds normally via expo-speech.
   */
  const speak = async (text: string, immediate = false) => {
    if (!text) return;

    const isUrdu = i18n.language === "ur";

    // ── Urdu guard ────────────────────────────────────────────────────────
    // If no Urdu voice is installed, silently bail out.
    // Calling Speech.speak() with ur-PK and no installed voice produces
    // silence or a garbled fallback — better to do nothing and let
    // the OpenAI TTS pipeline in the calling screen handle it.
    if (isUrdu && !urduVoiceRef.current) {
      return;
    }

    try {
      // ← Always stop previous speech, not just when immediate=true
      await Speech.stop();
      setIsSpeaking(false);

      const langCode = isUrdu ? "ur-PK" : "en-US";
      const rate = isUrdu ? 0.75 : 0.95;

      setIsSpeaking(true);

      Speech.speak(text, {
        language: langCode,
        rate,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (e) {
      console.error("[TTS] speak() threw:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    await Speech.stop();
    setIsSpeaking(false);
  };

  const toggleHighContrast = () => setIsHighContrastEnabled((p) => !p);

  const hapticFeedback = (type: HapticType = "medium") => {
    if (type === "success" || type === "error" || type === "warning") {
      const notifMap: Record<string, Haptics.NotificationFeedbackType> = {
        success: Haptics.NotificationFeedbackType.Success,
        error: Haptics.NotificationFeedbackType.Error,
        warning: Haptics.NotificationFeedbackType.Warning,
      };
      Haptics.notificationAsync(notifMap[type]);
    } else {
      const impactMap: Record<string, Haptics.ImpactFeedbackStyle> = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(impactMap[type]);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        speak,
        stopSpeaking,
        isScreenReaderEnabled,
        hapticFeedback,
        isSpeaking,
        isHighContrastEnabled,
        toggleHighContrast,
        urduVoiceAvailable,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error(
      "useAccessibility must be used within AccessibilityProvider"
    );
  }
  return ctx;
};