import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

// =====================
// Backend URL
// =====================
const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || "192.168.18.51";
const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || "8000";
export const BACKEND_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;

console.log(`[PersonRecognitionAPI] Backend URL: ${BACKEND_URL}`);

// =====================
// Types
// =====================
export interface PersonRegisterResponse {
  success: boolean;
  name?: string;
  num_embeddings?: number;
  error?: string;
  message?: string;
}

export interface DetectionResult {
  success?: boolean;
  mode?: string;

  detections?: Array<{
    class_name: string;
    class_id: number;
    confidence: number;
    bbox?: [number, number, number, number];
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }>;

  persons?: Array<{
    label: string; // name or "person"
    bbox: [number, number, number, number];
    similarity?: number | null;
    position?: "left" | "center" | "right";
    distance?: "very_close" | "close" | "medium" | "far";
  }>;

  tts_messages?: string[];
  count?: number;
}

// =====================
// Health Check (AbortController, 5s)
// =====================
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    console.log("[PersonRecognitionAPI] Backend health:", data);

    return data.status === "healthy";
  } catch (error) {
    console.error("[PersonRecognitionAPI] Health check failed:", error);
    return false;
  }
}

// =====================
// Register Person (base64 JSON)
// =====================
export async function registerPerson(
  name: string,
  imageUris: string[]
): Promise<PersonRegisterResponse> {
  try {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }

    if (!imageUris || imageUris.length < 3) {
      throw new Error(`Need at least 3 images, got ${imageUris?.length || 0}`);
    }

    console.log(
      `[PersonRecognitionAPI] Registering person "${name}" with ${imageUris.length} images`
    );

    const imageBase64Array: string[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!base64 || base64.length === 0) {
          console.error(`[PersonRecognitionAPI] Empty base64 for image ${i + 1}`);
          continue;
        }

        imageBase64Array.push(base64);
        console.log(
          `[PersonRecognitionAPI] Read image ${i + 1}: ${base64.length} base64 chars`
        );
      } catch (fileError) {
        console.error(
          `[PersonRecognitionAPI] Error reading image ${i + 1}:`,
          fileError
        );
      }
    }

    if (imageBase64Array.length < 3) {
      throw new Error(
        `Only ${imageBase64Array.length} images could be read. Need at least 3.`
      );
    }

    const payload = {
      name: name.trim(),
      images: imageBase64Array,
    };

    const jsonBody = JSON.stringify(payload);
    console.log("[PersonRecognitionAPI] Sending JSON payload:", {
      name: payload.name,
      imageCount: payload.images.length,
      firstImageLength: payload.images[0]?.length || 0,
      totalBodySize: jsonBody.length,
    });

    const result = await fetch(`${BACKEND_URL}/api/person/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: jsonBody,
    });

    const data: PersonRegisterResponse = await result.json();
    console.log("[PersonRecognitionAPI] Registration response:", data);

    if (data.success) {
      await speakMessage(`Profile saved for ${name}`);
    } else {
      let msg = data.message || "Registration failed";
      if (data.error === "no_face_detected") msg = "No face detected. Try again.";
      if (data.error === "duplicate_name") msg = `Name ${name} already exists.`;
      await speakMessage(msg);
    }

    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[PersonRecognitionAPI] Registration error:", errorMsg);
    await speakMessage(`Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

// =====================
// Detect objects + persons (YOUR PIPELINE ENDPOINT)
// =====================
export async function detectObjectsAndPersons(
  imageUri: string
): Promise<DetectionResult | null> {
  try {
    console.log(`[PersonRecognitionAPI] Detecting in image: ${imageUri}`);

    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "frame.jpg";
    const ext = filename.split(".").pop() || "jpg";

    formData.append("file", {
      uri: Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
      name: filename,
      type: `image/${ext}`,
    } as any);

    //MUST call this endpoint to do recognition
    const response = await fetch(`${BACKEND_URL}/object-navigation-detect`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[PersonRecognitionAPI] Detection failed: ${response.status} - ${errorText}`
      );
      return null;
    }

    const data: DetectionResult = await response.json();
    console.log("[PersonRecognitionAPI] Detection response:", data);
    return data;
  } catch (error) {
    console.error("[PersonRecognitionAPI] Detection error:", error);
    return null;
  }
}

// =====================
// TTS helpers
// =====================
export async function speakMessage(text: string, language: string = "en") {
  try {
    if (!text || text.trim().length === 0) return;

    console.log(`[PersonRecognitionAPI] Speaking: "${text}"`);

    Speech.speak(text, {
      language,
      pitch: 1.0,
      rate: 1.0,
    });
  } catch (error) {
    console.error("[PersonRecognitionAPI] TTS error:", error);
  }
}

export function stopSpeech() {
  try {
    Speech.stop();
  } catch (error) {
    console.error("[PersonRecognitionAPI] Stop speech error:", error);
  }
}
