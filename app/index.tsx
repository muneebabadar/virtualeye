import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";


const LoadingScreen = () => {
  const router = useRouter(); //navigate between screens
  //after 2 sec the welcome screen opens
  useEffect(() => {
    const timer = setTimeout(() => {router.replace("/welcome");}, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.centerContent}>
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <Feather name="camera" size={60} color="#000" />
          </View>
        </View>
        <Text style={styles.title}>V-EYE</Text>
        <Text style={styles.subtitle}>Virtual Eye Assistant</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}
export default LoadingScreen;

const styles = StyleSheet.create({
  
  //full screen background and centering
  root: {flex: 1,backgroundColor:"#020713",alignItems: "center",justifyContent: "center",},
  //text and logo centered
  centerContent: {alignItems: "center",},
  //white circle
  logoOuterCircle: {width: 120,height: 120,borderRadius: 60,backgroundColor: "#fff",
    alignItems: "center",justifyContent: "center",marginBottom: 20,},
  //yellow circle inside white circle
  logoInnerCircle: {width: 100,height: 100,borderRadius: 50,backgroundColor: "#f4b500",
    alignItems: "center",justifyContent: "center",},

  title: {fontSize: 32,fontWeight: "800",color: "#f4b500",marginTop: 20,},
  subtitle: {fontSize: 16,color: "#e5e7eb",marginTop: 8,marginBottom: 30,},
  loadingText: {fontSize: 16,color: "#9ca3af",},
});
