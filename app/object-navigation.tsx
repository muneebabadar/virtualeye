import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import * as Speech from "expo-speech";
import { detectObjects, checkApiHealth } from "../services/detectionApi";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const ObjectDetectionScreen = () => {
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

  // Announce screen on mount
  useEffect(() => {
    speak?.("Object Detection Screen. Use camera to detect objects.", true);
    checkConnection();
  }, []);

  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      speak?.("Object scanning started", true);
      detectionIntervalRef.current = setInterval(() => {
        captureObjects();
      }, 2000);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        if (isAutoDetecting) {
          speak?.("Object scanning stopped", true);
        }
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    const isConnected = await checkApiHealth();
    setApiConnected(isConnected);

    if (!isConnected) {
      Alert.alert(
        'API Not Connected',
        'Cannot connect to detection server. Make sure:\n' +
        '1. FastAPI server is running\n' +
        '2. Both devices are on same WiFi\n' +
        '3. IP address is correct in detectionApi.js'
      );
    }
  };

  const captureObjects = async () => {
    if (!cameraRef.current || isDetecting) return;
    if (!apiConnected) return;

    setIsDetecting(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!photo?.uri) {
        throw new Error("Could not capture image");
      }

      const result = await detectObjects(photo.uri, 0.3);

      if (result.detections && result.detections.length > 0) {
        const best = result.detections.reduce((a: any, b: any) =>
          a.confidence > b.confidence ? a : b
        );

        const objectName = best.class || best.class || "Unknown object";

        if (lastDetection !== objectName) {
          setLastDetection(objectName);
          speak?.(objectName, true);
          hapticFeedback?.('success');
        }
      } else {
        if (lastDetection !== "") {
          setLastDetection("");
        }
      }
    } catch (error) {
      console.log("Detection error:", error);

      if (!isAutoDetecting) {
        speak?.("Detection failed", true);
        hapticFeedback?.('error');
        Alert.alert("Error", "Could not process the image");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAuto = () => {
    if (!apiConnected) {
      speak?.("Error: API not connected", true);
      Alert.alert("Error", "API not connected");
      return;
    }

    const next = !isAutoDetecting;
    setIsAutoDetecting(next);
    hapticFeedback?.("medium");

    if (next) {
      speak?.("Object scanning started", true);
    } else {
      speak?.("Object scanning stopped", true);
      setLastDetection("");
    }
  };

  const renderCamera = () => {
    if (!permission) return <View />;

    if (!permission.granted) {
      return (
        <View style={[styles.permissionCenter, { backgroundColor: colors.background }]}>
          <AccessibleButton
            title="Allow Camera Access"
            onPress={requestPermission}
            accessibilityLabel="Allow camera access button"
            accessibilityHint="Grant camera permission to detect objects"
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef} />

        <View style={[styles.statusOverlay, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiConnected ? colors.success : colors.danger },
            ]}
            accessible={true}
            accessibilityLabel={`Connection status: ${apiConnected ? "Connected" : "Disconnected"}`}
          />
          <AccessibleText
            style={[styles.statusText, { color: colors.text }]}
            accessibilityRole="text"
          >
            {apiConnected ? "Connected" : "Disconnected"}
          </AccessibleText>
          <TouchableOpacity
            onPress={checkConnection}
            accessible={true}
            accessibilityLabel="Refresh connection status"
            accessibilityHint="Check API connection status"
            accessibilityRole="button"
          >
            <AccessibleText
              style={styles.refreshIcon}
              accessibilityRole="text"
            >
              🔄
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {isAutoDetecting && (
          <View style={[styles.detectingIndicator, { backgroundColor: colors.warning }]}>
            <ActivityIndicator size="small" color={colors.textInverse} />
            <AccessibleText
              style={[styles.detectingText, { color: colors.textInverse }]}
              accessibilityRole="text"
              accessibilityLabel="Scanning for objects in progress"
            >
              Scanning...
            </AccessibleText>
          </View>
        )}

        {lastDetection !== "" && (
          <View style={[styles.resultBox, { backgroundColor: colors.warning }]}>
            <AccessibleText
              style={[styles.resultText, { color: colors.textInverse }]}
              accessibilityRole="text"
              accessibilityLabel={`Detected object: ${lastDetection}`}
            >
              {lastDetection}
            </AccessibleText>
          </View>
        )}

        <View style={styles.toggleContainer}>
          <AccessibleButton
            title={`${isAutoDetecting ? "Stop" : "Start"} Detection`}
            onPress={toggleAuto}
            disabled={!apiConnected}
            accessibilityLabel={`${isAutoDetecting ? "Stop" : "Start"} object detection`}
            accessibilityHint={apiConnected
              ? `Tap to ${isAutoDetecting ? "stop" : "start"} automatic object detection`
              : "API not connected. Cannot start detection"
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
          style={[styles.title, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          Object Detection
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
          accessibilityLabel="Navigate to modes selection screen"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />

        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.("light");
            speak?.("Language is English", true);
          }}
          accessibilityLabel="Current language: English"
          accessibilityHint="Application language indicator"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default ObjectDetectionScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  title: { fontSize: 24, fontWeight: "800" },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  permissionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: { flex: 1 },
  refreshIcon: { fontSize: 18 },

  detectingIndicator: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detectingText: { marginLeft: 8, fontWeight: "600" },

  resultBox: {
    position: "absolute",
    top: "40%",
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  resultText: {
    fontSize: 32,
    fontWeight: "800",
  },

  toggleContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toggleButton: {
    minWidth: 280,
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: "center",
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
