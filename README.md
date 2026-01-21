# Meeting Notes AI

Monorepo with a FastAPI backend and a lightweight React UI (CDN-based) for audio transcription and meeting summaries.

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
notepad .env
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` and set API Base URL to `http://localhost:8000`.

## Environment
- `GEMINI_API_KEY`: Gemini API key.
- `GEMINI_MODEL`: Optional, default `gemini-1.5-flash`.
- `WHISPER_API_URL`: External Whisper transcription endpoint.
- `WHISPER_API_KEY`: API key for the transcription service.
- `MOCK_MODE`: `true` to enable deterministic mock responses for demo.
