import { Link } from "expo-router";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" accessibilityLabel="Modal title">
        This is a modal
      </ThemedText>

      <Link
        href="/"
        dismissTo
        style={styles.link}
        accessibilityRole="link"
        accessibilityLabel="Go to home screen"
        accessibilityHint="Closes the modal and returns to home screen"
      >
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  link: { marginTop: 15, paddingVertical: 15 },
});
