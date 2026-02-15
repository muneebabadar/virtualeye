
// import { Platform } from "react-native";

// // =====================
// // 1. API Base URL
// // =====================
// // Make sure this matches your FastAPI server IP on the same network

// //ASHBAH HOME IP:
// export const API_BASE_URL = "http://92.168.18.255:8000";

// //ASHBAH WORK IP
// // export const API_BASE_URL = "http://10.220.94.36:8000";


// // =====================
// // 2. Helper: Upload Image
// // =====================
// const uploadImage = async (endpoint, imageUri) => {
//   try {
//     const formData = new FormData();

//     // Get filename and extension from URI
//     const filename = imageUri.split("/").pop() || "photo.jpg";
//     const ext = filename.split(".").pop() || "jpg";

//     // Append file to FormData
//     formData.append("file", {
//       uri: Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
//       name: filename,
//       type: `image/${ext}`,
//     });

//     // POST request to API
//     const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
//     console.error("Upload Image Error:", err);
//     throw err;
//   }
// };

// export const detectCurrency = async (imageUri, confidence = 0.5) => {
//   return uploadImage("/detect-currency", imageUri);
// };

// export const detectObjects = async (imageUri, confidence = 0.3) => {
//   return uploadImage("/detect-objects", imageUri);
// };

// export const detectColor = async (imageUri) => {
//   return uploadImage("/detect-color-simple", imageUri);
// };

// export const detectObjectNavigation = async (imageUri, confidence = 0.25) => {
//   return uploadImage("/object-navigation-detect", imageUri);
// };
// export const detectObjectsWithColor = async (imageUri, confidence = 0.25) => {
//   return uploadImage("/detect-objects-with-color", imageUri);
// };



// // =====================
// // 4. Health Check
// // =====================
// // export const checkApiHealth = async () => {
// //   try {
// //     const response = await fetch(`${API_BASE_URL}/health`);
// //     if (!response.ok) return false;

// //     const data = await response.json();
// //     return data.status === "healthy";
// //   } catch (err) {
// //     console.error("Health Check Error:", err);
// //     return false;
// //   }
// // };
// export const checkApiHealth = async () => {
//   try {
//     console.log('Checking API health at:', `${API_BASE_URL}/health`);
    
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
//     const response = await fetch(`${API_BASE_URL}/health`, {
//       signal: controller.signal,
//     });
    
//     clearTimeout(timeoutId);
    
//     console.log('Health check response status:', response.ok);
    
//     if (!response.ok) {
//       console.log('Health check failed with status:', response.status);
//       return false;
//     }

//     const data = await response.json();
//     console.log('Health check data:', data);
    
//     return data.status === "healthy";
//   } catch (err) {
//     console.error("Health Check Error:", err);
//     console.error("Error name:", err.name);
//     console.error("Error message:", err.message);
//     return false;
//   }
// };

// export const detectClothesWithColor = async (imageUri, confidence = 0.25) => {
//   return uploadImage("/detect-clothes-with-color", imageUri);
// };


import { Platform } from "react-native";

// =====================
// 1. API Base URL
// =====================
// IMPORTANT:
// 192.168.18.255 is a broadcast address -> it will ALWAYS fail.
// Put your laptop's REAL IP here (the one running FastAPI).
export const API_BASE_URL = "http://192.168.18.51:8000"; // <-- CHANGE THIS

// =====================
// 2. Helper: build URL with query params
// =====================
const buildUrl = (endpoint, params) => {
  const qs = new URLSearchParams();
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
  }
  return `${API_BASE_URL}${endpoint}${qs.toString() ? `?${qs}` : ""}`;
};

// =====================
// 3. Helper: Upload Image
// =====================
const uploadImage = async (endpoint, imageUri, params) => {
  try {
    const formData = new FormData();

    const filename = imageUri.split("/").pop() || "photo.jpg";
    const ext = (filename.split(".").pop() || "jpg").toLowerCase();

    // safer mime for jpg/jpeg
    const mime =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

    formData.append("file", {
      uri: Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
      name: filename,
      type: mime,
    });

    const url = buildUrl(endpoint, params);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        // DO NOT set Content-Type manually for FormData in RN
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
// 4. Existing modes (UNCHANGED behavior)
// =====================
export const detectCurrency = async (imageUri, confidence = 0.5) => {
  return uploadImage("/detect-currency", imageUri, { confidence });
};

export const detectObjects = async (imageUri, confidence = 0.3) => {
  return uploadImage("/detect-objects", imageUri, { confidence });
};

export const detectColor = async (imageUri) => {
  return uploadImage("/detect-color-simple", imageUri);
};

export const detectObjectNavigation = async (imageUri, confidence = 0.25) => {
  return uploadImage("/object-navigation-detect", imageUri, { confidence });
};

export const detectObjectsWithColor = async (imageUri, confidence = 0.25) => {
  return uploadImage("/detect-objects-with-color", imageUri, { confidence });
};

// ✅ Clothes-with-color: map to your working endpoint to avoid 404
// If your backend truly has /detect-clothes-with-color, you can switch back.
// But your earlier error shows 404 on that route.
export const detectClothesWithColor = async (imageUri, confidence = 0.25) => {
  return uploadImage("/detect-objects-with-color", imageUri, { confidence });
};

// =====================
// 5. Health Check (more reliable)
// =====================
export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `${API_BASE_URL}/health`;
    const response = await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();
    return data?.status === "healthy";
  } catch (err) {
    // "Network request failed" here means:
    // - wrong IP (most common, especially your .255)
    // - server not running
    // - phone/laptop not on same WiFi
    // - firewall blocking port 8000
    console.error("Health Check Error:", err);
    return false;
  }
};
