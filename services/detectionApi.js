import { Platform } from "react-native";

// =====================
// 1. API Base URL
// =====================
// IMPORTANT:
// 192.168.18.255 is a broadcast address -> it will ALWAYS fail.
// Put your laptop's REAL IP here (the one running FastAPI).
export const API_BASE_URL = "http://192.168.100.6:8000"; // <-- CHANGE THIS

const buildUrl = (endpoint, params) => {
  const qs = new URLSearchParams();

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        qs.append(k, String(v));
      }
    });
  }

  const query = qs.toString();
  return `${API_BASE_URL}${endpoint}${query ? `?${query}` : ""}`;
};

const normalizeUriForUpload = (imageUri) => {
  if (!imageUri) return "";
  return Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri;
};

const getMimeType = (filename) => {
  const ext = (filename.split(".").pop() || "jpg").toLowerCase();

  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "heic") return "image/heic";
  if (ext === "webp") return "image/webp";

  return "image/jpeg";
};

const safeParseJson = (text) => {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const uploadImage = async (endpoint, imageUri, params) => {
  try {
    if (!imageUri) {
      throw new Error("No image URI provided");
    }

    const formData = new FormData();

    const filename = imageUri.split("/").pop() || "photo.jpg";
    const mime = getMimeType(filename);
    const normalizedUri = normalizeUriForUpload(imageUri);

    formData.append("file", {
      uri: normalizedUri,
      name: filename,
      type: mime,
    });

    const url = buildUrl(endpoint, params);

    console.log("[uploadImage] POST", url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const rawText = await response.text();
    const parsed = safeParseJson(rawText);

    console.log("[uploadImage] status:", response.status);
    console.log("[uploadImage] raw response:", rawText);

    if (!response.ok) {
      const backendMessage =
        parsed?.detail ||
        parsed?.message ||
        rawText ||
        "Unknown server error";

      throw new Error(`API Error: ${response.status} - ${backendMessage}`);
    }

    if (!parsed) {
      throw new Error("API returned empty or invalid JSON response");
    }

    return parsed;
  } catch (err) {
    console.error("Upload Image Error:", err);
    throw err;
  }
};

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

export const detectClothesWithColor = async (imageUri, confidence = 0.3) => {
  return uploadImage("/detect-objects-with-color", imageUri, { confidence });
};

export const checkApiHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const rawText = await response.text();
    const data = safeParseJson(rawText);

    return data?.status === "healthy" || data?.ok === true;
  } catch (err) {
    console.error("Health Check Error:", err);
    return false;
  }
};