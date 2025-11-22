import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
 

const PersonNameScreen=() =>{
  const router = useRouter();
  const [name, setName] = useState("");

  const handleContinue = () => {
    if (!name) return;
    router.replace({pathname: "/person-review",params: {name: name,count: "5",},});
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Person Registration</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Photos Complete!</Text>
        <Text style={styles.subtitle}>Enter name for this person</Text>

        <View style={styles.inputWrapper}>
          <TextInput style={styles.input}placeholder="Enter name"placeholderTextColor="#9ca3af"value={name}
          onChangeText={setName}
          />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default PersonNameScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",},

  header: {height: 120,backgroundColor: "#f4b500",borderBottomLeftRadius: 12,borderBottomRightRadius: 12,
    flexDirection: "row",alignItems: "center",paddingHorizontal: 20,gap: 14,},
  headerTitle: {fontSize: 24,fontWeight: "700",color: "#000",},

  content: {flex: 1,justifyContent: "center",   paddingHorizontal: 24,},
  title: {color: "#f4b500",fontSize: 22,fontWeight: "700",textAlign: "center",marginBottom: 10,},
  subtitle: {color: "#e5e7eb",fontSize: 18,textAlign: "center",marginBottom: 20,},
  inputWrapper: {borderRadius: 14,borderWidth: 2,borderColor: "#e5e7eb",paddingHorizontal: 12,
    paddingVertical: 10,backgroundColor: "#050b18",marginBottom: 30,},
  input: {height: 50,fontSize: 20,color: "#fff",},

  button: {backgroundColor: "#f4b500",height: 80,borderRadius: 18,alignItems: "center",justifyContent: "center",},
  buttonText: {fontSize: 22,fontWeight: "800",color: "#000",},

}

);
