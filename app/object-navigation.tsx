import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { checkApiHealth, detectObjectNavigation } from "../services/detectionApi";

const ObjectDetectionScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  const [permission, requestPermission] = useCameraPermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState("");
  const [apiConnected, setApiConnected] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<any>(null);

  /** 🎤 Screen announcement (localized) */
  useEffect(() => {
    speak?.(t("objectNav.announcement"), true);
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      detectionIntervalRef.current = setInterval(captureObjects, 2000);
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
        t("common.error"),
        t("objectNav.apiError")
      );
    }
  };

  const speakIfNew = (message: string) => {
    if (lastDetection !== message) {
      setLastDetection(message);
      speak?.(message, true);
      hapticFeedback?.("success");
    }
  };

  const captureObjects = async () => {
    if (!cameraRef.current || isDetecting || !apiConnected) return;

    setIsDetecting(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (!photo?.uri) throw new Error("No image");

      const result = await detectObjectNavigation(photo.uri, 0.25);

      if (result?.persons?.length > 0) {
        const p = result.persons[0];
        const message = t("objectNav.personDetected", {
          position: p.position ?? t("common.center"),
          distance: p.distance ?? t("common.medium"),
        });
        speakIfNew(message);
        return;
      }

      if (result?.detections?.length > 0) {
        const best = result.detections.reduce((a: any, b: any) =>
          a.confidence > b.confidence ? a : b
        );

        const objectName = best.class_name ?? t("objectNav.unknownObject");
        speakIfNew(objectName);
        return;
      }

      setLastDetection("");
    } catch {
      speak?.(t("common.detectionFailed"), true);
      hapticFeedback?.("error");
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAuto = () => {
    if (!apiConnected) {
      speak?.(t("objectNav.apiDisconnected"), true);
      return;
    }

    const next = !isAutoDetecting;
    setIsAutoDetecting(next);
    hapticFeedback?.("medium");

    speak?.(
      next ? t("objectNav.started") : t("objectNav.stopped"),
      true
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          level={1}
          style={[styles.title, { color: colors.textInverse }]}
        >
          {t("objectNav.title")}
        </AccessibleText>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        {!permission?.granted ? (
          <View style={styles.permissionCenter}>
            <AccessibleButton
              title={t("objectNav.allowCamera")}
              onPress={requestPermission}
            />
          </View>
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} />
        )}
      </View>

      {/* Status */}
      {isAutoDetecting && (
        <View style={[styles.detectingIndicator, { backgroundColor: colors.primary }]}>
          <ActivityIndicator color={colors.textInverse} />
          <AccessibleText style={{ color: colors.textInverse, marginLeft: 8 }}>
            {t("objectNav.scanning")}
          </AccessibleText>
        </View>
      )}

      {lastDetection !== "" && (
        <View style={[styles.resultBox, { backgroundColor: colors.primary }]}>
          <AccessibleText style={[styles.resultText, { color: colors.textInverse }]}>
            {lastDetection}
          </AccessibleText>
        </View>
      )}

      {/* Controls */}
      <View style={styles.bottomBar}>
        <AccessibleButton
          title={t("common.modes")}
          onPress={() => router.push("/features")}
          style={styles.bottomButton}
        />

        <AccessibleButton
          title={isAutoDetecting ? t("common.stop") : t("common.start")}
          onPress={toggleAuto}
          disabled={!apiConnected}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default ObjectDetectionScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { height: 120, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800" },

  cameraContainer: { flex: 1 },
  camera: { flex: 1 },

  permissionCenter: { flex: 1, justifyContent: "center", alignItems: "center" },

  detectingIndicator: {
    position: "absolute",
    top: 140,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
  },

  resultBox: {
    position: "absolute",
    top: "45%",
    left: 30,
    right: 30,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  resultText: { fontSize: 28, fontWeight: "800" },

  bottomBar: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    height: 70,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
