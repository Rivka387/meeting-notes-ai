from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.schemas.meeting import (
    ExportDocxRequest,
    MeetingSummaryRequest,
    MeetingSummaryResponse,
    TranscribeResponse,
)
from app.services.export_docx import build_docx
from app.services.summarize import SummarizationError, summarize_meeting
from app.services.transcribe import TranscriptionError, transcribe_audio

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)) -> TranscribeResponse:
    try:
        transcript, language = await transcribe_audio(file)
        return TranscribeResponse(transcript=transcript, language=language)
    except TranscriptionError as exc:
        raise HTTPException(status_code=502, detail=exc.message)


@router.post("/api/summarize", response_model=MeetingSummaryResponse)
async def summarize(payload: MeetingSummaryRequest) -> MeetingSummaryResponse:
    try:
        result = await summarize_meeting(payload.transcript, payload.language)
        return MeetingSummaryResponse(**result)
    except SummarizationError as exc:
        raise HTTPException(status_code=502, detail=exc.message)


@router.post("/api/export/docx")
async def export_docx(payload: ExportDocxRequest) -> FileResponse:
    docx_path = build_docx(payload)
    return FileResponse(
        docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="meeting-summary.docx",
    )
