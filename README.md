# SmartSort AI ♻️
**Next-Generation Waste Segregation System**

SmartSort is a full-stack AI platform that uses Computer Vision to classify waste in real-time. Designed with a decoupled architecture, it provides instant disposal instructions based on BBMP (Bengaluru) guidelines.

## 📊 Performance Metrics
- **Validation Accuracy:** 91%
- **Training Accuracy:** 97%
- **Model:** MobileNetV2 (Functional API)
- **Classes:** 12 (Battery, Biological, Glass, Metal, Plastic, etc.)

## 🏛️ System Architecture
The project follows a **Three-Tier Architecture** to ensure scalability and separation of concerns.

### 1. Client Tier (Frontend)
- **Framework:** Next.js 15 (App Router)
- **Logic:** Handles the MediaDevices API for camera access and processes image frames into Blobs.
- **State:** Manages scan history and real-time UI updates via Tailwind CSS.

### 2. API Tier (Backend)
- **Framework:** FastAPI
- **Process:** Acts as a RESTful bridge. Receives multipart/form-data, normalizes image tensors to [0, 1], and handles CORS for secure cross-origin communication.

### 3. Inference Tier (ML Model)
- **Engine:** TensorFlow 2.18
- **Confidence Guard:** Implements a 0.70 threshold logic to prevent false positives for "out-of-distribution" objects.

## 🚀 Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```


### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```