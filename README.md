<div align="center">

  <img src="frontend/public/logo.png" alt="WebIntel Engine Logo" width="120" height="120" style="border-radius: 20%;" />

  # ⚡ WebIntel Engine
  ### Asynchronous Web Scraping & Generative AI Data Extraction Platform

  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)
  [![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Google Gemini](https://img.shields.io/badge/Google_Gemini_2.5-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

  <p align="center">
    <b>WebIntel Engine</b> is a production-grade, distributed web intelligence and automated data extraction engine. It crawls public websites, discovers deep internal links, cleans raw page content, and utilizes a zero-failure LLM extraction pipeline powered by <b>Google Gemini</b> to convert unstructured web text into structured JSON schema entries.
  </p>

  ---
</div>

## 📌 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗 System Architecture](#-system-architecture)
- [⚡ Tech Stack](#-tech-stack)
- [🚀 Quick Start (Local & Docker)](#-quick-start-local--docker)
  - [Prerequisites](#prerequisites)
  - [Option 1: Docker Compose (Recommended)](#option-1-docker-compose-recommended)
  - [Option 2: Local Development Setup](#option-2-local-development-setup)
- [📡 API Reference](#-api-reference)
- [🔒 Security & Key Vault](#-security--key-vault)
- [👨‍💻 Author & Contact](#-author--contact)

---

## ✨ Key Features

- **🛡 Zero-Failure Multi-Model Fallback Chain**: Automatically rotates through Google Gemini models (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.5-pro` → `gemini-2.0-flash-lite`) with rate-limit backoff. If API quotas are completely exhausted, it seamlessly engages a **High-Accuracy Heuristic Content Extractor** so no data extraction job ever fails.
- **📂 Smart Category & Listing Page Detection**: Automatically distinguishes genre/category listing pages from single product or entity target pages. Category listings are assigned a clean `null` entity subject, `0.35` confidence score, and safely routed to `needs_review` status.
- **🎯 Dynamic Per-Page Confidence Scoring**: Calibrates confidence scores (`0.35` to `0.95`) per page based on entity validity, domain URL presence, contact details, and summary prose quality.
- **⚡ Real-Time Distributed Task Queue**: Celery workers powered by Redis manage background scraping jobs, link discovery, and LLM cleaning with live percentage progress tracking.
- **🎨 Warm Printed Paper Ledger UI**: Sleek, modern interface inspired by high-end financial ledgers, built with React, Vite, Newsreader serif typography, IBM Plex Mono code styling, and TanStack Table capabilities.
- **📊 Export Engine**: One-click export of structured intelligence into CSV and Excel formats, honoring active search/filter views.

---

## 🏗 System Architecture

```
                                  +-----------------------+
                                  |   React / Vite UI     |
                                  | (Ledger Dashboard)   |
                                  +-----------+-----------+
                                              |
                                              | REST API / HTTP
                                              v
                                  +-----------+-----------+
                                  |    FastAPI Backend    |
                                  |   (App Server :8000)  |
                                  +-----+-----------+-----+
                                        |           |
                        Dispatch Job    |           | Query Results / Config
                                        v           v
                                  +-----+-----------+-----+
                                  |   Redis Task Queue    |
                                  |  (Broker & Cache)     |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------+-----------+
                                  |     Celery Workers    |
                                  |  (Scraping & Cleaning)|
                                  +-----+-----------+-----+
                                        |           |
                   Scrape Pages         |           | Structured Extractions
                                        v           v
                          +-------------+--+     +--+----------------+
                          | Scrape Engine  |     |  Google Gemini    |
                          | (httpx / BS4)  |     |  Multi-Model LLM  |
                          +----------------+     +-------------------+
                                        |           |
                                        +-----+-----+
                                              |
                                              v
                                  +-----------+-----------+
                                  | PostgreSQL Database   |
                                  | (Jobs, Pages, Results)|
                                  +-----------------------+
```

---

## ⚡ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS v4 | Warm Printed Paper Ledger theme with IBM Plex Mono & Newsreader fonts |
| **Backend API** | FastAPI, Python 3.12/3.13 | Asynchronous RESTful Web API with OpenAPI interactive docs |
| **Task Processing** | Celery, Redis | Distributed background task execution queue with live state updates |
| **Database** | PostgreSQL, SQLAlchemy, Alembic | Relational database storage for jobs, scraped pages, and structured results |
| **Scraping Engine**| `httpx`, BeautifulSoup4, DuckDuckGo | Fast HTTP fetcher, HTML parser, and keyword-to-URL discovery engine |
| **LLM Engine** | Google Gemini API (`genai` SDK) | Multi-model fallback pipeline (`gemini-2.5-flash`, `2.0-flash`, `2.5-pro`) |

---

## 🚀 Quick Start (Local & Docker)

### Prerequisites

- [Docker & Docker Compose](https://www.docker.com/) OR
- Python 3.12+ & Node.js 18+
- Redis Server & PostgreSQL Database

---

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ramyprojs/webintel-engine.git
   cd webintel-engine
   ```

2. **Set up Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   DATABASE_URL=postgresql+asyncpg://webintel:webintel@postgres:5432/webintel
   REDIS_URL=redis://redis:6379/0
   ```

3. **Build and Launch Container Stack:**
   ```bash
   docker-compose up --build
   ```

4. **Open the Dashboard:**
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **FastAPI API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Development Setup

#### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/venv/activate  # On macOS/Linux

pip install -r requirements.txt

# Run FastAPI Server
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run Celery Worker (in a second terminal)
./.venv/bin/celery -A app.worker.tasks.celery_app worker --loglevel=info
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/jobs/` | Dispatch a new web extraction job (Domain Crawl or Search Term) |
| `GET` | `/api/jobs/` | List all recent extraction jobs and their progress states |
| `GET` | `/api/jobs/{id}` | Retrieve real-time progress and details of a specific job |
| `GET` | `/api/results/` | Fetch structured extracted entities (filterable by job, status, or search) |
| `GET` | `/api/results/export` | Download structured results in CSV or Excel format |
| `GET` | `/api/config/status` | Retrieve current API key configuration and system readiness status |
| `POST` | `/api/config/key` | Validate and store Google Gemini API Key dynamically |

---

## 🔒 Security & Key Vault

Your Google Gemini API Key is stored securely and validated via a lightweight pre-flight API call prior to saving. The key is consumed dynamically by Celery workers to execute LLM data extraction without exposing secret keys in frontend bundles or logs.

---

## 👨‍💻 Author & Contact

Developed with ❤️ by **Ramy Abdelamalak**

- **LinkedIn**: [linkedin.com/in/ramyabdelamalak](https://www.linkedin.com/in/ramyabdelamalak)
- **GitHub**: [github.com/Ramyprojs](https://github.com/Ramyprojs)
- **Repository**: [github.com/Ramyprojs/webintel-engine](https://github.com/Ramyprojs/webintel-engine)
