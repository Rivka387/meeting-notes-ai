import tempfile
from typing import List

from docx import Document

from app.schemas.meeting import ExportDocxRequest


def _add_section(doc: Document, title: str, items: List[str]) -> None:
    doc.add_heading(title, level=2)
    if not items:
        doc.add_paragraph("—")
        return
    for item in items:
        doc.add_paragraph(item, style="List Bullet")


def build_docx(payload: ExportDocxRequest) -> str:
    doc = Document()
    doc.add_heading("Meeting Summary", level=1)
    doc.add_paragraph(f"Language: {payload.language}")

    doc.add_heading("Summary", level=2)
    doc.add_paragraph(payload.summary or "—")

    _add_section(doc, "Participants", payload.participants)
    _add_section(doc, "Decisions", payload.decisions)
    _add_section(doc, "Action Items", payload.actionItems)

    doc.add_heading("Transcript", level=2)
    doc.add_paragraph(payload.transcript or "—")

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
    temp_file.close()
    doc.save(temp_file.name)
    return temp_file.name
