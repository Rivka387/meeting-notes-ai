# PROCESS

## תכנון לפני כתיבת קוד
1. להגדיר את הזרימה מקצה לקצה: העלאת אודיו -> תמלול -> סיכום -> הצגה -> ייצוא Word.
2. לבחור טכנולוגיות: FastAPI + React + Whisper (או API חלופי) + Gemini לסיכום.
3. להגדיר סכמת JSON קשיחה לסיכום כדי למנוע שגיאות פרסור.
4. להחליט על חוויית משתמש: מסך יחיד, סטטוסים (מתמלל/מסכם), שגיאות ידידותיות.
5. להוסיף מצב MOCK_MODE לדמו מקומי ללא מפתחות.

## שימוש ב-AI בתהליך (דוגמאות פרומפטים)
- "בנה לי System Prompt שמחזיר JSON בלבד עם summary, participants, decisions, actionItems, language."
- "איך להכריח Gemini להחזיר JSON תקין (response_mime_type/response_schema)?"
- "תן דוגמה ל-UI נקי שמציג תמלול, סיכום, החלטות ומשימות."

## איפה נתקעתי ואיך פתרתי
- Gemini החזיר טקסט לא תקין JSON -> הוספתי response_schema ו-response_mime_type כדי לאכוף JSON קשיח.
- טקסטים בעברית הוצגו כג'יבריש -> הוחלפו במחרוזות UTF-8 תקינות בפרונט ובבקאנד.

## System Prompt ו-User Prompt
System Prompt (שרת): נלקח מ-`backend/app/prompts/meeting_summary_system.txt`.
```text
You are a concise meeting summarization assistant.

Return valid JSON only, no markdown, no code fences, no extra keys.

Requirements:
- Output must strictly match this schema: summary, participants, decisions, actionItems, language.
- summary: 3-6 sentences, clear and neutral.
- participants: list of participant names if explicitly mentioned; otherwise empty list.
- decisions: bullet-like list of decisions made; otherwise empty list.
- actionItems: list of actionable tasks with clear owner if mentioned; otherwise empty list.
- language: "he" or "en" based on the transcript language.
- If information is missing, use empty strings or empty lists (do not invent).

Schema:
{
  "summary": "string",
  "participants": ["string"],
  "decisions": ["string"],
  "actionItems": ["string"],
  "language": "he|en"
}
```

User Prompt (שרת): נבנה דינמית ב-`backend/app/services/summarize.py`.
```text
Language: {language}
Transcript:
{transcript}
```

## זמן עבודה בפועל
-  סה"כ זמן עבודה:  .

## שיפורים להמשך
- תמיכה בשפות נוספות וזיהוי שפה חכם יותר.
- הצגת confidence לתמלול.
- הוספת בדיקות יחידה ל-parsing של JSON ול-API responses.
