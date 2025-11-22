import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";


const  WelcomeFeaturesScreen=() =>{
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {router.replace("/setup");}, 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <Feather name="camera" size={40} color="#000" />
          </View>
        </View>
        <Text style={styles.title}>V-EYE</Text>
        <Text style={styles.subtitle}>Virtual Eye Assistant</Text>
      </View>

      
    <Text style={[styles.welcomeTitle,{ marginTop: 32, textAlign: "center"}]}>Welcome</Text>
    <Text style={[styles.welcomeSubtitle,{textAlign: "center"}]}>
      Navigate the world through audio feedback
    </Text>
     

      {/*text inside features box*/}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Available Features</Text>
        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: "#f59e0b" }]} />
          <View>
            <Text style={styles.featureTitle}>Object Navigation</Text>
            <Text style={styles.featureSub}>Detect objects and navigate indoors</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: "#4b5563" }]} />
          <View>
            <Text style={styles.featureTitle}>Person Recognition</Text>
            <Text style={styles.featureSub}>Recognize registered people by face</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: "#f59e0b" }]} />
          <View>
            <Text style={styles.featureTitle}>Color Identification</Text>
            <Text style={styles.featureSub}>Identify colors of nearby objects</Text>
          </View>
        </View>
        <View style={styles.featureRow}>
          <View style={[styles.featureDot, { backgroundColor: "#22c55e" }]} />
          <View>
            <Text style={styles.featureTitle}>Currency Reader</Text>
            <Text style={styles.featureSub}>Read currency denominations</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
export default WelcomeFeaturesScreen

const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",paddingHorizontal: 28,paddingTop: 70,paddingBottom: 40,},
  //horizontally centres the logo and text
  header: {alignItems: "center",},
  //logo
  logoOuterCircle: {width: 110,height: 110,borderRadius: 55,backgroundColor: "#fff",
    alignItems: "center",justifyContent: "center",marginBottom: 12,},
  logoInnerCircle: {width: 90,height: 90,borderRadius: 45,backgroundColor: "#f4b500",
    alignItems: "center",justifyContent: "center",},

  title: {fontSize: 32,fontWeight: "800",color: "#f4b500",letterSpacing: 2,},
  subtitle: {fontSize: 16,color: "#e5e7eb",marginTop: 6,},

  welcomeTitle: {fontSize: 28,fontWeight: "700",color: "#f9fafb",marginBottom: 6,},
  welcomeSubtitle: {fontSize: 16,color: "#e5e7eb",textAlign: "center",width: "80%",},

  featuresCard: {marginTop: 32,backgroundColor: "#050b18",borderRadius: 22,borderWidth: 2,
    borderColor: "#e5e7eb",padding: 22,},

  //heading
  featuresTitle: {fontSize: 20,fontWeight: "700",color: "#f4b500",marginBottom: 18,},

  featureRow: {flexDirection: "row",alignItems: "center",paddingVertical: 14,},
  featureDot: {width: 22,height: 22,borderRadius: 11,marginRight: 14,},
  featureTitle: {fontSize: 18,fontWeight: "600",color: "#f9fafb",},
  featureSub: {fontSize: 14,color: "#9ca3af",},




}


);
