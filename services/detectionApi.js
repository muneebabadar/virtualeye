// import Constants from "expo-constants";

// const API_BASE_URL = "http://192.168.1.5:8000";

// // Reusable helper: upload image and return API result
// const uploadImage = async (imageUri, confidenceThreshold) => {
//   try {
//     const formData = new FormData();

//     const filename = imageUri.split("/").pop() || "photo.jpg";
//     const ext = filename.split(".").pop() || "jpg";

//     formData.append("file", {
//       uri: imageUri,
//       name: filename,
//       type: `image/${ext}`,
//     });

//     const response = await fetch(`${API_BASE_URL}/detect/`, {
//       method: "POST",
//       body: formData,
//       headers: {
//         Accept: "application/json",
//       },
//     });

//     if (!response.ok) {
//       const msg = await response.text();
//       throw new Error(`API Error: ${response.status} - ${msg}`);
//     }

//     return await response.json();
//   } catch (err) {
//     console.error("Detection Upload Error:", err);
//     throw err;
//   }
// };

// // Currency detection
// export const detectCurrency = async (imageUri, confidenceThreshold = 0.5) => {
//   console.log("Running currency detection");
//   return uploadImage(imageUri, confidenceThreshold);
// };

// // Object detection (general YOLO)
// export const detectObjects = async (imageUri, confidenceThreshold = 0.3) => {
//   console.log("Running object detection");
//   return uploadImage(imageUri, confidenceThreshold);
// };

// // API health
// export const checkApiHealth = async () => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/health`);
//     if (!response.ok) return false;

//     const data = await response.json();
//     console.log("Health response:", data);

//     // Check if both models are loaded
//     const modelsLoaded = data.models_loaded?.currency_detector && data.models_loaded?.object_detector;
//     return data.status === "healthy" && modelsLoaded;
//   } catch (error) {
//     console.error("Health Check Error:", error);
//     return false;
//   }
// };


// export { API_BASE_URL };


import { Platform } from "react-native";

// =====================
// 1. API Base URL
// =====================
// Make sure this matches your FastAPI server IP on the same network
export const API_BASE_URL = "http://10.20.4.185:8000";

// =====================
// 2. Helper: Upload Image
// =====================
const uploadImage = async (endpoint, imageUri) => {
  try {
    const formData = new FormData();

    // Get filename and extension from URI
    const filename = imageUri.split("/").pop() || "photo.jpg";
    const ext = filename.split(".").pop() || "jpg";

    // Append file to FormData
    formData.append("file", {
      uri: Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
      name: filename,
      type: `image/${ext}`,
    });

    // POST request to API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`API Error: ${response.status} - ${msg}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Upload Image Error:", err);
    throw err;
  }
};

// =====================
// 3. Exported Functions
// =====================
export const detectCurrency = async (imageUri, confidence = 0.5) => {
  return uploadImage("/detect-currency", imageUri);
};

export const detectObjects = async (imageUri, confidence = 0.3) => {
  return uploadImage("/detect-objects", imageUri);
};

// =====================
// 4. Health Check
// =====================
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.status === "healthy";
  } catch (err) {
    console.error("Health Check Error:", err);
    return false;
  }
};
