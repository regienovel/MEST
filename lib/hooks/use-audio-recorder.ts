'use client';
import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const animFrame = useRef<number>(0);
  const analyser = useRef<AnalyserNode | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Determine supported mime type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    const recorder = new MediaRecorder(stream, { mimeType });

    audioCtx.current = new AudioContext();
    const source = audioCtx.current.createMediaStreamSource(stream);
    analyser.current = audioCtx.current.createAnalyser();
    analyser.current.fftSize = 256;
    source.connect(analyser.current);

    chunks.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    recorder.start(100); // collect data every 100ms
    mediaRecorder.current = recorder;
    setRecording(true);

    const levelArray = new Uint8Array(analyser.current.frequencyBinCount);
    const updateLevel = () => {
      if (analyser.current) {
        analyser.current.getByteFrequencyData(levelArray);
        const avg = levelArray.reduce((a, b) => a + b, 0) / levelArray.length;
        setAudioLevel(avg / 255);
      }
      animFrame.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
  }, []);

  const stop = useCallback(async (): Promise<Blob> => {
    cancelAnimationFrame(animFrame.current);
    setAudioLevel(0);

    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(new Blob([], { type: 'audio/webm' }));
        return;
      }
      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunks.current, { type: mimeType });
        chunks.current = [];
        setRecording(false);
        resolve(blob);
      };
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      audioCtx.current?.close();
    });
  }, []);

  return { recording, audioLevel, start, stop };
}
