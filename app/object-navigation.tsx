import { AccessibleButton } from "@/components/AccessibleButton";
import { AccessibleText } from "@/components/AccessibleText";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import { I18nManager, StyleSheet, View } from "react-native";

import {
  checkApiHealth,
  detectObjectNavigation,
} from "../services/detectionApi";

import {
  speakUI,
  stopTTS,
  translateAndSpeakObject,
  UI_URDU,
} from "../services/ttsService";

const ObjectNavigationScreen = () => {
  const router = useRouter();
  const { autoStart } = useLocalSearchParams<{ autoStart?: string }>();
  const { t, i18n } = useTranslation();

  const { speak, stopSpeaking, hapticFeedback } = useAccessibility();

  const colors = useAccessibleColors();

  const [permission, requestPermission] = useCameraPermissions();
  const [apiConnected, setApiConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState("");
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [lang, setLang] = useState<"en" | "ur">(
    i18n.language === "ur" ? "ur" : "en"
  );

  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasAutoStartedRef = useRef(false);
  const lastSpokenRef = useRef("");
  const lastRawDetectionRef = useRef("");
  const langRef = useRef(lang);
  const isMountedRef = useRef(true);
  const isDetectingRef = useRef(false);
  const apiConnectedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    isMountedRef.current = true;

    void checkConnection();

    return () => {
      isMountedRef.current = false;

      stopTTS();
      stopSpeaking?.();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      isDetectingRef.current = false;
      isProcessingRef.current = false;
    };
  }, []);

  useEffect(() => {
    apiConnectedRef.current = apiConnected;
  }, [apiConnected]);

  useEffect(() => {
    if (autoStart !== "1") return;
    if (hasAutoStartedRef.current) return;
    if (!permission?.granted) return;
    if (!apiConnected) return;

    hasAutoStartedRef.current = true;

    setIsAutoDetecting(true);

    hapticFeedback?.("medium");
  }, [autoStart, permission?.granted, apiConnected, hapticFeedback]);

  useEffect(() => {
    if (isAutoDetecting && apiConnected) {
      intervalRef.current = setInterval(() => {
        void captureObjects();
      }, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoDetecting, apiConnected]);

  const checkConnection = async () => {
    try {
      const ok = await checkApiHealth();

      if (!isMountedRef.current) return;

      setApiConnected(ok);
      apiConnectedRef.current = ok;

      if (!ok) {
        setIsAutoDetecting(false);
      }
    } catch {
      if (!isMountedRef.current) return;

      setApiConnected(false);
      apiConnectedRef.current = false;

      setIsAutoDetecting(false);
    }
  };

  const translateSpeakAndShow = (rawText: string) => {
    if (!rawText) return;

    const speechKey = `${rawText.toLowerCase()}|${langRef.current}`;

    if (lastSpokenRef.current === speechKey) return;

    lastSpokenRef.current = speechKey;
    lastRawDetectionRef.current = rawText;

    setLastDetection(rawText);

    hapticFeedback?.("success");

    void (async () => {
      setIsSpeaking(true);

      try {
        const phrase = await translateAndSpeakObject(
          rawText,
          langRef.current
        );

        if (isMountedRef.current && phrase) {
          setLastDetection(phrase);
        }
      } finally {
        if (isMountedRef.current) {
          setIsSpeaking(false);
        }
      }
    })();
  };

  // OPTIONAL DIRECT SPEAK METHOD
  const speakIfNew = (msg: string) => {
    if (!msg) return;

    if (lastSpokenRef.current === msg) return;

    lastSpokenRef.current = msg;

    setLastDetection(msg);

    hapticFeedback?.("success");

    stopSpeaking?.();

    speak?.(msg, false);
  };

  const captureObjects = async () => {
    if (!cameraRef.current) return;
    if (!apiConnectedRef.current) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    isDetectingRef.current = true;

    setIsDetecting(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        shutterSound: false,
        skipProcessing: true,
      });

      if (!photo?.uri) return;

      const result = await detectObjectNavigation(photo.uri, 0.45);

      if (!isMountedRef.current) return;

      // 👤 PERSON PRIORITY
      if (result?.persons?.length) {
        const known = result.persons.find(
          (p: any) => p.label !== "person"
        );

        const p = known || result.persons[0];

        if (p.label === "person") {
          const position = p.position || "center";
          const distance = p.distance || "near";

          translateSpeakAndShow(
            `person ${position} ${distance}`
          );

          return;
        }

        translateSpeakAndShow(String(p.label));

        return;
      }

      // 📦 OBJECTS
      if (result?.detections?.length) {
        const best = result.detections.reduce((a: any, b: any) =>
          a.confidence > b.confidence ? a : b
        );

        const detectedObject =
          best.class ||
          best.class_name ||
          t("objectNav.unknownObject", "Unknown object");

        translateSpeakAndShow(detectedObject);

        return;
      }

      // reset if nothing found
      setLastDetection("");

      lastSpokenRef.current = "";
      lastRawDetectionRef.current = "";
    } catch (e) {
      console.log("Detection error:", e);
    } finally {
      isProcessingRef.current = false;

      isDetectingRef.current = false;

      if (isMountedRef.current) {
        setIsDetecting(false);
      }
    }
  };

  const handleLanguageToggle = async () => {
    const next = lang === "en" ? "ur" : "en";

    stopTTS();
    stopSpeaking?.();

    setLang(next);

    langRef.current = next;

    lastSpokenRef.current = "";

    await i18n.changeLanguage(next);

    hapticFeedback?.("medium");

    speakUI(
      next === "ur"
        ? UI_URDU.switched_urdu
        : "Language changed to English",
      next
    );

    if (lastRawDetectionRef.current) {
      translateSpeakAndShow(lastRawDetectionRef.current);
    }
  };

  const goToModes = () => {
    stopTTS();
    stopSpeaking?.();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsAutoDetecting(false);

    hasAutoStartedRef.current = false;

    lastSpokenRef.current = "";
    lastRawDetectionRef.current = "";

    setLastDetection("");

    isDetectingRef.current = false;
    isProcessingRef.current = false;

    router.push("/features");
  };

  // 🔐 PERMISSION
  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.permissionCenter,
          { backgroundColor: colors.background },
        ]}
      >
        <AccessibleButton
          title={t("objectNav.allowCamera", "Allow Camera")}
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
          style={{
            color: colors.textInverse,
            fontSize: 24,
            fontWeight: "800",
          }}
        >
          {lang === "ur"
            ? "آبجیکٹ نیویگیشن"
            : "Object Navigation"}
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

        {/* RESULT */}
        {lastDetection !== "" && (
          <View style={[styles.result, { backgroundColor: colors.primary }]}>
            <AccessibleText
              style={{
                color: colors.textInverse,
                fontSize: 28,
                fontWeight: "800",
                textAlign: "center",
              }}
              adjustsFontSizeToFit
              numberOfLines={2}
            >
              {lastDetection}
            </AccessibleText>

            {isSpeaking && (
              <AccessibleText
                style={{
                  color: colors.textInverse,
                  fontSize: 13,
                  marginTop: 6,
                  opacity: 0.8,
                }}
              >
                {lang === "ur"
                  ? "🔊 بول رہا ہے…"
                  : "🔊 Speaking…"}
              </AccessibleText>
            )}
          </View>
        )}
      </View>

      {/* BOTTOM */}
      <View
        style={[
          styles.bottomBar,
          {
            flexDirection: I18nManager.isRTL
              ? "row-reverse"
              : "row",
          },
        ]}
      >
        <AccessibleButton
          title={
            lang === "ur"
              ? "واپس"
              : t("common.modes", "Modes")
          }
          onPress={goToModes}
          style={styles.bottomButton}
        />

        <AccessibleButton
          title={lang === "ur" ? "اردو" : "ENG"}
          onPress={handleLanguageToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: lang === "ur" }}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
};

export default ObjectNavigationScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

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

  result: {
    position: "absolute",
    top: "40%",
    left: 30,
    right: 30,
    padding: 30,
    borderRadius: 20,
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