import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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

const PersonCaptureScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();

  const [permission, requestPermission] = useCameraPermissions();
  const [count, setCount] = useState(0);
  const [capturedUris, setCapturedUris] = useState<string[]>([]);
  const cameraRef = useRef<CameraView | null>(null);

  const onBg = useMemo(() => onColor(colors.background), [colors.background]);

  /** 🔊 Announcement */
  useEffect(() => {
    speak?.(t("personCapture.announcement"), true);
    if (!permission) requestPermission();
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) {
      speak?.(t("common.loading"), true);
      return;
    }

    try {
      hapticFeedback?.("medium");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo?.uri) return;

      const fileName = `person_photo_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: photo.uri,
        to: fileUri,
      });

      const next = count + 1;
      const newUris = [...capturedUris, fileUri];

      setCapturedUris(newUris);
      setCount(next);

      speak?.(t("personCapture.photoCaptured", { count: next }), true);

      if (next >= 5) {
        speak?.(t("personCapture.completed"), true);
        router.replace({
          pathname: "/person-name",
          params: {
            count: String(next),
            imageUris: JSON.stringify(newUris),
          },
        } as any);
      }
    } catch (error) {
      console.error("Capture error:", error);
      speak?.(t("common.loading"), true);
      hapticFeedback?.("error");
    }
  };

  const renderCamera = () => {
    if (!permission) return <View />;

    if (!permission.granted) {
      return (
        <View
          style={[
            styles.permissionCenterOverlay,
            { backgroundColor: colors.background },
          ]}
        >
          <AccessibleButton
            title={t("personCapture.allowCamera")}
            onPress={requestPermission}
            accessibilityLabel={t("personCapture.allowCameraLabel")}
            accessibilityHint={t("personCapture.allowCameraHint")}
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={[styles.cameraFrameOuter, { borderColor: colors.border }]}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          accessible
          accessibilityLabel={t("personCapture.liveFeedLabel")}
        />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <AccessibleText
          style={[styles.topTitle, { color: colors.textInverse }]}
          accessibilityRole="header"
          level={1}
        >
          {t("personCapture.title")}
        </AccessibleText>
      </View>

      <View style={styles.content}>
        <AccessibleText style={[styles.instructions, { color: onBg }]}>
          {t("personCapture.instructions")}
        </AccessibleText>

        {renderCamera()}

        <AccessibleText
          style={[styles.counterText, { color: onBg }]}
          accessibilityLabel={t("personCapture.counter", { count })}
        >
          {t("personCapture.counter", { count })}
        </AccessibleText>

        <View style={styles.captureWrapper}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.textInverse,
              },
            ]}
            onPress={handleCapture}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("personCapture.captureLabel", {
              count: count + 1,
            })}
            accessibilityHint={t("personCapture.captureHint")}
          >
            <Feather name="camera" size={40} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PersonCaptureScreen;

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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  instructions: { fontSize: 14, marginBottom: 12 },

  cameraFrameOuter: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
  },

  camera: { flex: 1 },

  permissionCenterOverlay: {
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

  counterText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },

  captureWrapper: { alignItems: "center" },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
});