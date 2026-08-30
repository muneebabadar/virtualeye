# V-Eye 👁️

### Assistive Computer Vision for Visually Impaired Users in Pakistan

V-Eye is an **accessible mobile application designed specifically for visually impaired individuals in Pakistan**. It combines computer vision, deep learning, and accessible mobile design to provide real-time information about the user's surroundings through **audio and haptic feedback**.

The application is designed around the Pakistani context, supporting **Pakistani currency, indoor environments, Urdu and English feedback**, and accessibility standards based on **WCAG Level AA guidelines**.

> **Final Year Project | Computer Vision, Deep Learning & Accessible Technology**

V-Eye uses a smartphone camera to analyze the user's environment and provide **real-time audio and haptic feedback**.

The application contains four core modes, each designed around a specific everyday challenge faced by visually impaired users.

### 1. 🔍 Object Detection

Provides real-time awareness of objects and obstacles in the user's surroundings.

* Detects common indoor objects
* Provides audio descriptions of detected objects
* Helps users understand their immediate surroundings
* Supports safer movement through indoor environments
* Designed for environments such as homes, classrooms, and workplaces

### 2. 💵 Currency Detection

Identifies **Pakistani Rupee (PKR) banknotes** using a fine-tuned YOLOv8 model.

* Recognizes Pakistani currency denominations
* Provides the detected denomination through audio feedback
* Helps users independently identify money
* Specifically trained for Pakistani currency

### 3. 🎨 Color Detection

Identifies the dominant color of an object shown to the camera.

* Provides spoken color feedback
* Helps users identify clothing as well as its 4 prominent colours
* Supports independent clothing selection
* Reduces the need to ask others about the appearance of objects

### 4. 👤 Person Recognition

Recognizes familiar people previously registered by the user.

* Allows users to register known individuals
* Detects registered faces using the camera
* Announces the person's name when recognized
* Provides private awareness of who is nearby
* Helps reduce the need to ask others to identify people

---

## ♿ Accessibility

Accessibility is a core design principle of V-Eye.

The application was designed and evaluated with **WCAG Level AA accessibility guidelines** in mind, alongside mobile accessibility practices for visually impaired users.

### WCAG Level AA

V-Eye aims to provide an accessible experience aligned with **WCAG Level AA principles**, including:

* Perceivable interface elements
* Clear and predictable interaction
* Accessible navigation
* Appropriate contrast and visual hierarchy
* Screen-reader compatibility
* Meaningful accessibility labels
* Non-visual feedback for important interactions
* Consistent interface behavior
* Accessible controls and touch targets

### Assistive Features

V-Eye also provides:

* 🗣️ **Urdu and English audio feedback**
* 📳 **Haptic feedback** for interaction confirmation
* 🔊 Audio-first interaction
* ♿ **TalkBack compatibility**
* Simple and predictable navigation
* One-handed operation
* Clear and accessible interactive elements
* Minimal visual complexity

The goal is to ensure that users can operate the application without depending on visual information alone.

---

## 🧠 Technology Stack

### Frontend

* **React Native**
* **Expo**
* TypeScript
* Android
* Camera integration
* TalkBack accessibility support
* Audio feedback
* Haptic feedback

### Backend

* **Python**
* **FastAPI**
* Uvicorn

### Computer Vision

* **YOLOv8**
* Fine-tuned object detection models
* Image preprocessing
* Pakistani currency recognition
* Person recognition
* Color detection

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following are installed:

* Python 3
* Node.js
* npm
* Expo CLI / Expo Go
* Android smartphone
* Git

The phone and development laptop should be connected to the **same Wi-Fi network** when testing the application locally.

---

## 1. Clone the Repository

```bash
git clone https://github.com/muneebabadar/virtualeye.git
cd v-eye
```

---

## 2. Backend Setup

Go to the backend folder:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python3 -m venv .venv
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Run the Backend

Start the FastAPI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will run on:

```text
http://0.0.0.0:8000
```

Test the API using:

```bash
curl http://127.0.0.1:8000/health
```

A successful response confirms that the backend is running correctly.

---

## 4. Get Your Laptop IP Address

The mobile application needs the laptop's local IP address to communicate with the FastAPI backend.

### macOS

Run:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for an address similar to:

```text
192.168.x.x
```

or:

```text
10.x.x.x
```

For example:

```text
inet 192.168.18.206
```

Copy your local IP address.

---

## 5. Frontend Setup

From the project root, navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Scan the displayed QR code using **Expo Go** on your Android device.

Make sure the laptop and phone are connected to the same network.

---

## 6. Configure Backend IP

Before running the application, update the backend IP address in the frontend configuration.

### A. Detection API

Open:

```text
virtualeye/services/detectionApi.js
```

Update:

```javascript
export const API_BASE_URL = "http://192.168.18.206:8000";
```

Replace `192.168.18.206` with your laptop's local IP address.

For example:

```javascript
export const API_BASE_URL = "http://YOUR_LAPTOP_IP:8000";
```

### B. Person Recognition API

Open:

```text
virtualeye/services/personRecognitionApi.ts
```

Update:

```typescript
const BACKEND_IP = '192.168.18.206';
const BACKEND_PORT = '8000';
```

Replace the IP address with your laptop's local IP:

```typescript
const BACKEND_IP = 'YOUR_LAPTOP_IP';
const BACKEND_PORT = '8000';
```

---

## 📱 Running the Application

Once the backend and Expo development server are running:

1. Start the FastAPI backend.
2. Find your laptop's local IP address.
3. Update the backend IP in the frontend API configuration.
4. Start Expo using `npx expo start`.
5. Connect your Android phone to the same Wi-Fi network.
6. Open the project through Expo Go.
7. Select one of the four V-Eye modes.
8. Point the camera toward the relevant object, person, or environment.
9. Receive the result through audio and haptic feedback.

---
