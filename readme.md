# Smart Report Generator 🎓



An industry-grade, AI-powered academic reporting platform designed to transform raw student data into professional, insight-driven performance reports. Featuring a multi-tier architecture, secure session management, and generative AI feedback loops.

---

## 🚀 Key Features

- **🧠 AI-Powered Insights**: Real-time performance analysis and improvement suggestions using Groq (Llama 3.1).
- **📊 Interactive Dashboards**: Specialized views for Proctors (administrative management) and Students (personal progress tracking).
- **📄 Professional A4 Reports**: Pixel-perfect reporting engine with high-fidelity PDF export capabilities.
- **🔐 Enterprise-Grade Security**: Secure session persistence with Redis-backed authentication and case-insensitive identity mapping.
- **⚡ High-Performance Architecture**: Tiered system separation (UI, Business Logic, and Data Processing) for maximum scalability.

---

## 🏗️ Architecture Overview

The system operates on a specialized three-tier architecture:

1.  **Frontend (React/Vite)**: Modern, responsive UI utilizing Tailwind CSS and React Router v7 for seamless navigation.
2.  **Logic Gateway (Express)**: Orchestrates business logic, manages PostgreSQL through Prisma ORM, and handles session caching in Redis.
3.  **Intelligence Service (FastAPI)**: A high-performance Python service dedicated to data normalization and LLM processing.

---

## 🛠️ Tech Stack

<p align="left">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,tailwind,nodejs,express,prisma,redis,postgres,python,fastapi,git,postman" />
  </a>
</p>

- **Frontend**: React 19, Vite, Tailwind CSS, Axios, Lucide Icons.
- **Backend (Node)**: Express, Prisma ORM, Redis (Upstash), PostgreSQL (Neon).
- **Backend (Python)**: FastAPI, Pydantic, Groq SDK (Llama 3.1).
- **Infrastructure**: Git, Postman, Vercel/Render-ready.

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL Database
- Redis Instance

### 1. Intelligence Service (FastAPI)
```bash
cd backend/fastapi
python -m venv venv
source venv/bin/activate  # macOS/Linux
# .\venv\Scripts\activate # Windows
pip install -r requirements.txt
# Create .env with GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Logic Gateway (Express)
```bash
cd backend/express
npm install
# Setup .env with DATABASE_URL, REDIS_URL, and PORT=5000
npx prisma generate
node prisma/seed.js # To populate initial system data
npm run dev
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
Smart-Report/
├── backend/
│   ├── express/       # Core API, Auth, and DB orchestration
│   └── fastapi/       # AI Analytics and Data Scrapping
├── frontend/          # React application (Vite-powered)
├── start-all.bat      # Quick-launch script for Windows
└── readme.md          # Project documentation
```

---

## 🛡️ Security & Sessions

The project implements a **Stateless-Session Hybrid**:
- Authentication results are cached in **Redis** with a 30-day TTL.
- Middleware ensures administrative routes (Proctor Dashboard) are protected via `x-session-id` headers.
- Persistent login data is stored in LocalStorage for seamless UX.


---
*Created with ❤️ for Academic Excellence.*
