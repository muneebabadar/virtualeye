import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAccessibleColors } from "@/hooks/useAccessibleColors";
import { AccessibleText } from "@/components/AccessibleText";
import { AccessibleButton } from "@/components/AccessibleButton";

const ColorIdentificationScreen = () => {
  const router = useRouter();
  const { speak, hapticFeedback } = useAccessibility();
  const colors = useAccessibleColors();
  const [permission, requestPermission] = useCameraPermissions();

  // Announce screen on mount
  useEffect(() => {
    speak?.("Color Identification Screen. Use camera to identify colors.", true);
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

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
            accessibilityLabel="Allow camera access for color identification"
            accessibilityHint="Grant camera permission to identify colors in your surroundings"
            style={styles.permissionButton}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, position: "relative" }}>
        <CameraView style={styles.camera} facing="back" />
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
          Color Identification
        </AccessibleText>
      </View>
      {/*put whwtever camera returns*/}
      <View style={styles.cameraContainer}>{renderCamera()}</View>

      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <AccessibleButton
          title="Modes"
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Navigating to modes selection', true);
            router.push("/features");
          }}
          accessibilityLabel="Navigate to modes selection screen"
          accessibilityHint="Switch between different V-EYE features"
          style={styles.bottomButton}
        />

        <AccessibleButton
          title="ENG"
          onPress={() => {
            hapticFeedback?.('light');
            speak?.('Language is English', true);
          }}
          accessibilityLabel="Current language: English"
          accessibilityHint="Application language indicator"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}
export default ColorIdentificationScreen
const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {height: 120, justifyContent: "center", alignItems: "center",
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24, fontWeight: "800"},

  cameraContainer: {flex: 1,},
  camera: {flex:1,},

  permissionCenterOverlay: {flex: 1, alignItems: "center", justifyContent: "center"},
  permissionButton: {paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1},

  bottomBar: {flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20,
    paddingVertical: 12,},
  bottomButton: {flex: 1, height: 80, borderRadius: 18, marginHorizontal: 6,
    alignItems: "center", justifyContent: "center"},


}
);