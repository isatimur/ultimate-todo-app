# Task Input Modes

The application supports multiple ways to add tasks:

- **Typing** – enter a title manually in any task field.
- **Voice** – tap the microphone in quick-add bars to record audio. The `/api/whisper` endpoint transcribes the recording into task text.
- **Image** – use the camera button to upload a picture containing text. The `/api/vision` endpoint performs OCR and returns the detected text.

Both voice and image uploads return plain text that is inserted into the task title before creation.
