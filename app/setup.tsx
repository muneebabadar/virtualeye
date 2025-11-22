import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const SetupScreen=()=> {
  //language as var and setLanguage as function where defualt is english and the language variable can either be en or ur
  const [language, setLanguage] = useState<"en" | "ur">("en");
  //const [email, setEmail] = useState("");
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace("/object-navigation");
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
      </View>

      <View style={styles.languageCard}>
        <Text style={styles.languageCardTitle}>Language Support</Text>
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[styles.languageButton,language === "en" && styles.languageButtonActive,]}
            //on click run the setlanguage function
            onPress={() => setLanguage("en")}>
            <Text style={[styles.languageText,language === "en" && styles.languageTextActive,]}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.languageButton,language === "ur" && styles.languageButtonActive,]}
            onPress={() => setLanguage("ur")}>
            <Text style={[styles.languageText,language === "ur" && styles.languageTextActive,]}>Urdu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.emailSection}>
        <Text style={styles.emailSectionTitle}>Enter Your Email</Text>
        <Text style={styles.emailSectionSubtitle}>
          We'll use this to save your person recognition data on your device.
        </Text>

        <View style={styles.emailInputWrapper}>
          <TextInput
            style={styles.emailInput}
            placeholder="your.email@example.com"
            placeholderTextColor="#9ca3af"
            //keyboardType="email-address"
            // value={email}
            // onChangeText={setEmail}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
        <Text style={styles.getStartedButtonText}>Get Started</Text>
      </TouchableOpacity>


    </View>
  );
}
export default SetupScreen

const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",paddingHorizontal: 28,paddingTop: 70,paddingBottom: 40,},

  topBar: {height: 80,backgroundColor: "#f4b500",justifyContent: "center",alignItems: "center",
    borderBottomLeftRadius: 12,borderBottomRightRadius: 12,width:"100%"},

  languageCard: {width: "100%",backgroundColor: "#101827",borderRadius: 18,borderWidth: 2,
    borderColor: "#E5E7EB",padding: 22,marginTop:24,marginBottom: 28,},
  languageCardTitle: {fontSize: 22,fontWeight: "700",color: "#f4b500",marginBottom: 20,},
  languageRow: {flexDirection: "row",gap: 16,},
  languageButton: {flex: 1,backgroundColor: "#050b18",borderRadius: 14,paddingVertical: 20,
    alignItems: "center",},
  languageButtonActive: {backgroundColor: "#1f2937",borderColor: "#f4b500",borderWidth: 2,},
  languageText: {color: "#9ca3af",fontSize: 18,},
  languageTextActive: {color: "#fff",fontWeight: "700",},

  emailSection: {width: "100%",marginBottom: 30,},
  emailSectionTitle: {fontSize: 22,color: "#f4b500",fontWeight: "700",marginBottom: 10,},
  emailSectionSubtitle: {fontSize: 16,color: "#E5E7EB",marginBottom: 16,},
  emailInputWrapper: {borderRadius: 16,borderWidth: 2,borderColor: "#E5E7EB",paddingHorizontal: 16,
    backgroundColor: "#101827",},
  emailInput: {height: 50,color: "#fff",fontSize: 18,},

  getStartedButton: {width: "100%",backgroundColor: "#f4b500",borderRadius: 18,paddingVertical: 20,
    alignItems: "center",marginBottom: 16,},
  getStartedButtonText: {color: "#000",fontSize: 22,fontWeight: "800",},


}

);
