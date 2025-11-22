import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, } from "react-native";

const PersonReviewScreen=()=> {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; count?: string }>();

  const personName = (params.name ?? "name").toString();
  const photosCount = Number(params.count ?? "5");

  const handleSave = () => {
    router.replace("/person-registration" as any);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Ready to Save</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nameCardOuter}>
          <View style={styles.nameCardInner}>
            <Text style={styles.nameText}>{personName}</Text>
            <Text style={styles.countText}>
              {photosCount} photos captured
            </Text>
          </View>
        </View>

        <Text style={styles.description}>Review completed. Tap below to save this person&apos;s profile.</Text>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default PersonReviewScreen
const styles = StyleSheet.create({
  root: {flex: 1,backgroundColor: "#020713",},

  header: {height: 120,backgroundColor: "#f4b500",borderBottomLeftRadius: 16,borderBottomRightRadius: 16,
    flexDirection: "row",alignItems: "center",paddingHorizontal: 20,gap: 12,},
  headerTitle: {fontSize: 22,fontWeight: "700",color: "#000",},

  content: {flex: 1,paddingHorizontal: 24,justifyContent: "center",   alignItems: "center",paddingTop: 40,},
  nameCardOuter: {borderRadius: 18,borderWidth: 3,borderColor: "#f4b500",padding: 4,backgroundColor: "transparent",
    marginBottom: 28,width: "85%",height: 120,},
  nameCardInner: {backgroundColor: "#050b18",borderRadius: 14,paddingVertical: 20,paddingHorizontal: 16,
    alignItems: "center",},
  nameText: {fontSize: 22,fontWeight: "700",color: "#f9fafb",marginBottom: 6,},

  countText: {fontSize: 14,color: "#d1d5db",},
  description: {fontSize: 14,color: "#e5e7eb",textAlign: "center",marginBottom: 30,},

  saveButton: {backgroundColor: "#16a34a",height: 80,borderRadius: 18,borderWidth: 3,borderColor: "#ffffff",
    alignItems: "center",justifyContent: "center",width: "85%",},
  saveButtonText: {fontSize: 20,fontWeight: "700",color: "#ffffff",},

}
);
