import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

import google.generativeai as genai

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "meeting_summary_system.txt"
LOGGER = logging.getLogger(__name__)
SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "participants": {"type": "array", "items": {"type": "string"}},
        "decisions": {"type": "array", "items": {"type": "string"}},
        "actionItems": {"type": "array", "items": {"type": "string"}},
        "language": {"type": "string"},
    },
    "required": ["summary", "participants", "decisions", "actionItems", "language"],
}


class SummarizationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_user_prompt(transcript: str, language: str) -> str:
    return (
        f"Language: {language}\n"
        "Transcript:\n"
        f"{transcript}\n"
    )


def _strip_json_fences(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _parse_json(raw: str) -> Dict[str, Any]:
    return json.loads(_strip_json_fences(raw))


def _normalize_payload(payload: Dict[str, Any], language: str) -> Dict[str, Any]:
    return {
        "summary": payload.get("summary", "").strip(),
        "participants": payload.get("participants", []) or [],
        "decisions": payload.get("decisions", []) or [],
        "actionItems": payload.get("actionItems", []) or [],
        "language": payload.get("language") or language,
    }


def _default_response(language: str) -> Dict[str, Any]:
    return {
        "summary": "No summary available.",
        "participants": [],
        "decisions": [],
        "actionItems": [],
        "language": language,
    }


def _mock_response(language: str) -> Dict[str, Any]:
    return {
        "summary": (
            "דנו ביעדי ה-MVP למערכת תמלול וסיכום פגישות ובחלוקה בין רכיבי המערכת. "
            "הוחלט להשתמש ב-Whisper לתמלול וב-Gemini לסיכום, עם UI ב-React ושרת FastAPI. "
            "הוסכם שהמערכת תחזיר תמלול מלא, סיכום, משתתפים, החלטות ומשימות לביצוע. "
            "נדרש גם ייצוא לקובץ Word והדגמה מקומית עם אפשרות ל-MOCK_MODE."
        ),
        "participants": ["נועה", "אורן", "דניאל"],
        "decisions": [
            "ה-MVP יכלול React בפרונט ו-FastAPI בבקאנד.",
            "תמלול יתבצע באמצעות Whisper עם אפשרות MOCK_MODE לדמו.",
            "סיכום יתבצע באמצעות Gemini ויוחזר כ-JSON תקין.",
            "נוסיף ייצוא לקובץ Word מתוך ממשק המשתמש.",
        ],
        "actionItems": [
            "נועה: לנסח System Prompt איכותי לסיכום.",
            "אורן: לממש את ה-routes ושירותי הבקאנד.",
            "דניאל: לבנות UI נקי להצגת תמלול וסיכום.",
            "צוות: להשלים README ו-PROCESS.md עם הוראות והרצת דמו.",
        ],
        "language": language,
    }


async def summarize_meeting(transcript: str, language_hint: str | None) -> Dict[str, Any]:
    language = language_hint or ("en" if transcript.isascii() else "he")
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    api_key = os.getenv("GEMINI_API_KEY")

    if mock_mode and not api_key:
        return _mock_response(language)
    if not api_key:
        return _default_response(language)

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    generation_config = {
        "response_mime_type": "application/json",
        "response_schema": SUMMARY_SCHEMA,
    }
    model = genai.GenerativeModel(model_name=model_name, generation_config=generation_config)

    system_prompt = _load_system_prompt()
    user_prompt = _build_user_prompt(transcript, language)

    try:
        response = model.generate_content([system_prompt, user_prompt])
        raw_text = response.text or ""
    except Exception:
        raise SummarizationError(
            "Summarization failed. Check GEMINI_API_KEY or Gemini service availability."
        )

    try:
        payload = _parse_json(raw_text)
        return _normalize_payload(payload, language)
    except json.JSONDecodeError:
        fix_prompt = (
            "Fix the following content to valid JSON that matches the schema exactly. "
            "Return JSON only.\n\n"
            f"{raw_text}"
        )
        LOGGER.warning("Invalid JSON from LLM (first pass). raw_text=%s", raw_text[:1000])
        fix_response = model.generate_content([system_prompt, fix_prompt])
        try:
            payload = _parse_json(fix_response.text or "")
            return _normalize_payload(payload, language)
        except json.JSONDecodeError:
            LOGGER.warning(
                "Invalid JSON from LLM (retry). raw_text=%s", (fix_response.text or "")[:1000]
            )
            raise SummarizationError("LLM returned invalid JSON after retry.")
