from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io

app = FastAPI()

# 1. Precise CORS Configuration
# Listing specific origins is safer and more reliable for production
origins = [
    "http://localhost:3000",                  # Local Next.js dev server
    "https://smart-sort-lac.vercel.app",      # Your Production Frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the "SmartSort Final" brain
MODEL = tf.keras.models.load_model('smartsort_final.keras')

# 3. Final Class Mapping
CLASS_NAMES = [
    'battery', 'biological', 'brown-glass', 'cardboard', 'clothes', 
    'glass', 'metal', 'paper', 'plastic', 'shoes', 'trash', 'white-glass'
]

@app.get("/")
def health_check():
    return {
        "status": "SmartSort Engine Active", 
        "classes_ready": len(CLASS_NAMES),
        "version": "2.0.0"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Read and Process Image
    content = await file.read()
    image = Image.open(io.BytesIO(content)).convert('RGB').resize((224, 224))
    
    # 2. Preprocessing
    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # 3. Inference
    predictions = MODEL.predict(img_array)
    predicted_index = np.argmax(predictions[0])
    confidence = float(np.max(predictions[0]))

    # 4. Confidence Guard (The "Unknown" Filter)
    if confidence < 0.70:
        return {
            "prediction": "unknown",
            "confidence": confidence,
            "message": "Object not recognized clearly. Please move closer or check lighting."
        }

    # 5. Success Return
    return {
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": confidence,
        "message": f"Identified as {CLASS_NAMES[predicted_index]} with {confidence:.1%} confidence."
    }