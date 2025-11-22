import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


const PersonCaptureScreen=()=> {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const handleCapture = () => {
    const next = count + 1;
    setCount(next);
    if (next >= 5) {
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
        <View style={styles.permissionCenterOverlay}>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionText}>Allow Camera for Live Feed</Text>
          </TouchableOpacity>
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
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Person Registration</Text>
      </View>

      {/*cam+pic count*/}
      <View style={styles.content}>
        <Text style={styles.instructions}>Please take 5 photos of this person from different angles.</Text>{renderCamera()}
        <Text style={styles.counterText}>Photos captured: {count} / 5</Text>

        <View style={styles.captureWrapper}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}>
            <Feather name="camera" size={40} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default PersonCaptureScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",},
  topBar: {height: 120,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 8,borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24,fontWeight: "800",color: "#000",},

  content: {flex: 1,paddingHorizontal: 20,paddingTop: 20,paddingBottom: 20,},
  instructions: {fontSize: 14,color: "#e5e7eb",marginBottom: 12,},
  cameraFrameOuter: {flex: 1,backgroundColor: "#050b18",borderRadius: 18,borderWidth: 2,borderColor: "#e5e7eb",
    overflow: "hidden",marginBottom: 16,},
  camera: {flex:1,},

  permissionCenterOverlay: {flex: 1,alignItems: "center",justifyContent: "center",backgroundColor: "#000",},
  permissionButton: {paddingHorizontal: 24,paddingVertical: 16,borderRadius: 16,borderWidth: 1,
    borderColor: "#f4b500",},
  permissionText: {color: "#f9fafb",fontSize: 16,textAlign: "center",},

  counterText: {fontSize: 14,color: "#f4b500",textAlign: "center",marginBottom: 12,},
  captureWrapper: {alignItems: "center",},
  captureButton: {width: 80,height: 80,borderRadius: 40,backgroundColor: "#f4b500",alignItems: "center",
    justifyContent: "center",borderWidth: 4,borderColor: "#f9fafb",},

}
);
