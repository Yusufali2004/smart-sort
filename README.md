# SmartSort AI ♻️
**Next-Generation AI-Powered Waste Segregation System**

> A full-stack Computer Vision platform that classifies waste in real-time and provides instant, localized disposal guidance based on **BBMP (Bengaluru) waste management guidelines**.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-black?style=for-the-badge)](https://smart-sort-lac.vercel.app/)
[![Model](https://img.shields.io/badge/Model-MobileNetV2-purple?style=for-the-badge)](https://github.com/Yusufali2004/smart-sort)
[![Accuracy](https://img.shields.io/badge/Val_Accuracy-91%25-green?style=for-the-badge)](https://github.com/Yusufali2004/smart-sort)
[![Classes](https://img.shields.io/badge/Waste_Classes-12-orange?style=for-the-badge)](https://github.com/Yusufali2004/smart-sort)

---

## 📑 Table of Contents

- [Live Deployment](#-live-deployment)
- [System Architecture](#-system-architecture)
- [Request–Response Lifecycle](#-requestresponse-lifecycle--sequence-diagram)
- [Component Pipeline](#-component-pipeline)
- [Disposal Guidelines](#-disposal-guidelines-bbmp-mapping)
- [Performance Metrics](#-performance-metrics)
- [Technical Stack](#-technical-stack)
- [Getting Started](#-getting-started)
- [Engineering Highlights](#-engineering-highlights)
- [Authentication & User Management](#-authentication--user-management)
- [User Dashboard](#-user-dashboard)
- [Database Architecture](#-database-architecture)
- [Complete Database Schema](#-complete-database-schema)
- [Row Level Security](#-row-level-security)
- [Complete SmartSort Data Flow](#-complete-smartsort-data-flow)
- [Application Routes](#-application-routes)
- [Environment Configuration](#-environment-configuration)
- [Current Application Capabilities](#-current-application-capabilities)
- [Current Runtime Versions](#-current-runtime-versions)
- [Team](#-team)
- [Impact](#-impact)

---

## 🌐 Live Deployment

| Service | Platform | URL |
|---------|----------|-----|
| 🎨 Frontend | Vercel | [smart-sort-lac.vercel.app](https://smart-sort-lac.vercel.app/) |
| ⚡ Backend API | Render | REST `/predict` endpoint |

---

## 🏛️ System Architecture

SmartSort follows a **Decoupled Three-Tier Architecture** to ensure scalability, separation of concerns, and high availability. Each tier is independently deployable and scalable.

```mermaid
graph TD
    subgraph CLIENT["🖥️  Client Tier — Vercel"]
        A["👤 User\nPhone Camera"] -->|"Capture frame"| B["⬡ Next.js 15\nApp Router"]
        B -->|"Resize 224×224\nNormalize [0,1]"| C{{"API Request"}}
    end

    subgraph SERVER["⚙️  API & Inference Tier — Render"]
        C -->|"POST /predict"| D["⚡ FastAPI Backend"]
        D -->|"Tensor preparation"| E["🧠 MobileNetV2\nInference Engine"]
        E -->|"Softmax · 12 classes"| F{{"Confidence > 0.70?"}}
        F -->|"YES"| G["✅ Identify Class\n+ BBMP Mapping"]
        F -->|"NO"| H["❓ Return 'Unknown'"]
    end

    G -->|"JSON response"| B
    H -->|"JSON response"| B
    B -->|"Display result"| A

    style CLIENT fill:#0f2027,stroke:#00cfff,color:#e2e8f0
    style SERVER fill:#0f2027,stroke:#f59e0b,color:#e2e8f0
    style E fill:#2d1b69,stroke:#a78bfa,color:#e2e8f0
    style D fill:#1a1a00,stroke:#f59e0b,color:#e2e8f0
    style B fill:#001a2e,stroke:#00cfff,color:#e2e8f0
    style G fill:#002200,stroke:#00ff9d,color:#e2e8f0
    style H fill:#2a0000,stroke:#ef4444,color:#e2e8f0
```

### 🔹 Tier 1 — Client (Frontend)
- **Framework:** Next.js 15 (App Router)
- **Camera Handling:** MediaDevices API + React-Webcam
- **Preprocessing:** Resizes and normalizes images to **224×224** client-side before transmission
- **UI:** Tailwind CSS with real-time feedback and scan history
- **State Management:** Prediction results and scan history persisted in React state

### 🔹 Tier 2 — API (Backend)
- **Framework:** FastAPI (Python 3.10) via Uvicorn
- Accepts `multipart/form-data` image uploads
- Normalizes pixel tensors to `[0, 1]`
- Handles CORS securely for cross-origin frontend requests
- Acts as REST bridge between the UI and the ML inference engine

### 🔹 Tier 3 — Inference (ML Engine)
- **Model:** MobileNetV2 (Transfer Learning — Functional API)
- **Confidence Guard:** 0.70 threshold prevents false-positive classifications
- Optimized for real-world variable lighting conditions

---

## 🔄 Request–Response Lifecycle — Sequence Diagram

Full end-to-end flow from camera capture to disposal guidance display:

```mermaid
sequenceDiagram
    autonumber

    actor U as 👤 User
    participant FE as ⬡ Next.js 15<br/>(Vercel)
    participant BE as ⚡ FastAPI<br/>(Render)
    participant ML as 🧠 MobileNetV2<br/>(Inference Engine)

    Note over U,ML: ── SmartSort AI · Request–Response Lifecycle ──

    U->>FE: Capture waste image via phone camera
    Note right of U: MediaDevices API / React-Webcam

    FE->>FE: Client-side preprocessing
    Note right of FE: Resize → 224×224 px<br/>Normalize pixel values [0, 1]<br/>Reduces network payload

    FE->>BE: POST /predict (multipart/form-data)
    Note right of FE: Async HTTP request<br/>Preprocessed image bytes

    BE->>BE: Decode image → NumPy tensor
    Note right of BE: Shape: (1, 224, 224, 3)<br/>Normalize to [0, 1]

    BE->>ML: Forward pass — tensor input
    Note right of BE: Prepared float32 tensor

    ML-->>BE: Probability distribution (12 classes)
    Note right of ML: Softmax output across<br/>Battery · Biological · Plastic · Glass<br/>Paper · Metal · Cardboard · Clothes<br/>Shoes · Trash · Brown-Glass · White-Glass

    BE->>BE: Confidence guard (threshold = 0.70)
    Note right of BE: score > 0.70 → identify class<br/>score ≤ 0.70 → return "Unknown"

    BE->>BE: Map result → BBMP disposal instruction
    Note right of BE: e.g. Plastic → "Blue Dry Waste Bin"<br/>Biological → "Green Compost Bin"<br/>Battery → "e-waste collection centre"

    BE-->>FE: JSON response
    Note right of BE: { class, confidence, instruction }

    FE-->>U: Render result + disposal guidance
    Note right of FE: Class label · Confidence % · Recycling tip
```

---

## 🔧 Component Pipeline

```mermaid
graph LR
    subgraph INPUT["📥 Input Module"]
        I1["Image Acquisition\nMediaDevices API"]
        I2["Client Preprocessing\n224×224 · Normalize"]
    end

    subgraph CORE["⚙️ Core Pipeline"]
        C1["FastAPI REST Layer\nPOST /predict"]
        C2["Tensor Converter\nNumPy · float32"]
        C3["MobileNetV2 Engine\nTransfer Learning"]
        C4["Confidence Guard\nThreshold = 0.70"]
    end

    subgraph OUTPUT["📤 Output Module"]
        O1["BBMP Mapper\n12 category rules"]
        O2["JSON Formatter\nclass · confidence · instruction"]
        O3["UI Renderer\nNext.js State Update"]
    end

    I1 --> I2 --> C1 --> C2 --> C3 --> C4 --> O1 --> O2 --> O3

    style INPUT fill:#001a2e,stroke:#00cfff,color:#e2e8f0
    style CORE fill:#1a0f00,stroke:#f59e0b,color:#e2e8f0
    style OUTPUT fill:#001a00,stroke:#00ff9d,color:#e2e8f0
```

---

## 📋 Disposal Guidelines (BBMP Mapping)

SmartSort doesn't just classify waste — it maps every prediction to **Bengaluru's BBMP segregation rules**, encouraging correct disposal at the source.

| Category | Item Types | Disposal Instruction |
|----------|------------|----------------------|
| 🔋 Hazardous | Battery | Take to designated e-waste collection centers. |
| 🌱 Organic | Biological | Place in the **Green Compost Bin**. |
| ♻️ Recyclable | Plastic, Glass, Metal, Cardboard | Rinse and place in the **Dry Waste (Blue) Bin**. |
| 👕 Textile | Clothes, Shoes | Donate if usable, else use textile recycling drop-off. |
| 🗑️ General | Trash | Dispose of in the **Landfill (Red) Bin**. |

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| ✅ Validation Accuracy | **91%** |
| 🏋️ Training Accuracy | **97%** |
| 🧠 Model Architecture | **MobileNetV2** |
| 📦 Total Classes | **12** |
| 📐 Input Dimensions | **224 × 224 × 3** |
| 🛡️ Confidence Threshold | **0.70** |

### 📦 Supported Waste Classes

| # | Class | # | Class |
|---|-------|---|-------|
| 1 | 🔋 Battery | 7 | ⚙️ Metal |
| 2 | 🧫 Biological | 8 | 📄 Paper |
| 3 | 🟤 Brown-Glass | 9 | 🧴 Plastic |
| 4 | 📦 Cardboard | 10 | 👟 Shoes |
| 5 | 👕 Clothes | 11 | 🗑️ Trash |
| 6 | 🫙 Glass | 12 | ⬜ White-Glass |

---

## 🛠️ Technical Stack

### 🎨 Frontend
| Tool | Purpose |
|------|---------|
| Next.js 15 (App Router) | UI framework & routing |
| Tailwind CSS | Utility-first responsive styling |
| React-Webcam | Camera access & frame capture |

### ⚙️ Backend
| Tool | Purpose |
|------|---------|
| FastAPI | REST API framework |
| Uvicorn | ASGI production server |
| Python 3.10 | Runtime |

### 🤖 Machine Learning
| Tool | Purpose |
|------|---------|
| TensorFlow 2.x | Deep learning framework |
| Keras | High-level model API |
| MobileNetV2 | Transfer learning base model |
| NumPy | Tensor operations |
| Pillow | Image decoding & preprocessing |

### 🚀 DevOps & Deployment
| Tool | Purpose |
|------|---------|
| GitHub | Version control & CI/CD |
| Vercel | Frontend hosting (CDN + edge) |
| Render | Backend hosting (auto-deploy) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Yusufali2004/smart-sort.git
cd smart-sort
```

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs available at: `http://localhost:8000/docs`

### 3️⃣ Frontend Setup

Create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 💡 Engineering Highlights

| Feature | Description |
|---------|-------------|
| 🛡️ Confidence Threshold | 0.70 guard prevents incorrect or ambiguous classifications from reaching the user |
| ⚡ Client-Side Preprocessing | 224×224 resize & normalization on the edge reduces backend load and latency |
| 🔥 Cold-Start Optimization | Warm-up ping strategy ensures the Render backend is ready on first request |
| 🔀 Decoupled Deployment | Frontend and backend scale independently with zero coupling |
| 🗺️ BBMP Mapping | Every class maps to a real Bengaluru disposal rule — not just a label |

---

## 🔐 Authentication & User Management

SmartSort uses Supabase Authentication to provide secure, user-specific access to the platform.

### Authentication Features

- 📧 Email/password authentication
- 📝 User registration with full name
- 🔑 Secure login and logout
- 🛡️ Protected scanner and dashboard routes
- 👤 User profile storage
- 🔒 Supabase Row Level Security (RLS)
- 🆔 Every waste record is associated with the authenticated user's UUID

### Authentication Flow

```text
User
 │
 ├── Sign Up
 │      │
 │      └── Supabase Auth
 │              │
 │              └── User ID
 │
 ├── Login
 │      │
 │      └── Supabase Session
 │
 └── Authenticated Application
         │
         ├── SmartSort Scanner
         │
         └── Personal Dashboard
```

The frontend obtains the authenticated user through the Supabase client and uses the user's UUID when creating waste records.

---

## 📊 User Dashboard

SmartSort provides a personalized dashboard for every authenticated user.

The dashboard retrieves only the waste records belonging to the currently authenticated user.

### Dashboard Features

| Feature | Description |
|---------|-------------|
| 📈 Total Scans | Total number of waste classifications performed |
| ♻️ Recyclable Items | Number of potentially recyclable classifications |
| 🧠 Average Confidence | Average AI classification confidence |
| 🌱 CO₂ Impact | Estimated cumulative carbon impact |
| 📊 Waste Distribution | Category-wise breakdown of classified waste |
| ⚖️ Recorded Weight | Total recorded waste weight |
| 🔢 Total Quantity | Total quantity of recorded waste |
| 🕒 Recent Scans | Latest user classifications |
| 🚀 Quick Scan | Direct navigation back to the scanner |

### Dashboard Flow

```text
Authenticated User
        │
        ▼
   Supabase Auth
        │
        ▼
     User UUID
        │
        ▼
   waste_records
        │
        │  RLS:
        │  auth.uid() = user_id
        ▼
 User-specific records
        │
        ▼
 Dashboard Analytics
        │
        ├── Total Scans
        ├── Recyclable Count
        ├── Average Confidence
        ├── CO₂ Impact
        ├── Waste Distribution
        └── Recent Activity
```

---

## 🗄️ Database Architecture

SmartSort uses PostgreSQL through Supabase for authentication-related data, user profiles, waste classifications, disposal information, and environmental impact calculations.

### Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Stores application-level user profile information |
| `waste_records` | Stores authenticated users' AI waste classifications |
| `waste_categories` | Stores waste category definitions and properties |
| `disposal_guides` | Stores disposal instructions for different materials |
| `emission_factors` | Stores carbon/emission factors used for environmental calculations |

### Database Relationship

```text
Supabase Auth
     │
     │ user.id
     ▼
 profiles
     │
     │
     └───────────────┐
                      │
                      ▼
               waste_records
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
    waste_categories  disposal_guides  emission_factors
```

---

## 📋 Complete Database Schema

### `profiles`

Stores application-level information associated with an authenticated Supabase user.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | — |
| `full_name` | TEXT | YES | — |
| `created_at` | TIMESTAMPTZ | YES | — |

### `waste_categories`

Defines supported waste categories and their disposal characteristics.

| Column | Type | Nullable |
|--------|------|----------|
| `id` | UUID | NO |
| `name` | TEXT | NO |
| `material` | TEXT | YES |
| `recyclable` | BOOLEAN | NO |
| `compostable` | BOOLEAN | NO |
| `default_disposal_method` | TEXT | YES |
| `created_at` | TIMESTAMPTZ | NO |

### `disposal_guides`

Stores disposal instructions associated with materials.

| Column | Type | Nullable |
|--------|------|----------|
| `id` | UUID | NO |
| `material` | TEXT | NO |
| `disposal_method` | TEXT | NO |
| `instructions` | TEXT | NO |
| `created_at` | TIMESTAMPTZ | NO |

### `emission_factors`

Stores environmental impact factors used for CO₂e calculations.

| Column | Type | Nullable |
|--------|------|----------|
| `id` | UUID | NO |
| `material` | TEXT | NO |
| `co2e_per_kg` | NUMERIC | NO |
| `unit` | TEXT | NO |
| `source` | TEXT | YES |
| `recycling_factor` | NUMERIC | YES |
| `created_at` | TIMESTAMPTZ | NO |

### `waste_records`

Stores the result of each user's waste classification.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `user_id` | UUID | NO | — |
| `ai_category` | TEXT | YES | — |
| `ai_confidence` | NUMERIC | YES | — |
| `final_category` | TEXT | NO | — |
| `material` | TEXT | YES | — |
| `quantity` | INTEGER | NO | `1` |
| `weight_grams` | NUMERIC | YES | — |
| `weight_source` | TEXT | NO | `'manual'` |
| `disposal_method` | TEXT | YES | — |
| `carbon_impact_co2e` | NUMERIC | YES | — |
| `created_at` | TIMESTAMPTZ | NO | `now()` |

**`waste_records` Constraints**

- Primary key: `waste_records_pkey` → `id`
- Foreign key: `waste_records_user_id_fkey` → authenticated user
- Check constraint: `weight_source`
- Required fields enforced through `NOT NULL` constraints

---

## 🔒 Row Level Security

SmartSort uses PostgreSQL Row Level Security to ensure that users can access only their own waste records.

### `waste_records` Policies

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can view their own waste records | SELECT | `auth.uid() = user_id` |
| Users can insert their own waste records | INSERT | `auth.uid() = user_id` |
| Users can update their own waste records | UPDATE | `auth.uid() = user_id` |
| Users can delete their own waste records | DELETE | `auth.uid() = user_id` |

This prevents one authenticated user from accessing another user's scan history through the client application.

**Read-only Reference Data**

Authenticated users can read:
- `waste_categories`
- `disposal_guides`
- `emission_factors`

---

## 🔄 Complete SmartSort Data Flow

The application now extends beyond simple image classification into a complete authenticated waste-management workflow.

```text
┌──────────────────┐
│      User        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase Auth    │
│ Login / Signup   │
└────────┬─────────┘
         │
         │ User UUID
         ▼
┌──────────────────┐
│ SmartSort        │
│ Scanner          │
└────────┬─────────┘
         │
         │ Camera Image
         ▼
┌──────────────────┐
│ FastAPI Backend  │
│ POST /predict    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ MobileNetV2      │
│ ML Inference     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Prediction +     │
│ Confidence       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase         │
│ waste_records    │
└────────┬─────────┘
         │
         │ RLS
         ▼
┌──────────────────┐
│ User Dashboard   │
└──────────────────┘
         │
  ┌──────────────┬──────────────┐
  ▼              ▼              ▼
Analytics    Distribution    History
  │              │              │
  └──────────────┼──────────────┘
                 ▼
           User Insights
```

---

## 🧩 Application Routes

| Route | Purpose | Authentication |
|-------|---------|-----------------|
| `/` | AI waste scanner | Required |
| `/login` | User login | Public |
| `/signup` | User registration | Public |
| `/dashboard` | Personal waste analytics | Required |

---

## 🌐 Environment Configuration

**Frontend**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, `NEXT_PUBLIC_API_URL` should point to the deployed Render backend.

> Never commit private Supabase service-role keys or other server-side secrets to the repository.

---

## 🧪 Current Application Capabilities

SmartSort currently supports the following end-to-end functionality:

- ✅ User registration
- ✅ User login
- ✅ User logout
- ✅ Protected application access
- ✅ Camera-based waste capture
- ✅ AI-powered waste classification
- ✅ 12 waste classes
- ✅ Confidence-based unknown filtering
- ✅ Disposal guidance
- ✅ Persistent user-specific scan records
- ✅ Supabase PostgreSQL database
- ✅ Row Level Security
- ✅ Personalized dashboard
- ✅ Waste distribution analytics
- ✅ Recyclable item tracking
- ✅ AI confidence analytics
- ✅ Recorded quantity and weight
- ✅ CO₂ impact tracking
- ✅ Recent scan history
- ✅ Render backend deployment
- ✅ Vercel frontend deployment

---

## 🧪 Current Runtime Versions

> **Note:** The System Architecture and Technical Stack sections above reflect the original project versions (Next.js 15 / Python 3.10). The current implementation has since been developed and tested with the versions below.

| Component | Version |
|-----------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| FastAPI | 0.129.0 |
| Python | 3.12 |
| TensorFlow | 2.20.0 |
| Keras | 3.13.2 |
| Supabase JS | 2.112.3 |
| Tailwind CSS | 4.x |

---


## 👨‍💻 Team

**Team Lead**
- [Md Yusuf Ali](https://github.com/Yusufali2004)

**Team Members**
- [Mohammad Zuhaib Wani](https://github.com/Zuhaib-01)
- [Mohammed Zain](https://github.com/zainchisti)
- [Mohammed Hashir](https://github.com/Hash-ir777)

> Department of Computer Science & Engineering, HKBKCE-VTU

---

## 🌍 Impact

SmartSort directly contributes to:

- ♻️ **Proper waste segregation at source** — reducing contamination of recyclables
- 🏙️ **Reduced landfill dependency** — diverting recyclables and compostables away from dumps
- 📈 **Improved recycling efficiency** — by giving actionable, bin-specific guidance
- 🤖 **AI-driven urban sustainability** — aligning with BBMP's Smart City initiatives

---

<div align="center">

### ♻️ Segregate Smart. Keep Bengaluru Clean.

⭐ Star this repo if you found it useful!

</div>
