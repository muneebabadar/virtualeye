
import { Platform } from "react-native";

// =====================
// 1. API Base URL
// =====================
// Make sure this matches your FastAPI server IP on the same network

//ASHBAH HOME IP:
export const API_BASE_URL = "http://10.20.2.229:8000";

//ASHBAH WORK IP
// export const API_BASE_URL = "http://10.220.94.36:8000";


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

export const detectCurrency = async (imageUri, confidence = 0.5) => {
  return uploadImage("/detect-currency", imageUri);
};

export const detectObjects = async (imageUri, confidence = 0.3) => {
  return uploadImage("/detect-objects", imageUri);
};

export const detectColor = async (imageUri) => {
  return uploadImage("/detect-color-simple", imageUri);
};

export const detectObjectNavigation = async (imageUri, confidence = 0.25) => {
  return uploadImage("/object-navigation-detect", imageUri);
};
export const detectObjectsWithColor = async (imageUri, confidence = 0.25) => {
  return uploadImage("/detect-objects-with-color", imageUri);
};



// =====================
// 4. Health Check
// =====================
// export const checkApiHealth = async () => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/health`);
//     if (!response.ok) return false;

//     const data = await response.json();
//     return data.status === "healthy";
//   } catch (err) {
//     console.error("Health Check Error:", err);
//     return false;
//   }
// };
export const checkApiHealth = async () => {
  try {
    console.log('Checking API health at:', `${API_BASE_URL}/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Health check response status:', response.ok);
    
    if (!response.ok) {
      console.log('Health check failed with status:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('Health check data:', data);
    
    return data.status === "healthy";
  } catch (err) {
    console.error("Health Check Error:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    return false;
  }
};