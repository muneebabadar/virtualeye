// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { CameraView, useCameraPermissions } from "expo-camera";
// import { useTranslation } from "react-i18next";

// // import { detectColor, checkApiHealth } from "../services/detectionApi";
// import { detectClothesWithColor, checkApiHealth } from "../services/detectionApi";
// import { useAccessibility } from "@/contexts/AccessibilityContext";
// import { useAccessibleColors } from "@/hooks/useAccessibleColors";
// import { AccessibleText } from "@/components/AccessibleText";
// import { AccessibleButton } from "@/components/AccessibleButton";

// type ApiColorResult =
//   | {
//       success: true;
//       data: { name: string; hex: string };
//     }
//   | {
//       success: false;
//       message?: string;
//     };

// const FALLBACK_COLORS = {
//   background: "#000000",
//   primary: "#1f2937",
//   text: "#ffffff",
//   textInverse: "#ffffff",
//   card: "#111827",
//   success: "#22c55e",
//   danger: "#ef4444",
//   warning: "#f59e0b",
//   disabled: "#6b7280",
// };

// export default function ColorIdentificationScreen() {
//   const router = useRouter();
//   const { t, i18n } = useTranslation();
//   const { speak, hapticFeedback } = useAccessibility();

//   // ✅ Prevent crash if hook returns undefined temporarily
//   const hookColors = useAccessibleColors();
//   const colors = useMemo(() => hookColors ?? FALLBACK_COLORS, [hookColors]);

//   const [permission, requestPermission] = useCameraPermissions();

//   const [apiConnected, setApiConnected] = useState(false);
//   const [checkingApi, setCheckingApi] = useState(false);

//   const [isDetecting, setIsDetecting] = useState(false);
//   const [isAutoDetecting, setIsAutoDetecting] = useState(false);

//   const [detectedColor, setDetectedColor] = useState("");
//   const [colorHex, setColorHex] = useState("");

//   const cameraRef = useRef<CameraView>(null);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const lastSpokenRef = useRef<string>("");

//   // ----------------------------
//   // Announce screen + check API
//   // ----------------------------
//   useEffect(() => {
//     // announce on language change too
//     speak?.(t("color.announcement", "Color Identification mode."), true);
//     void checkConnection();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [i18n.language]);

//   // ----------------------------
//   // Auto-detect loop
//   // ----------------------------
//   useEffect(() => {
//     if (isAutoDetecting && apiConnected) {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       intervalRef.current = setInterval(() => {
//         void captureColor();
//       }, 2000);
//     } else {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isAutoDetecting, apiConnected]);

//   // ----------------------------
//   // API health
//   // ----------------------------
//   const checkConnection = async () => {
//     setCheckingApi(true);
//     try {
//       const ok = await checkApiHealth();
//       setApiConnected(ok);

//       if (!ok) {
//         Alert.alert(
//           t("common.apiErrorTitle", "API Not Connected"),
//           t(
//             "common.apiErrorBody",
//             "Cannot connect to detection server. Make sure:\n1. FastAPI server is running\n2. Both devices are on same WiFi\n3. IP address is correct in detectionApi"
//           )
//         );
//       }
//     } catch (e) {
//       setApiConnected(false);
//       Alert.alert(
//         t("common.apiErrorTitle", "API Not Connected"),
//         t(
//           "common.apiErrorBody",
//           "Cannot connect to detection server. Make sure the server is running and IP is correct."
//         )
//       );
//     } finally {
//       setCheckingApi(false);
//     }
//   };

//   // ----------------------------
//   // Capture & detect
//   // ----------------------------
//   const captureColor = async () => {
//     if (!apiConnected) return;
//     if (!permission?.granted) return;
//     if (!cameraRef.current) return;
//     if (isDetecting) return;

//     setIsDetecting(true);

//     try {
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.5,
//         base64: false,
//         exif: false,
//         shutterSound: false,
//       });

//       if (!photo?.uri) throw new Error("Failed to capture photo");

//       // const result = (await detectColor(photo.uri)) as ApiColorResult;
//       const result = await detectClothesWithColor(photo.uri, 0.25);

//       if (result?.success && result.data) {
//         const name = (result.data.name ?? "").trim();
//         const hex = (result.data.hex ?? "").trim();

//         if (!name) return;

//         setDetectedColor(name);
//         setColorHex(hex);

//         // Speak only when changed
//         const spokenKey = `${name.toLowerCase()}|${hex.toLowerCase()}`;
//         if (lastSpokenRef.current !== spokenKey) {
//           lastSpokenRef.current = spokenKey;
//           hapticFeedback?.("success");
//           speak?.(t("color.detected", "Detected {{color}}", { color: name }), true);
//         }
//       } else {
//         // If not success, don't spam alerts during auto mode
//         if (!isAutoDetecting) {
//           hapticFeedback?.("error");
//           speak?.(t("color.failed", "Detection failed. Please try again."), true);
//         }
//       }
//     } catch (err) {
//       if (!isAutoDetecting) {
//         hapticFeedback?.("error");
//         speak?.(t("color.failed", "Detection failed. Please try again."), true);
//         Alert.alert(
//           t("common.error", "Error"),
//           err instanceof Error ? err.message : "Unknown error"
//         );
//       }
//     } finally {
//       setIsDetecting(false);
//     }
//   };

//   // ----------------------------
//   // Toggle auto
//   // ----------------------------
//   const toggleAutoDetection = () => {
//     if (!apiConnected) {
//       hapticFeedback?.("error");
//       speak?.(t("common.apiNotConnected", "API not connected."), true);
//       Alert.alert(
//         t("common.apiNotConnectedTitle", "Not connected"),
//         t("common.apiNotConnectedBody", "API not connected. Please check connection.")
//       );
//       return;
//     }

//     if (!permission?.granted) {
//       hapticFeedback?.("error");
//       speak?.(t("common.cameraPermissionNeeded", "Camera permission is required."), true);
//       return;
//     }

//     const next = !isAutoDetecting;
//     setIsAutoDetecting(next);
//     hapticFeedback?.("medium");

//     if (next) {
//       lastSpokenRef.current = "";
//       speak?.(t("color.scanningStart", "Scanning started"), true);
//     } else {
//       speak?.(t("color.scanningStop", "Scanning stopped"), true);
//       setDetectedColor("");
//       setColorHex("");
//       lastSpokenRef.current = "";
//     }
//   };

//   // ----------------------------
//   // Permission screens
//   // ----------------------------
//   if (!permission) {
//     return <View style={[styles.root, { backgroundColor: colors.background }]} />;
//   }

//   if (!permission.granted) {
//     return (
//       <View style={[styles.root, { backgroundColor: colors.background }]}>
//         <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
//           <AccessibleText
//             style={[styles.topTitle, { color: colors.textInverse }]}
//             level={1}
//           >
//             {t("color.title", "Color Identification")}
//           </AccessibleText>
//         </View>

//         <View style={[styles.permissionCenter, { backgroundColor: colors.background }]}>
//           <AccessibleText style={{ color: colors.text }}>
//             {t("common.cameraPermissionNeeded", "Camera permission is required.")}
//           </AccessibleText>

//           <AccessibleButton
//             title={t("common.allowCamera", "Allow Camera")}
//             onPress={requestPermission}
//             accessibilityLabel={t("common.allowCamera", "Allow Camera")}
//             accessibilityHint={t(
//               "common.allowCameraHint",
//               "Grants camera access to detect colors"
//             )}
//             style={[styles.permissionButton, { borderColor: colors.text }]}
//           />

//           <AccessibleButton
//             title={t("common.modes", "Modes")}
//             onPress={() => router.push("/features")}
//             style={styles.permissionButton}
//           />
//         </View>
//       </View>
//     );
//   }

//   // ----------------------------
//   // Main UI
//   // ----------------------------
//   return (
//     <View style={[styles.root, { backgroundColor: colors.background }]}>
//       {/* Header */}
//       <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
//         <AccessibleText
//           style={[styles.topTitle, { color: colors.textInverse }]}
//           level={1}
//         >
//           {t("color.title", "Color Identification")}
//         </AccessibleText>
//       </View>

//       {/* Camera + overlays */}
//       <View style={styles.cameraContainer}>
//         <CameraView ref={cameraRef} style={styles.camera} facing="back" />

//         {/* API status */}
//         <View style={[styles.statusOverlay, { backgroundColor: colors.card }]}>
//           <View
//             style={[
//               styles.statusDot,
//               { backgroundColor: apiConnected ? colors.success : colors.danger },
//             ]}
//             accessible
//             accessibilityLabel={`Connection status: ${
//               apiConnected ? "Connected" : "Disconnected"
//             }`}
//           />
//           <AccessibleText style={[styles.statusText, { color: colors.text }]}>
//             {apiConnected ? t("common.connected", "Connected") : t("common.disconnected", "Disconnected")}
//           </AccessibleText>

//           <TouchableOpacity
//             onPress={checkConnection}
//             style={styles.refreshButton}
//             accessible
//             accessibilityRole="button"
//             accessibilityLabel={t("common.refresh", "Refresh")}
//             accessibilityHint={t("common.refreshHint", "Re-check API connection")}
//           >
//             {checkingApi ? (
//               <ActivityIndicator size="small" color={colors.text} />
//             ) : (
//               <AccessibleText style={[styles.refreshText, { color: colors.text }]}>
//                 🔄
//               </AccessibleText>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Scanning indicator */}
//         {isAutoDetecting && (
//           <View style={[styles.detectingIndicator, { backgroundColor: colors.warning }]}>
//             <ActivityIndicator size="small" color={colors.textInverse} />
//             <AccessibleText style={[styles.detectingIndicatorText, { color: colors.textInverse }]}>
//               {t("color.scanning", "Scanning...")}
//             </AccessibleText>
//           </View>
//         )}

//         {/* Result */}
//         {detectedColor !== "" && (
//           <View style={styles.resultContainer}>
//             <View
//               style={[
//                 styles.colorSwatch,
//                 { backgroundColor: colorHex || "#000000" },
//               ]}
//               accessible
//               accessibilityLabel={t("color.sample", "Color sample")}
//             />
//             <AccessibleText style={styles.resultText}>
//               {detectedColor.toUpperCase()}
//             </AccessibleText>
//             {!!colorHex && <AccessibleText style={styles.hexText}>{colorHex}</AccessibleText>}
//           </View>
//         )}

//         {/* Toggle */}
//         <View style={styles.toggleOverlay}>
//           <AccessibleButton
//             title={
//               isAutoDetecting
//                 ? t("common.stopDetection", "Stop Detection")
//                 : t("common.startDetection", "Start Detection")
//             }
//             onPress={toggleAutoDetection}
//             disabled={!apiConnected}
//             style={[
//               styles.toggleButton,
//               isAutoDetecting && { backgroundColor: colors.danger },
//               !apiConnected && { backgroundColor: colors.disabled },
//             ]}
//             accessibilityLabel={
//               isAutoDetecting
//                 ? t("common.stopDetection", "Stop Detection")
//                 : t("common.startDetection", "Start Detection")
//             }
//             accessibilityHint={
//               apiConnected
//                 ? t("color.toggleHint", "Starts or stops automatic detection")
//                 : t("common.apiNotConnectedBody", "API not connected. Please check connection.")
//             }
//           />
//         </View>
//       </View>

//       {/* Bottom bar */}
//       <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
//         <AccessibleButton
//           title={t("common.modes", "Modes")}
//           onPress={() => {
//             setIsAutoDetecting(false);
//             hapticFeedback?.("light");
//             speak?.(t("common.goingToModes", "Navigating to modes"), true);
//             router.push("/features");
//           }}
//           style={styles.bottomButton}
//         />

//         <AccessibleButton
//           title={i18n.language === "ur" ? "اردو" : "ENG"}
//           onPress={() => {
//             hapticFeedback?.("light");
//             speak?.(
//               i18n.language === "ur"
//                 ? t("common.languageUrdu", "Language is Urdu")
//                 : t("common.languageEnglish", "Language is English"),
//               true
//             );
//           }}
//           style={styles.bottomButton}
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },

//   topBar: {
//     height: 120,
//     justifyContent: "center",
//     alignItems: "center",
//     borderBottomLeftRadius: 8,
//     borderBottomRightRadius: 8,
//   },
//   topTitle: { fontSize: 24, fontWeight: "800" },

//   cameraContainer: { flex: 1 },
//   camera: { flex: 1 },

//   permissionCenter: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//     gap: 16,
//   },
//   permissionButton: {
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     borderRadius: 16,
//     borderWidth: 1,
//     minWidth: 220,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   statusOverlay: {
//     position: "absolute",
//     top: 20,
//     left: 20,
//     right: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 12,
//     borderRadius: 10,
//   },
//   statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
//   statusText: { fontSize: 14, flex: 1 },
//   refreshButton: { padding: 6 },
//   refreshText: { fontSize: 18 },

//   detectingIndicator: {
//     position: "absolute",
//     top: 70,
//     left: 20,
//     right: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 10,
//     borderRadius: 8,
//   },
//   detectingIndicatorText: { fontSize: 14, marginLeft: 8, fontWeight: "600" },

//   resultContainer: {
//     position: "absolute",
//     top: "35%",
//     left: 30,
//     right: 30,
//     padding: 24,
//     borderRadius: 20,
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.85)",
//   },
//   colorSwatch: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 16,
//     borderWidth: 3,
//     borderColor: "#FFFFFF",
//   },
//   resultText: { fontSize: 28, textAlign: "center", fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
//   hexText: { fontSize: 16, textAlign: "center", fontWeight: "600", color: "#CCCCCC" },

//   toggleOverlay: {
//     position: "absolute",
//     bottom: 30,
//     left: 0,
//     right: 0,
//     alignItems: "center",
//   },
//   toggleButton: {
//     paddingVertical: 18,
//     paddingHorizontal: 44,
//     borderRadius: 30,
//     minWidth: 280,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   bottomBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },
//   bottomButton: {
//     flex: 1,
//     height: 80,
//     borderRadius: 18,
//     marginHorizontal: 6,
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";

import { detectClothesWithColor, checkApiHealth } from "../services/detectionApi";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const FALLBACK_COLORS = {
  background: "#000000",
  primary: "#1f2937",
  text: "#ffffff",
  textInverse: "#ffffff",
  card: "#111827",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  disabled: "#6b7280",
};

export default function ColorIdentificationScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();

  const hookColors = useAccessibleColors();
  const colors = useMemo(() => hookColors ?? FALLBACK_COLORS, [hookColors]);

  const [permission, requestPermission] = useCameraPermissions();

  const [apiConnected, setApiConnected] = useState(false);
  const [checkingApi, setCheckingApi] = useState(false);

  const [isDetecting, setIsDetecting] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const [detectedLabel, setDetectedLabel] = useState(""); // e.g. "green shirt"
  const [colorHex, setColorHex] = useState("");

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    speak?.(t("color.announcement", "Color Identification mode."), true);
    void checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => void captureAndDetect(), 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    setCheckingApi(true);
    try {
      const ok = await checkApiHealth();
      setApiConnected(ok);

      if (!ok) {
        Alert.alert(
          t("common.apiErrorTitle", "API Not Connected"),
          t(
            "common.apiErrorBody",
            "Cannot connect to detection server. Make sure:\n1. FastAPI server is running\n2. Both devices are on same WiFi\n3. IP address is correct in detectionApi"
          )
        );
      }
    } catch {
      setApiConnected(false);
    } finally {
      setCheckingApi(false);
    }
  };

  const captureAndDetect = async () => {
    if (!apiConnected || !permission?.granted || !cameraRef.current || isDetecting) return;

    setIsDetecting(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        exif: false,
        shutterSound: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture photo");

      const result: any = await detectClothesWithColor(photo.uri, 0.25);

      if (result?.success) {
        // Prefer backend-provided TTS label
        const msg = Array.isArray(result?.tts_messages) ? result.tts_messages[0] : "";
        const label = (msg || "").trim();

        // Try fallback: build label from top detection
        const top = Array.isArray(result?.detections) ? result.detections[0] : null;
        const fallbackLabel =
          top?.color?.name && top?.class_name
            ? `${top.color.name} ${top.class_name}`
            : "";

        const finalLabel = (label || fallbackLabel || "").trim();

        if (finalLabel) {
          setDetectedLabel(finalLabel);

          const hex = (top?.color?.hex || "").trim();
          setColorHex(hex);

          const key = finalLabel.toLowerCase();
          if (lastSpokenRef.current !== key) {
            lastSpokenRef.current = key;
            hapticFeedback?.("success");
            speak?.(finalLabel, true);
          }
          return;
        }

        if (!isAutoDetecting) {
          hapticFeedback?.("warning");
          speak?.("No clothing detected", true);
        }
        return;
      }

      if (!isAutoDetecting) {
        hapticFeedback?.("error");
        speak?.(t("color.failed", "Detection failed. Please try again."), true);
      }
    } catch (err) {
      if (!isAutoDetecting) {
        hapticFeedback?.("error");
        Alert.alert(t("common.error", "Error"), err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAutoDetection = () => {
    if (!apiConnected) {
      hapticFeedback?.("error");
      Alert.alert(t("common.apiNotConnectedTitle", "Not connected"), t("common.apiNotConnectedBody", "API not connected. Please check connection."));
      return;
    }
    if (!permission?.granted) {
      hapticFeedback?.("error");
      speak?.(t("common.cameraPermissionNeeded", "Camera permission is required."), true);
      return;
    }

    const next = !isAutoDetecting;
    setIsAutoDetecting(next);
    hapticFeedback?.("medium");

    if (next) {
      lastSpokenRef.current = "";
      speak?.(t("color.scanningStart", "Scanning started"), true);
    } else {
      speak?.(t("color.scanningStop", "Scanning stopped"), true);
      setDetectedLabel("");
      setColorHex("");
      lastSpokenRef.current = "";
    }
  };

  if (!permission) return <View style={[styles.root, { backgroundColor: colors.background }]} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
          <AccessibleText style={[styles.topTitle, { color: colors.textInverse }]} level={1}>
            {t("color.title", "Color Identification")}
          </AccessibleText>
        </View>

        <View style={[styles.permissionCenter, { backgroundColor: colors.background }]}>
          <AccessibleText style={{ color: colors.text }}>
            {t("common.cameraPermissionNeeded", "Camera permission is required.")}
          </AccessibleText>

          <AccessibleButton
            title={t("common.allowCamera", "Allow Camera")}
            onPress={requestPermission}
            style={[styles.permissionButton, { borderColor: colors.text }]}
          />

          <AccessibleButton
            title={t("common.modes", "Modes")}
            onPress={() => router.push("/features")}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText style={[styles.topTitle, { color: colors.textInverse }]} level={1}>
          {t("color.title", "Color Identification")}
        </AccessibleText>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        <View style={[styles.statusOverlay, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiConnected ? colors.success : colors.danger },
            ]}
            accessibilityLabel={`Connection status: ${apiConnected ? "Connected" : "Disconnected"}`}
          />
          <AccessibleText style={[styles.statusText, { color: colors.text }]}>
            {apiConnected ? t("common.connected", "Connected") : t("common.disconnected", "Disconnected")}
          </AccessibleText>

          <TouchableOpacity onPress={checkConnection} style={styles.refreshButton}>
            {checkingApi ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <AccessibleText style={[styles.refreshText, { color: colors.text }]}>🔄</AccessibleText>
            )}
          </TouchableOpacity>
        </View>

        {isAutoDetecting && (
          <View style={[styles.detectingIndicator, { backgroundColor: colors.warning }]}>
            <ActivityIndicator size="small" color={colors.textInverse} />
            <AccessibleText style={[styles.detectingIndicatorText, { color: colors.textInverse }]}>
              {t("color.scanning", "Scanning...")}
            </AccessibleText>
          </View>
        )}

        {detectedLabel !== "" && (
          <View style={styles.resultContainer}>
            <View style={[styles.colorSwatch, { backgroundColor: colorHex || "#000000" }]} />
            <AccessibleText style={styles.resultText}>{detectedLabel.toUpperCase()}</AccessibleText>
            {!!colorHex && <AccessibleText style={styles.hexText}>{colorHex}</AccessibleText>}
          </View>
        )}

        <View style={styles.toggleOverlay}>
          <AccessibleButton
            title={isAutoDetecting ? t("common.stopDetection", "Stop Detection") : t("common.startDetection", "Start Detection")}
            onPress={toggleAutoDetection}
            disabled={!apiConnected}
            style={[
              styles.toggleButton,
              isAutoDetecting && { backgroundColor: colors.danger },
              !apiConnected && { backgroundColor: colors.disabled },
            ]}
          />
        </View>
      </View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title={t("common.modes", "Modes")}
          onPress={() => {
            setIsAutoDetecting(false);
            router.push("/features");
          }}
          style={styles.bottomButton}
        />
        <AccessibleButton
          title={i18n.language === "ur" ? "اردو" : "ENG"}
          onPress={() => {}}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  topTitle: { fontSize: 24, fontWeight: "800" },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  permissionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  statusOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, flex: 1 },
  refreshButton: { padding: 6 },
  refreshText: { fontSize: 18 },

  detectingIndicator: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
  },
  detectingIndicatorText: { fontSize: 14, marginLeft: 8, fontWeight: "600" },

  resultContainer: {
    position: "absolute",
    top: "35%",
    left: 30,
    right: 30,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  colorSwatch: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  resultText: { fontSize: 28, textAlign: "center", fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  hexText: { fontSize: 16, textAlign: "center", fontWeight: "600", color: "#CCCCCC" },

  toggleOverlay: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toggleButton: {
    paddingVertical: 18,
    paddingHorizontal: 44,
    borderRadius: 30,
    minWidth: 280,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bottomButton: {
    flex: 1,
    height: 80,
    borderRadius: 18,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
