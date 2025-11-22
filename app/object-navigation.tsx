import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, } from "react-native";


const ObjectNavigationScreen =()=>{
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
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
      <View style={{ flex: 1, position: "relative" }}>
        <CameraView style={styles.camera} facing="back" />
      </View>

    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Object Navigation</Text>
      </View>
      {/*put whwtever camera returns*/}
      <View style={styles.cameraContainer}>{renderCamera()}</View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push("/features")}>
          <Text style={styles.bottomButtonText}>MODES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>ENG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default ObjectNavigationScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",},
  topBar: {height: 120,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 8,borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24,fontWeight: "800",color: "#000",},

  cameraContainer: {flex: 1,},
  camera: {flex:1,},

  permissionCenterOverlay: {flex: 1,alignItems: "center",justifyContent: "center",backgroundColor: "#000",},
  permissionButton: {paddingHorizontal: 24,paddingVertical: 16,borderRadius: 16,borderWidth: 1,
    borderColor: "#f4b500",},
  permissionText: {color: "#f9fafb",fontSize: 16,textAlign: "center",},

  bottomBar: {flexDirection: "row",justifyContent: "space-between",paddingHorizontal: 20,
    paddingVertical: 12,backgroundColor: "#020713",},
  bottomButton: {flex: 1,backgroundColor: "#f4b500",height: 80,borderRadius: 18,marginHorizontal: 6,
    alignItems: "center",justifyContent: "center", },
  bottomButtonText: {fontSize: 18,fontWeight: "800",color: "#000",},


}
);
