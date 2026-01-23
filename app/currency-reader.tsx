import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { checkApiHealth, detectCurrency } from "../services/detectionApi";

const CurrencyReaderScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<string>("");
  const [apiConnected, setApiConnected] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    speak?.("Currency Reader Screen. Use camera to detect currency notes.", true);
    checkConnection();
  }, []);

  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      detectionIntervalRef.current = setInterval(() => {
        captureCurrency();
      }, 2000);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    const isConnected = await checkApiHealth();
    setApiConnected(isConnected);

    if (!isConnected) {
      Alert.alert(
        "API Not Connected",
        "Cannot connect to detection server. Make sure:\n" +
          "1. FastAPI server is running\n" +
          "2. Both devices are on same WiFi\n" +
          "3. IP address is correct in detectionApi.js"
      );
    }
  };

  const captureCurrency = async () => {
    if (!cameraRef.current || isDetecting) return;
    if (!apiConnected) return;

    setIsDetecting(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture photo");

      const result = await detectCurrency(photo.uri, 0.5);

      if (result.detections && result.detections.length > 0) {
        const best = result.detections.reduce((prev: any, current: any) =>
          prev.confidence > current.confidence ? prev : current
        );

        const currencyName = best.class;
        const message = `${currencyName}`;

        if (lastDetection !== message) {
          setLastDetection(message);
          hapticFeedback?.("success");
          speak?.(message, true);
        }
      } else {
        if (lastDetection !== "") setLastDetection("");
      }
    } catch (error) {
      if (!isAutoDetecting) {
        speak?.("Detection failed. Please try again.", true);
        hapticFeedback?.("error");
        Alert.alert("Detection Failed", error instanceof Error ? error.message : "Unknown error");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAutoDetection = () => {
    if (!apiConnected) {
      speak?.("API not connected. Please check connection.", true);
      hapticFeedback?.("error");
      Alert.alert("Error", "API not connected. Please check connection.");
      return;
    }

    const newState = !isAutoDetecting;
    setIsAutoDetecting(newState);
    hapticFeedback?.("medium");

    if (newState) {
      speak?.("Currency scanning started", true);
    } else {
      speak?.("Currency scanning stopped", true);
      setLastDetection("");
    }
  };

  const renderCamera = () => {
    if (!permission) return <View />;

    if (!permission.granted) {
      return (
        <View style={[styles.permissionCenterOverlay, { backgroundColor: colors.background }]}>
          <AccessibleButton
            title="Allow Camera for Live Feed"
            onPress={requestPermission}
            accessibilityLabel="Allow camera access"
            accessibilityHint="Grant camera permission to detect currency notes"
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, position: "relative" }}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef} />

        {/* API Status */}
        <View
          style={[
            styles.statusOverlay,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessible
          accessibilityLabel={`Connection status: ${apiConnected ? "Connected" : "Disconnected"}`}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiConnected ? colors.success : colors.danger },
            ]}
          />
          <AccessibleText style={[styles.statusText, { color: colors.text }]}>
            {apiConnected ? "Connected" : "Disconnected"}
          </AccessibleText>

          {/* FIX: Touch target >= 48x48 + clear label */}
          <TouchableOpacity
            onPress={checkConnection}
            style={styles.refreshButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Refresh connection status"
            accessibilityHint="Checks whether the detection server is connected"
          >
            <AccessibleText style={[styles.refreshText, { color: colors.text }]}>🔄</AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Scanning banner */}
        {isAutoDetecting && (
          <View
            style={[
              styles.detectingIndicator,
              { backgroundColor: colors.primary, borderColor: colors.border },
            ]}
            accessible
            accessibilityLabel="Scanning for currency notes"
          >
            <ActivityIndicator size="small" color={colors.textInverse} />
            <AccessibleText style={[styles.detectingIndicatorText, { color: colors.textInverse }]}>
              Scanning...
            </AccessibleText>
          </View>
        )}

        {/* Result */}
        {lastDetection !== "" && (
          <View
            style={[
              styles.resultContainer,
              { backgroundColor: colors.primary, borderColor: colors.border },
            ]}
            accessible
            accessibilityLabel={`Detected currency: ${lastDetection}`}
          >
            <AccessibleText style={[styles.resultText, { color: colors.textInverse }]}>
              {lastDetection}
            </AccessibleText>
          </View>
        )}

        {/* Toggle */}
        <View style={styles.toggleOverlay}>
          <AccessibleButton
            title={`${isAutoDetecting ? "Stop" : "Start"} Detection`}
            onPress={toggleAutoDetection}
            disabled={!apiConnected}
            // FIX: Explicit label (prevents "unexposed text" warning)
            accessibilityLabel={`${isAutoDetecting ? "Stop" : "Start"} Detection`}
            accessibilityHint={
              apiConnected
                ? `Tap to ${isAutoDetecting ? "stop" : "start"} automatic currency detection`
                : "API not connected"
            }
            style={[
              styles.toggleButton,
              isAutoDetecting && { backgroundColor: colors.danger },
              !apiConnected && { backgroundColor: colors.disabled },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Currency Reader
        </AccessibleText>
      </View>

      <View style={styles.cameraContainer}>{renderCamera()}</View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title="Modes"
          onPress={() => {
            setIsAutoDetecting(false);
            hapticFeedback?.("light");
            speak?.("Navigating to modes selection", true);
            router.push("/features");
          }}
          accessibilityLabel="Modes"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />

        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.("light");
            speak?.("Language is English", true);
          }}
          accessibilityLabel="Language"
          accessibilityHint="Current language is English"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default CurrencyReaderScreen;

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

  permissionCenterOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  permissionButton: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },

  statusOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, flex: 1 },

  // FIX: guaranteed >= 48dp
  refreshButton: {
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  refreshText: { fontSize: 18 },

  detectingIndicator: {
    position: "absolute",
    top: 78,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  detectingIndicatorText: { fontSize: 14, marginLeft: 8, fontWeight: "700" },

  resultContainer: {
    position: "absolute",
    top: "40%",
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
  },
  resultText: { fontSize: 32, textAlign: "center", fontWeight: "800" },

  toggleOverlay: { position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" },
  toggleButton: {
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 30,
    minWidth: 280,
    minHeight: 56,
    alignItems: "center",
  },

  bottomBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  bottomButton: { flex: 1, height: 80, borderRadius: 18, marginHorizontal: 6, alignItems: "center", justifyContent: "center" },
});
