import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const PersonCaptureScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [count, setCount] = useState(0);

  // Announce screen and request camera permission
  useEffect(() => {
    speak?.("Person capture screen. Take 5 photos from different angles.", true);
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const handleCapture = () => {
    hapticFeedback?.('medium');
    const next = count + 1;
    setCount(next);
    speak?.(`Photo ${next} of 5 captured`, true);

    if (next >= 5) {
      speak?.("All photos captured. Proceeding to name entry.", true);
      router.replace({
        pathname: "/person-name",
        params: { count: String(next) },
      } as any);
    }
  };

  const renderCamera = () => {
    //if permission is still loading
    if (!permission) {
      return <View />;
    }
    //if permission is not granted show button for permission
    if (!permission.granted) {
      return (
        <View style={[styles.permissionCenterOverlay, { backgroundColor: colors.background }]}>
          <AccessibleButton
            title="Allow Camera for Live Feed"
            onPress={requestPermission}
            accessibilityLabel="Allow camera access for person registration"
            accessibilityHint="Grant camera permission to capture photos for person registration"
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.cameraFrameOuter}>
        <CameraView style={styles.camera} facing="front" />
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
          Person Registration
        </AccessibleText>
      </View>

      {/*cam+pic count*/}
      <View style={styles.content}>
        <AccessibleText
          style={[styles.instructions, { color: colors.textSecondary }]}
          accessibilityRole="text"
        >
          Please take 5 photos of this person from different angles.
        </AccessibleText>
        {renderCamera()}
        <AccessibleText
          style={[styles.counterText, { color: colors.primary }]}
          accessibilityRole="text"
          accessibilityLabel={`Photos captured: ${count} out of 5`}
        >
          Photos captured: {count} / 5
        </AccessibleText>

        <View style={styles.captureWrapper}>
          <TouchableOpacity
            style={[styles.captureButton, { backgroundColor: colors.primary, borderColor: colors.textInverse }]}
            onPress={handleCapture}
            accessible={true}
            accessibilityLabel={`Take photo ${count + 1} of 5`}
            accessibilityHint="Capture a photo of the person from a different angle"
            accessibilityRole="button"
          >
            <Feather name="camera" size={40} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default PersonCaptureScreen
const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {height: 120, justifyContent: "center", alignItems: "center",
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24, fontWeight: "800"},

  content: {flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,},
  instructions: {fontSize: 14, marginBottom: 12,},
  cameraFrameOuter: {flex: 1, borderRadius: 18, borderWidth: 2,
    overflow: "hidden", marginBottom: 16,},
  camera: {flex:1,},

  permissionCenterOverlay: {flex: 1, alignItems: "center", justifyContent: "center"},
  permissionButton: {paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1},

  counterText: {fontSize: 14, textAlign: "center", marginBottom: 12,},
  captureWrapper: {alignItems: "center",},
  captureButton: {width: 80, height: 80, borderRadius: 40, alignItems: "center",
    justifyContent: "center", borderWidth: 4},

}
);
