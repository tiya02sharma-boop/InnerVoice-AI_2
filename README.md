# InnerVoice AI

InnerVoice AI is a mental wellness prototype with two experiences in one app:

- A patient-facing space for mood check-ins, journaling, calming exercises, voice input, and reflective interactions
- A doctor-facing dashboard for reviewing journal summaries, PHQ-9/GAD-7 style indicators, risk levels, and recent patient activity

The frontend is built with plain HTML, CSS, and JavaScript. The backend is a FastAPI service that analyzes journal entries using Gemini and Hugging Face when API keys are available, with a local keyword-based fallback if they are not.

## Features

- Patient dashboard with mood logging and wellness stats
- Journal analysis flow connected to a FastAPI `/analyze` endpoint
- AI-generated patient message, clinical summary, and gentle next step
- Voice-to-text journaling using the browser Speech Recognition API
- Simulated handwritten journal scan/OCR flow
- Stress relief tools including breathing exercise, calming sounds, and a bubble release garden
- Doctor dashboard with mock patient cohort data
- Risk-focused clinical view with PHQ-9 and GAD-7 style scoring, keyword extraction, and note-taking
- Local browser storage for patient history and doctor notes
- Fallback analysis when external AI services are unavailable

## Project Structure

- [`index.html`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/index.html) contains the full patient, doctor, and clinical dashboard UI
- [`style.css`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/style.css) contains the visual design and responsive styling
- [`script.js`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/script.js) contains routing, UI logic, local state, and frontend API calls
- [`server.py`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/server.py) provides the FastAPI backend and journal analysis logic
- [`requirements.txt`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/requirements.txt) lists Python dependencies

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: FastAPI, Uvicorn, Pydantic
- AI services: Google Gemini, Hugging Face Inference API
- Env management: `python-dotenv`
- Persistence: browser `localStorage`

## How It Works

1. The user writes a journal entry in the patient dashboard.
2. The frontend sends the text to `http://127.0.0.1:8000/analyze`.
3. The backend:
   - checks Hugging Face sentiment if a Hugging Face API key exists
   - uses Gemini for structured PHQ-9/GAD-7 style extraction if a Gemini key exists
   - falls back to local keyword analysis if APIs are unavailable or fail
4. The frontend shows:
   - an empathetic patient message
   - a short clinical summary
   - one gentle action step
5. The result is stored in `localStorage` and reflected in the doctor dashboard.

## Setup

### 1. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

Both keys are optional. If they are missing, the app still works using fallback analysis.

### 4. Start the backend

```bash
python3 server.py
```

The API will run on:

```text
http://127.0.0.1:8000
```

### 5. Open the frontend

Open [`index.html`](/Users/tiyasharma/Desktop/TIYA/IGDTUW/DEVCATION GDG/InnerVoice AI 2/index.html) in your browser.

For the best experience, serve the frontend with a simple local server instead of opening it as a raw file:

```bash
python3 -m http.server 5500
```

Then visit:

```text
http://127.0.0.1:5500
```

## API

### `POST /analyze`

Request body:

```json
{
  "text": "I have been feeling overwhelmed and anxious lately."
}
```

Example response:

```json
{
  "phq9_score": 12,
  "gad7_score": 14,
  "risk": "medium",
  "summary": "Patient presents with anxiety and excessive worry issues.",
  "keywords": ["anxiety", "excessive worry"],
  "patient_message": "It sounds like you're carrying a heavy load right now. I see how hard you're trying.",
  "action_step": "Take 5 minutes today for a guided breathing exercise. Be gentle with yourself."
}
```

## Notes and Limitations

- This is a prototype, not a validated medical device or diagnostic system.
- PHQ-9 and GAD-7 style outputs are approximate and generated from AI or keyword heuristics.
- CORS is currently open to all origins in the backend.
- Patient and doctor data are stored in browser `localStorage`, not in a secure database.
- The scan/OCR flow is currently simulated.
- Some dashboard values are mock/demo content.
- Voice input depends on browser support for `SpeechRecognition` or `webkitSpeechRecognition`.

## Safety Disclaimer

This project should be used for demonstration, UI exploration, or hackathon/prototype purposes only. It must not be relied on for emergency response, diagnosis, or real clinical decision-making without proper medical validation, privacy controls, secure storage, and human oversight.

## Future Improvements

- Replace `localStorage` with authenticated backend persistence
- Add real OCR for handwritten journal uploads
- Add user authentication and role-based access
- Secure CORS and API configuration for production
- Add proper crisis escalation workflows and emergency resources
- Add charts backed by real historical data
- Improve explainability and auditability of risk scoring

## Run Summary

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 server.py
python3 -m http.server 5500
```

Open:

- Frontend: `http://127.0.0.1:5500`
- Backend: `http://127.0.0.1:8000`
