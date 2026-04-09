# 06 — Module: Voice Lab

The "holy shit" moment of Day 1. Most EITs will never have done voice AI live before. This module makes speaking to AI and being spoken back to feel magical.

## Route

`/studio/voice`

## Features

### 1. Voice Input
- Large, prominent record button (circular, 80px)
- Press-and-hold to record OR click-to-start, click-to-stop (support both)
- Visual feedback during recording (animated pulsing ring)
- Live audio level meter (simple bars visualizing volume)
- Max recording length: 60 seconds
- Browser uses `MediaRecorder` API with `audio/webm` format

### 2. Transcription
- On stop, automatically upload audio to `/api/transcribe`
- Display transcription as it completes
- Show detected language prominently (e.g., "Detected: Yoruba" / "Détecté : Yoruba")
- If language is low-confidence, show a warning: "Low confidence — model may have struggled with this language"

### 3. AI Response
- After transcription, automatically send the text to `/api/chat` with the user's chosen model
- Model toggle: GPT-4o | Claude | Both (Compare Mode works here too)
- Display streaming text response
- "Speak this response" button appears when text is complete

### 4. Text-to-Speech
- "Speak" button calls `/api/tts` with the response text
- Voice selector dropdown with 6 OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
- Audio plays inline with a standard audio player
- Download button for the MP3

### 5. Full Conversation Mode
- Toggle: "Continuous mode" — after the AI speaks, automatically starts recording again
- Creates a natural back-and-forth voice conversation
- Stop button to break the loop

### 6. Upload Audio Alternative
- "Upload audio file" button for teams with mic issues
- Accepts mp3, wav, webm, m4a, up to 25MB (Whisper's limit)

### 7. Save to Gallery
- Save the full voice interaction: original audio, transcription, response text, response audio
- Awards +15 XP (voice is harder than chat, reward accordingly)

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ [← Studio]  Voice Lab              [Save] [Upload]  │
│                                                       │
│ [GPT-4o] [Claude] [Compare]   [Voice: nova ▼] [Cont]│
│                                                       │
│                                                       │
│              ┌──────────────┐                         │
│              │              │                         │
│              │      🎤      │   ← Big record button  │
│              │              │                         │
│              └──────────────┘                         │
│                                                       │
│         "Click to start recording" / "Cliquez..."   │
│                                                       │
│  ████████░░░░  ← audio level meter (when recording) │
│                                                       │
│ ─────────────────────────────────────────────────   │
│                                                       │
│ 📝 Transcription (Detected: Yoruba)                 │
│ "Bawo ni, se o le ran mi low..."                    │
│                                                       │
│ 🤖 GPT-4o Response                                   │
│ "Beeni, mo le ran e lowo..."                        │
│ [🔊 Speak this]                                      │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## API Endpoints

### `POST /api/transcribe`

Request: multipart/form-data with `audio` file field

Response:
```json
{
  "ok": true,
  "text": "Transcribed text here",
  "language": "en",
  "languageName": "English",
  "durationSeconds": 5.2
}
```

Implementation:
- Use OpenAI Whisper: `openai.audio.transcriptions.create({ file, model: 'whisper-1', response_format: 'verbose_json' })`
- Return the detected language from Whisper's response
- Map language codes to display names (create `/lib/languages.ts` with ISO code → name mapping for: en, fr, yo, ha, sw, ar, pt, twi, wo — note Twi/Wolof may not be detected by Whisper, handle gracefully)

### `POST /api/tts`

Request:
```json
{
  "text": "Text to speak",
  "voice": "nova",
  "model": "tts-1"
}
```

Response: Audio stream (`audio/mpeg`) or JSON with error

Implementation:
- Use OpenAI TTS: `openai.audio.speech.create({ model: 'tts-1', voice, input: text })`
- Stream the audio response directly to the client
- Max text length: 4096 chars (OpenAI limit)

## Client-Side Audio Handling

Use a custom hook `/lib/hooks/use-audio-recorder.ts`:

```typescript
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  async function start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    // Set up audio level monitoring
    audioContext.current = new AudioContext();
    const source = audioContext.current.createMediaStreamSource(stream);
    analyser.current = audioContext.current.createAnalyser();
    source.connect(analyser.current);

    recorder.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.start();
    mediaRecorder.current = recorder;
    setRecording(true);

    // Start level monitoring loop
    const levelArray = new Uint8Array(analyser.current.frequencyBinCount);
    const updateLevel = () => {
      if (!recording) return;
      analyser.current?.getByteFrequencyData(levelArray);
      const avg = levelArray.reduce((a, b) => a + b, 0) / levelArray.length;
      setAudioLevel(avg / 255);
      requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }

  async function stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) return;
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];
        setRecording(false);
        resolve(blob);
      };
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    });
  }

  return { recording, audioLevel, start, stop };
}
```

## Mobile Support

- `getUserMedia` works on mobile browsers (iOS Safari 14+, Chrome Android)
- Ensure permissions prompt appears clearly
- Test on mobile viewport — the big record button should be tappable

## Error Handling

- Microphone permission denied: show friendly message with instructions to enable
- Recording too short (<0.5s): friendly error "Please record for at least half a second"
- Whisper API error: "Transcription failed, please try again"
- TTS API error: "Voice generation failed, please try again"
- All messages in EN/FR

## Success Criteria

- [ ] User can record audio and see a live level meter
- [ ] Audio is transcribed and detected language displayed
- [ ] AI response streams in after transcription
- [ ] User can play back the response as speech with a chosen voice
- [ ] Compare Mode works for voice (both models respond to same transcription)
- [ ] Continuous mode creates a voice-only conversation loop
- [ ] User can upload an audio file as alternative to recording
- [ ] User can save the full interaction to Gallery
- [ ] Works on both desktop and mobile browsers
