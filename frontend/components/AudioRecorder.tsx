"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Upload } from "lucide-react";

interface AudioRecorderProps {
  onAudioReady: (file: File | null) => void;
  selectedFile: File | null;
  onPitchLevelChange?: (pitchFreq: number, dbLevel: number) => void;
}

export default function AudioRecorder({ onAudioReady, selectedFile, onPitchLevelChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [levels, setLevels] = useState<number[]>(new Array(16).fill(12));
  const [currentDb, setCurrentDb] = useState<number>(-45);
  const [detectedPitch, setDetectedPitch] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const encodeWAV = (audioBuffer: AudioBuffer): Blob => {
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const data = audioBuffer.getChannelData(0);
    const buffer = new ArrayBuffer(44 + data.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + data.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, data.length * 2, true);

    let offset = 44;
    for (let i = 0; i < data.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLiveMetering = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        let maxVal = -1;
        let maxIdx = 0;

        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIdx = i;
          }
        }
        const rms = Math.sqrt(sum / bufferLength);
        const db = Math.round(20 * Math.log10((rms + 1e-4) / 255));
        setCurrentDb(Math.max(-60, db));

        const nyquist = audioCtx.sampleRate / 2;
        const estPitch = Math.round((maxIdx / bufferLength) * (nyquist / 2));
        if (maxVal > 25) {
          setDetectedPitch(estPitch);
          if (onPitchLevelChange) onPitchLevelChange(estPitch, db);
        }

        const bars: number[] = [];
        const step = Math.floor(bufferLength / 16);
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(8, (val / 255) * 100));
        }
        setLevels(bars);

        animFrameRef.current = requestAnimationFrame(updateLiveMetering);
      };
      updateLiveMetering();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const arrayBuffer = await rawBlob.arrayBuffer();
        
        try {
          const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = encodeWAV(decodedBuffer);
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);

          const wavFile = new File([wavBlob], `voice_${Date.now()}.wav`, { type: "audio/wav" });
          onAudioReady(wavFile);
        } catch {
          const fallbackFile = new File([rawBlob], `voice_${Date.now()}.wav`, { type: "audio/wav" });
          setAudioUrl(URL.createObjectURL(rawBlob));
          onAudioReady(fallbackFile);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone permission required to record. You can also upload an audio file directly.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlayingPreview(false);
    setLevels(new Array(16).fill(12));
    setCurrentDb(-45);
    setDetectedPitch(0);
    onAudioReady(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      onAudioReady(file);
    }
  };

  const togglePreview = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#E5E0D6]/90 border border-[#D8D2C4] rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? "bg-[#C89585] animate-ping" : audioUrl ? "bg-[#7B9080]" : "bg-[#B5AD9E]"
              }`}
            />
            <span className="font-bold text-[#2C3330]">
              {isRecording ? `Recording: ${recordingSeconds}s` : audioUrl ? "Audio Ready" : "Record Voice Sample"}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[#58635D]">
            <span>dB: <strong className="text-[#7B9080]">{currentDb} dB</strong></span>
            <span>Pitch: <strong className="text-[#C89585]">{detectedPitch} Hz</strong></span>
            {audioUrl && (
              <button onClick={resetRecording} className="text-[#58635D] hover:text-[#2C3330] flex items-center gap-1 ml-1">
                <RotateCcw className="w-3 h-3" />
                Retake
              </button>
            )}
          </div>
        </div>

        <div className="h-10 bg-[#DFD9CD] rounded-lg flex items-end justify-between px-2 py-1.5 gap-1 mb-2.5">
          {levels.map((lvl, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-sm transition-all duration-75"
              style={{
                height: isRecording ? `${Math.min(100, lvl)}%` : audioUrl ? "40%" : "12%",
                backgroundColor: isRecording ? "#C89585" : audioUrl ? "#7B9080" : "#B5AD9E",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!audioUrl ? (
            isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="flex-1 py-2.5 bg-[#C89585] hover:bg-[#B37E6F] text-[#F7F5F0] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#5C6B73] flex items-center justify-center gap-2 transition"
              >
                <Square className="w-3.5 h-3.5" />
                Finish Recording ({recordingSeconds}s)
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="flex-1 py-2.5 bg-[#C89585] hover:bg-[#B37E6F] text-[#F7F5F0] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#5C6B73] flex items-center justify-center gap-2 transition"
              >
                <Mic className="w-3.5 h-3.5" />
                Start Voice Recording
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={togglePreview}
                className="flex-1 py-2.5 bg-[#7B9080] hover:bg-[#6B8070] text-[#F7F5F0] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#5C6B73] flex items-center justify-center gap-2 transition"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause Sample Preview
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Play Sample Preview
                  </>
                )}
              </button>
              <audio
                ref={previewAudioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlayingPreview(false)}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      <div className="relative border border-dashed border-[#B5AD9E] rounded-xl p-2.5 text-center bg-[#DFD9CD]/80 hover:bg-[#DFD9CD] transition cursor-pointer">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#58635D]">
          <Upload className="w-3.5 h-3.5 text-[#7B9080]" />
          <span>{selectedFile ? `Selected: ${selectedFile.name}` : "Or click / drag & drop audio (.wav, .mp3)"}</span>
        </div>
      </div>
    </div>
  );
}
