# PROCESS

## Planning
- Mapped the required outputs (transcript, summary, participants, decisions, action items, Word export).
- Designed a simple flow: upload audio -> transcribe -> summarize -> present -> export.
- Chose FastAPI for a thin API layer, React for the UI, Whisper-compatible API for transcription, and Gemini for the LLM summary.

## AI Usage (examples)
System prompt crafted for structured output:
```text
You are a senior meeting summarization assistant for business meetings.

Return valid JSON only. No markdown, no code fences, no extra keys.

Requirements:
- Output must strictly match this schema: summary, participants, decisions, actionItems, language.
- summary: 3-6 sentences, clear, neutral, and faithful to the transcript.
- participants: list of participant names if explicitly mentioned; otherwise empty list.
- decisions: list of decisions made; otherwise empty list. One decision per array item.
- actionItems: list of actionable tasks; include the owner only if explicitly mentioned (e.g., "Maya: send the report").
- language: "he" or "en" based on the transcript language. Use the same language for all text fields.
- If information is missing, use empty strings or empty lists. Do not invent or infer.

Schema:
{
  "summary": "string",
  "participants": ["string"],
  "decisions": ["string"],
  "actionItems": ["string"],
  "language": "he|en"
}
```

Why this prompt:
- Forces JSON-only output to avoid post-processing errors.
- Defines strict schema so the UI can render deterministically.
- Enforces language consistency to keep RTL/LTR behavior predictable.
- Prevents hallucinations by disallowing inference.

Prompt used during development to validate JSON structure:
```text
Fix the following content to valid JSON that matches the schema exactly. Return JSON only.
```

Prompt idea used when improving the Word export formatting:
```text
Make the DOCX output more readable: add clear headings, bullet lists, and RTL alignment for Hebrew.
```

## Blockers and Solutions
- JSON output occasionally violated schema. Solved by enforcing `response_schema` and adding a retry fixer.
- Word export looked too plain. Solved by adding headings, metadata, better fonts, and RTL alignment for Hebrew.
- Missing API keys for demos. Solved by adding `MOCK_MODE` and deterministic mock payloads.

## Actual Time Spent
- ~5 hours.
