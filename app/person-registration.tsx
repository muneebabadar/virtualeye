import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


const PersonRegistrationScreen=()=> {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Person Registration</Text>
      </View>

      <View style={styles.centerArea}>
        <TouchableOpacity
          style={styles.registerPersonButton}
          onPress={() => router.push("/person-capture")}>
          <Text style={styles.registerPersonButtonTitle}>Register New Person</Text>
        </TouchableOpacity>
      </View>

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
export default PersonRegistrationScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",
  },
  topBar: {height: 120,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 8,borderBottomRightRadius: 8,},
  topTitle: {fontSize: 24,fontWeight: "800",color: "#000",},

  centerArea: {flex: 1,alignItems: "center",justifyContent: "center",paddingHorizontal: 24,},
  registerPersonButton: {width: "100%",backgroundColor: "#f4b500",borderRadius: 24,paddingVertical: 40,
    paddingHorizontal: 20,borderWidth: 2,borderColor: "#f4b500",alignItems: "center",},
  registerPersonButtonTitle: {fontSize: 22,fontWeight: "800",color: "#000",marginBottom: 8,textAlign: "center",},

  bottomBar: {flexDirection: "row",justifyContent: "space-between",paddingHorizontal: 20,paddingVertical: 12,},
  bottomButton: {flex: 1,backgroundColor: "#f4b500",height: 80,borderRadius: 18,marginHorizontal: 6,
    alignItems: "center",justifyContent: "center",},
  bottomButtonText: {fontSize: 18,fontWeight: "800",color: "#000",},


}

);
