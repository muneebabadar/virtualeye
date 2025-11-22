import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


const FeaturesScreen=() =>{
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Select Mode</Text>
      </View>

      <View style={styles.centerArea}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => router.push("/object-navigation")}>
          <Text style={styles.modeTitle}>Object Navigation</Text>
          <Text style={styles.modeSub}>Detect objects and navigate indoors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => router.push("/color-identification")}>
          <Text style={styles.modeTitle}>Color Identification</Text>
          <Text style={styles.modeSub}>Identify colors of objects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => router.push("/currency-reader")}>
          <Text style={styles.modeTitle}>Currency Reader</Text>
          <Text style={styles.modeSub}>Read currency denominations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => router.push("/person-registration")}>
          <Text style={styles.modeTitle}>Person Registration</Text>
          <Text style={styles.modeSub}>Register and manage people</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default FeaturesScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",},
  topBar: {height: 120,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 8,borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24,fontWeight: "800",color: "#000",},

  centerArea: {flex: 1,paddingHorizontal: 20,paddingVertical: 24,},
  modeButton: {backgroundColor: "#f4b500",borderRadius: 20,height: 100,marginBottom: 20,paddingHorizontal: 16,
    justifyContent: "center",
  },
  modeTitle: {fontSize: 20,fontWeight: "800",color: "#000",marginBottom: 4,},
  modeSub: {fontSize: 14,color: "#111827",},

}

);
