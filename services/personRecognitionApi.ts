// import * as FileSystem from 'expo-file-system/legacy';
// import * as Speech from 'expo-speech';


// // Update this to your computer's local IP address (find via: ipconfig in PowerShell)
// // Example: "192.168.1.100"
// //home ip. '192.168.18.206'
// //js ip 10.220.94.36

// const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || '10.220.94.36';
// const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '8000';
// const BACKEND_URL = `http://${BACKEND_IP}:${BACKEND_PORT}`;

// console.log(`[PersonRecognitionAPI] Backend URL: ${BACKEND_URL}`);


// export interface PersonRegisterResponse {
//   success: boolean;
//   name?: string;
//   num_embeddings?: number;
//   error?: string;
// }

// export interface DetectionResult {
//   success?: boolean;
//   detections?: Array<{
//     class_name: string;
//     class: number;
//     confidence: number;
//     bbox?: [number, number, number, number];
//   }>;
//   persons?: Array<{
//     label: string;  // Person's name or "person" if unknown
//     bbox: [number, number, number, number];
//     similarity?: number;
//   }>;
//   tts_messages?: string[];
//   count?: number;
// }

// export async function checkBackendHealth(): Promise<boolean> {
//   try {
//     const response = await fetch(`${BACKEND_URL}/health`, {
//       method: 'GET',
//       timeout: 5000,
//     } as any);
//     const data = await response.json();
//     console.log('[PersonRecognitionAPI] Backend health:', data);
//     return data.status === 'healthy' || data.person_recognition_available === true;
//   } catch (error) {
//     console.error('[PersonRecognitionAPI] Health check failed:', error);
//     return false;
//   }
// }



// /**
//  * Register a new person with multiple face photos
//  * @param name - Person's name
//  * @param imageUris - Array of 3-5 image URIs (from camera or gallery)
//  * @returns Registration response with success status and TTS feedback
//  */
// export async function registerPerson(
//   name: string,
//   imageUris: string[]
// ): Promise<PersonRegisterResponse> {
//   try {
//     if (!name || name.trim().length === 0) {
//       throw new Error('Name is required');
//     }

//     if (imageUris.length < 3) {
//       throw new Error(`Need at least 3 images, got ${imageUris.length}`);
//     }

//     console.log(`[PersonRecognitionAPI] Registering person "${name}" with ${imageUris.length} images`);

//     // Read all images as base64
//     const imageBase64Array: string[] = [];
    
//     for (let i = 0; i < imageUris.length; i++) {
//       const uri = imageUris[i];
//       try {
//         const base64 = await FileSystem.readAsStringAsync(uri, {
//           encoding: FileSystem.EncodingType.Base64,
//         });
        
//         if (!base64 || base64.length === 0) {
//           console.error(`[PersonRecognitionAPI] Empty base64 for image ${i + 1}`);
//           continue;
//         }
        
//         imageBase64Array.push(base64);
//         console.log(`[PersonRecognitionAPI] Read image ${i + 1}: ${base64.length} base64 chars`);
//       } catch (fileError) {
//         console.error(`[PersonRecognitionAPI] Error reading image ${i + 1}:`, fileError);
//       }
//     }
    
//     if (imageBase64Array.length < 3) {
//       throw new Error(`Only ${imageBase64Array.length} images could be read. Need at least 3.`);
//     }

//     // Send as JSON with base64 strings
//     const payload = {
//       name: name.trim(),
//       images: imageBase64Array,
//     };

//     const jsonBody = JSON.stringify(payload);
//     console.log(`[PersonRecognitionAPI] Sending JSON payload:`, {
//       name: payload.name,
//       imageCount: payload.images.length,
//       firstImageLength: payload.images[0]?.length || 0,
//       totalBodySize: jsonBody.length,
//     });

//     // Send registration request as JSON
//     const result = await fetch(`${BACKEND_URL}/api/person/register`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//       },
//       body: jsonBody,
//     });

//     const data: PersonRegisterResponse = await result.json();

//     console.log('[PersonRecognitionAPI] Registration response:', data);

//     // Play TTS feedback
//     if (data.success) {
//       await speakMessage(`Profile saved for ${name}`);
//     } else {
//       let errorMessage = 'Registration failed';
//       if (data.error === 'no_face_detected') {
//         errorMessage = 'No face detected in images. Please try again.';
//       } else if (data.error === 'duplicate_name') {
//         errorMessage = `Name "${name}" already exists. Choose another name.`;
//       }
//       await speakMessage(errorMessage);
//     }

//     return data;
//   } catch (error) {
//     const errorMsg = error instanceof Error ? error.message : 'Unknown error';
//     console.error('[PersonRecognitionAPI] Registration error:', errorMsg);
//     await speakMessage(`Error: ${errorMsg}`);
//     return {
//       success: false,
//       error: errorMsg,
//     };
//   }
// }


// /**
//  * Detect objects and persons in a single image frame
//  * @param imageUri - URI of the image file (file:// or local path)
//  * @returns Detection result with objects, persons, and TTS messages
//  */
// export async function detectObjectsAndPersons(
//   imageUri: string
// ): Promise<DetectionResult | null> {
//   try {
//     console.log(`[PersonRecognitionAPI] Detecting in image: ${imageUri}`);

//     // Create FormData with the image file
//     const formData = new FormData();
//     const filename = imageUri.split('/').pop() || 'frame.jpg';
//     const fileType = filename.split('.').pop() || 'jpg';

//     formData.append('file', {
//       uri: imageUri,
//       name: filename,
//       type: `image/${fileType}`,
//     } as any);

//     // Send detection request
//     const response = await fetch(`${BACKEND_URL}/detect/`, {
//       method: 'POST',
//       body: formData,
//       headers: {
//         'Accept': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`[PersonRecognitionAPI] Detection failed: ${response.status} - ${errorText}`);
//       return null;
//     }

//     const data: DetectionResult = await response.json();
//     console.log('[PersonRecognitionAPI] Detection response:', data);

//     return data;
//   } catch (error) {
//     const errorMsg = error instanceof Error ? error.message : 'Unknown error';
//     console.error('[PersonRecognitionAPI] Detection error:', errorMsg);
//     return null;
//   }
// }

// /**
//  * Speak a message using device TTS
//  * @param text - Text to speak
//  * @param language - Language code (default: 'en')
//  */
// export async function speakMessage(
//   text: string,
//   language: string = 'en'
// ): Promise<void> {
//   try {
//     if (!text || text.trim().length === 0) {
//       return;
//     }

//     console.log(`[PersonRecognitionAPI] Speaking: "${text}"`);
    
//     await Speech.speak(text, {
//       language: language,
//       pitch: 1.0,
//       rate: 1.0,
//     });
//   } catch (error) {
//     console.error('[PersonRecognitionAPI] TTS error:', error);
//     // Non-fatal - don't throw
//   }
// }


// export function stopSpeech(): void {
//   try {
//     Speech.stop();
//   } catch (error) {
//     console.error('[PersonRecognitionAPI] Stop speech error:', error);
//   }
// }


import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

// =====================
// Backend URL
// =====================
const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || "10.20.2.229";
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

    // ✅ MUST call this endpoint to do recognition
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
