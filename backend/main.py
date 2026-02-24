from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io

app = FastAPI()

# 1. Essential for Next.js to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load the "SmartSort Final" brain
# Ensure the filename matches exactly what you downloaded
MODEL = tf.keras.models.load_model('smartsort_final.keras')

# 3. Final Class Mapping (from your Colab output)
# Order MUST match train_gen.class_indices exactly!
CLASS_NAMES = [
    'battery', 'biological', 'brown-glass', 'cardboard', 'clothes', 
    'glass', 'metal', 'paper', 'plastic', 'shoes', 'trash', 'white-glass'
]

@app.get("/")
def health_check():
    return {"status": "SmartSort Engine Active", "classes_ready": len(CLASS_NAMES)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Read and Process Image
    content = await file.read()
    image = Image.open(io.BytesIO(content)).convert('RGB').resize((224, 224))
    
    # 2. Preprocessing
    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # 3. Inference (Run the model FIRST)
    predictions = MODEL.predict(img_array)
    predicted_index = np.argmax(predictions[0])
    confidence = float(np.max(predictions[0]))

    # 4. Confidence Guard (The "Unknown" Filter)
    if confidence < 0.70:
        return {
            "prediction": "unknown", # Changed to lowercase to match frontend map
            "confidence": confidence,
            "message": "Object not recognized clearly. Please move closer or check lighting."
        }

    # 5. Success Return
    return {
        "prediction": CLASS_NAMES[predicted_index],
        "confidence": confidence,
        "message": f"Identified as {CLASS_NAMES[predicted_index]} with {confidence:.1%} confidence."
    }
    
    
"""97% training accuracy and 91% validation accuracy. For a 12-class waste classification problem, these numbers are world-class and perfect for your Major Project presentation."""
    