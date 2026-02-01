Backend Setup (FastAPI)
Go to backend:
cd /Users/ashbahfaisal/Desktop/virtualeye/virtualeye/backend
Create venv + activate:
python3 -m venv .venv
source .venv/bin/activate
Install dependencies (matches your requirements.txt):
pip install --upgrade pip
pip install -r requirements.txt

Run Backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Test:
curl http://127.0.0.1:8000/health
4) Get Your Laptop IP (so phone can reach backend)
macOS:
ifconfig | grep "inet " | grep -v 127.0.0.1
Look for something like:
192.168.x.x
10.x.x.x
Example:
inet 192.168.18.206
5) Frontend Setup (Expo)
Go to frontend folder (the one that has package.json):
cd /Users/ashbahfaisal/Desktop/virtualeye/virtualeye/virtualeye
Install:
npm install
Start Expo:
npx expo start
Scan QR using Expo Go.


Update both:
A) virtualeye/services/detectionApi.js
export const API_BASE_URL = "http://192.168.18.206:8000"; // change to your IP
B) virtualeye/services/personRecognitionApi.ts
const BACKEND_IP = '192.168.18.206'; // change to your IP
const BACKEND_PORT = '8000';
