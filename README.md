
# ChronoSearch 🕰️

**AI-Powered Semantic Video Search Engine**

> **Don't just search for videos. Search *inside* them.**

ChronoSearch is a next-generation video platform that goes beyond traditional keyword matching. While standard platforms only look at titles and tags, ChronoSearch uses **Computer Vision** and **Vector Embeddings** to "watch" and understand every frame of your video.

Imagine searching for *"White sneakers"* or *"Explosion"* and instantly jumping to the exact timestamp where it happens—even if those words never appear in the title.

![ChronoSearch Dashboard](frontend/public/dashboard-preview.png)
---

## 🔎 One Platform, Two Search Engines

Most video platforms only let you find *files*. ChronoSearch lets you find *moments*. We have engineered two distinct search modes to handle both needs:

### 1. 🌍 Global Search (The Librarian)

* **What it does:** Searches across your entire video library.
* **How it works:** Matches your query against video **Titles** and **Tags** using hybrid semantic search.
* **Use Case:** *"Show me all my travel vlogs from 2024."*

### 2. 👁️ Deep Search (The Detective)

* **What it does:** Searches **inside** a single video, frame-by-frame.
* **How it works:** Uses Google's **SigLIP** model to convert visual frames into vectors. It ignores text and looks for **visual concepts**.
* **Use Case:** *"Go to the exact second where I was holding a coffee cup."*

---

## 🚀 Key Features

* **🧠 Visual AI Indexing:** Automatically extracts frames at 1 FPS and converts them into 1152-dimensional semantic vectors.
* **⚡ Serverless Backend:** Built on **Modal**, scaling high-performance T4 GPUs on-demand to process uploads in parallel.
* **🔍 Hybrid Search Architecture:** Seamlessly merges metadata results (Global) with computer vision results (Deep).
* **🎥 Smart Streaming:** Custom-built video streaming supporting **Range Requests (206 Partial Content)** for zero-latency seeking.
* **🛠️ Auto-Healing Index:** Built-in "Repair" functionality to fix synchronization issues or missing frames automatically.
* **🔐 Secure Auth:** Integrated Google OAuth + JWT for secure user management and private video storage.

---

## 🛠️ Tech Stack

### **Frontend**

* **React + Vite:** High-performance reactive UI.
* **Tailwind CSS:** Modern, responsive styling.
* **Axios:** Optimized API communication.

### **Backend (The Core)**

* **Python & FastAPI:** High-speed REST API.
* **Modal:** Serverless Cloud Platform (GPU orchestration & Persistent Storage).
* **LanceDB:** Vector Database for billion-scale similarity search.
* **OpenCV:** Advanced frame extraction and resizing logic.
* **HuggingFace Transformers:** Powered by the `google/siglip-so400m-patch14-384` model.

---

## 🏗️ Architecture

1. **Extraction:** When a video is uploaded, the backend intelligently extracts frames (Smart 1 FPS sampling).
2. **Vectorization:** Each frame is passed through the **SigLIP AI model** to generate a semantic embedding.
3. **Indexing:** Vectors are stored in **LanceDB** on a persistent Cloud Volume for sub-millisecond retrieval.
4. **Search Routing:**
* `/search_global`: Scans Titles & Tags index.
* `/search_video`: Scans Frame Vector index using Cosine Similarity.



---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py             # Entry point (Run this to deploy)
│   ├── AI.py               # Modal App Orchestrator (GPU Logic)
│   ├── api.py              # FastAPI Routes (Stream, Upload, Search)
│   ├── auth.py             # Authentication Logic (JWT & Google Auth)
│   ├── common.py           # Configuration & Modal Image Definition
│   ├── database.py         # SQL Database Models (Users, Videos)
│   ├── extract.py          # Module: Frame Extraction (OpenCV)
│   ├── index.py            # Module: Vector Indexing (SigLIP + LanceDB)
│   ├── search.py           # Module: Deep Visual Search Logic
│   └── search_global.py    # Module: Hybrid Global Search Logic
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation & Search Bar
│   │   │   └── UploadModal.jsx   # Video Upload UI
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Main Feed & Global Search Results
│   │   │   ├── VideoPlayer.jsx   # Video Streaming & Deep Search UI
│   │   │   ├── Profile.jsx       # User Dashboard & My Videos
│   │   │   └── Login.jsx         # Google Authentication Page
│   │   ├── services/
│   │   │   └── api.js            # Axios Setup & API Calls
│   │   ├── App.jsx               # Main Routing Layout
│   │   └── main.jsx              # React Entry Point
│   ├── public/                   # Static Assets
│   └── vite.config.js            # Frontend Proxy Configuration
│
└── .gitignore             # Git Ignore Rules

```

---

## ⚡ Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kishan705/Chronosearch_2.O.git
cd Chronosearch_2.O

```

### 2. Backend Setup (Modal)

You need a [Modal.com](https://modal.com) account.

```bash
# Install Modal
pip install modal

# Authenticate
modal setup

# Deploy the App
modal deploy backend/main.py
or
modal deploy -m backend.main

```

*After deployment, copy the **URL** provided by Modal (ending in `.modal.run`).*

### 3. Frontend Setup

```bash
cd frontend
npm install

```

**Configure Environment Variables:**
Create a `.env` file in the `frontend/` folder. This is **required** to connect the frontend to your backend.

```bash
# frontend/.env
VITE_API_URL=https://REPLACE_WITH_YOUR_MODAL_URL.modal.run
VITE_GOOGLE_CLIENT_ID=REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID

```

**Run the UI:**

```bash
npm run dev

```

---

## 🛡️ License

This project is open-source and available under the **MIT License**.

Built with ❤️ by [Kishan Amaliya](https://github.com/kishan705)
