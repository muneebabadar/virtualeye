import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  StyleSheet,
  View,
} from "react-native";

import {
  checkApiHealth,
  detectObjectNavigation,
} from "../services/detectionApi";

const ObjectNavigationScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  const [permission, requestPermission] = useCameraPermissions();
  const [apiConnected, setApiConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<string>("");
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* 🔊 Initial announcement */
  useEffect(() => {
    speak?.(t("objectNav.announcement"), true);
    checkConnection();
  }, [i18n.language]);

  /* 🔁 Auto-detection loop */
  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      intervalRef.current = setInterval(captureObjects, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    const ok = await checkApiHealth();
    setApiConnected(ok);

    if (!ok) {
      Alert.alert(
        t("objectNav.apiError"),
        t("objectNav.apiDisconnected")
      );
    }
  };

  const speakIfNew = (msg: string) => {
    if (msg !== lastDetection) {
      setLastDetection(msg);
      speak?.(msg, true);
      hapticFeedback?.("success");
    }
  };

  const captureObjects = async () => {
    if (!cameraRef.current || isDetecting || !apiConnected) return;

    setIsDetecting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;

      const result = await detectObjectNavigation(photo.uri, 0.25);

      /* Persons first */
      if (result?.persons?.length) {
        const known = result.persons.find((p: any) => p.label !== "person");
        const p = known || result.persons[0];

        const msg = p.label === "person"
          ? t("objectNav.personDetected", {
              position: p.position || "center",
              distance: p.distance || "near",
            })
          : `${p.label}`;

        speakIfNew(msg);
        return;
      }

      /* Objects fallback */
      if (result?.detections?.length) {
        const best = result.detections.reduce((a: any, b: any) =>
          a.confidence > b.confidence ? a : b
        );
        speakIfNew(best.class_name || t("objectNav.unknownObject"));
        return;
      }

      setLastDetection("");
    } catch {
      speak?.(t("objectNav.apiError"), true);
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleAutoDetect = () => {
    if (!apiConnected) {
      speak?.(t("objectNav.apiDisconnected"), true);
      return;
    }

    const next = !isAutoDetecting;
    setIsAutoDetecting(next);
    hapticFeedback?.("medium");
    speak?.(next ? t("objectNav.started") : t("objectNav.stopped"), true);
  };

  /* Camera permission screen */
  if (!permission?.granted) {
    return (
      <View style={styles.permissionCenter}>
        <AccessibleButton
          title={t("objectNav.allowCamera")}
          onPress={requestPermission}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          accessibilityRole="header"
          style={{ color: colors.textInverse, fontSize: 24, fontWeight: "800" }}
        >
          {t("objectNav.title")}
        </AccessibleText>
      </View>

      {/* CAMERA */}
      <View style={{ flex: 1 }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          accessible
          accessibilityLabel={t("personCapture.liveFeedLabel")}
        />

        {/* Scanning indicator */}
        {isAutoDetecting && (
          <View style={[styles.scanning, { backgroundColor: colors.primary }]}>
            <ActivityIndicator color={colors.textInverse} />
            <AccessibleText style={{ color: colors.textInverse }}>
              {t("objectNav.scanning")}
            </AccessibleText>
          </View>
        )}

        {/* Detection result */}
        {lastDetection !== "" && (
          <View style={[styles.result, { backgroundColor: colors.primary }]}>
            <AccessibleText
              style={{ color: colors.textInverse, fontSize: 28, fontWeight: "800" }}
              accessibilityRole="alert"
            >
              {lastDetection}
            </AccessibleText>
          </View>
        )}

        {/* Start / Stop */}
        <View style={styles.toggleOverlay}>
          <AccessibleButton
            title={
              isAutoDetecting
                ? t("objectNav.stopped")
                : t("objectNav.started")
            }
            onPress={toggleAutoDetect}
            disabled={!apiConnected}
            style={[
              styles.toggleButton,
              isAutoDetecting && { backgroundColor: colors.danger },
            ]}
          />
        </View>
      </View>

      {/* BOTTOM BAR (same as Currency Reader) */}
      <View
        style={[
          styles.bottomBar,
          { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" },
        ]}
      >
        <AccessibleButton
          title={t("common.modes")}
          onPress={() => router.push("/features")}
          style={styles.bottomButton}
        />

        <AccessibleButton
          title={I18nManager.isRTL ? "اردو" : "ENG"}
          onPress={() => {}}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default ObjectNavigationScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    minHeight: 110,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  permissionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  scanning: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  result: {
    position: "absolute",
    top: "40%",
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },

  toggleOverlay: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  toggleButton: {
    minWidth: 280,
    minHeight: 56,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },

  bottomButton: {
    flex: 1,
    height: 80,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});