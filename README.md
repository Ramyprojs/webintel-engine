# Web Intelligence & Data Scraping Engine

A production-quality asynchronous web scraping and data intelligence platform. This system takes user-submitted domains or keyword searches, scrapes public sources in the background, uses a generative LLM (Gemini) to clean and structure the results into JSON, and displays live progress via a React/Tailwind frontend.

## 🚀 Architecture Stack

- **Frontend**: React (Vite) + Tailwind CSS v4 + Lucide Icons
- **Backend API**: FastAPI (Python 3.12)
- **Task Queue**: Celery
- **Broker & Results**: Redis
- **Database**: PostgreSQL (SQLAlchemy + Alembic)
- **Scraping**: httpx + BeautifulSoup (Static) / Playwright (JS-Rendered) / DuckDuckGo API (Discovery)
- **LLM Extraction**: Google Gemini (with robust Tenacity backoff & progressive JSON validation loops)

## 📦 How to Run (Docker Compose)

The entire stack is containerized for easy deployment.

1. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Build and start the services:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend Dashboard**: `http://localhost:5173`
   - **Backend API Docs**: `http://localhost:8000/docs`
   - **Database**: `localhost:5432` (webintel/webintel)

## ✅ Implementation Phases (Completed)

- [x] **Phase 1: Architecture & Scaffolding**: Setup FastAPI, PostgreSQL, Alembic, Celery, and Redis containers.
- [x] **Phase 2: Database & API**: Implement `StructuredResult` and `Job` models, along with REST endpoints to dispatch and track Celery tasks.
- [x] **Phase 3: Scraping Engine**: Implement `ScrapeEngine` with Redis-backed rate limiting, JS rendering fallback (Playwright), and robots.txt parsing.
- [x] **Phase 4: LLM Data Extraction**: Integrate Gemini with a highly resilient pipeline:
  - 503 Network errors trigger an exponential backoff retry.
  - Malformed JSON triggers a progressive strictness prompt loop.
  - Failures are captured and saved to the `review_notes` database column.
- [x] **Phase 5: Frontend Dashboard**: A glassmorphic React/Tailwind application providing a command center to dispatch tasks, watch live Celery progress bars, and filter extracted intelligence.
- [x] **Phase 6: Verification & Polish**: Final Docker configuration (Playwright dependencies) and documentation cleanup.
