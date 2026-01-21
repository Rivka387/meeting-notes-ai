# Meeting Notes AI

A full-stack app that transcribes meeting audio and generates structured summaries, decisions, and action items.

## Features
- Audio upload (wav/mp3)
- Full transcript
- Summary, participants, decisions, action items
- Word (DOCX) export
- Action items export as ICS
- MOCK_MODE for local demos without API keys

## Architecture
- Backend: FastAPI, Whisper-compatible transcription API, LLM summarization (Gemini by default)
- Frontend: React (Vite)

## System Prompt
The LLM system prompt used for summaries lives at:
- `backend/app/prompts/meeting_summary_system.txt`

## Local Setup

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

## Environment Variables
Create `backend/.env` based on `backend/.env.example`.

- `GEMINI_API_KEY`: Gemini API key for summarization.
- `GEMINI_MODEL`: Optional, defaults to `gemini-1.5-flash`.
- `WHISPER_API_URL`: Whisper-compatible transcription endpoint (multipart file upload).
- `WHISPER_API_KEY`: API key for the transcription service.
- `WHISPER_MODEL`: Optional, defaults to `whisper-1`.
- `MOCK_MODE`: `true` to enable deterministic mock responses for demo.

## Notes
- If you don’t have API keys, set `MOCK_MODE=true` to demo the full flow locally.
- `WHISPER_API_URL` should accept a `file` upload and return JSON with `text` or `transcript`.
- The Word export is generated server-side in `backend/app/services/export_docx.py`.
- Process documentation is in `PROCESS.md`.

## Deliverables
- GitHub repo: https://github.com/Rivka387/meeting-notes-ai
- Live demo (or local demo instructions): https://meeting-notes-ai.onrender.com/
