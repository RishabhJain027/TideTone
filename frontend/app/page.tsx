"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Volume2,
  Sparkles,
  RefreshCw,
  Globe2,
  Smile,
  Bot,
  Baby,
  User,
  Music,
  Activity,
  Headphones,
  VolumeX,
  Lock,
  Sliders,
  CheckCircle2,
  Heart,
  Languages,
  ArrowRight,
  Volume1
} from "lucide-react";
import SiriVisualizer from "@/components/SiriVisualizer";
import BeachDroneBackground from "@/components/BeachDroneBackground";
import TideToneLogo from "@/components/TideToneLogo";

interface VoiceOption {
  id: string;
  name: string;
  persona: string;
  lang: string;
  target_lang?: string;
  avatar?: string;
  flag?: string;
  desc?: string;
}

interface JobHistoryItem {
  id: string;
  text: string;
  spokenText?: string;
  voiceName: string;
  audioUrl: string;
  timestamp: string;
}

export default function TideToneStudio() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [text, setText] = useState(
    "Hello there. Welcome to TideTone. Lean in, listen closely, and let me tell you everything you want to hear."
  );
  const [voiceId, setVoiceId] = useState<string>("female_aria");
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0.0);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string>("http://localhost:8000");

  const [sessionId, setSessionId] = useState<string>("user_default");

  const [voices, setVoices] = useState<VoiceOption[]>([
    { id: "female_aria", name: "Aria", persona: "Female", lang: "English (US)", target_lang: "en", avatar: "/avatars/aria.jpg", flag: "🇺🇸", desc: "Silky, warm broadcast host" },
    { id: "female_ankita", name: "Ankita", persona: "Female", lang: "Hindi (हिंदी)", target_lang: "hi", avatar: "/avatars/ankita.jpg", flag: "🇮🇳", desc: "Gentle Indian narrator" },
    { id: "female_sonia", name: "Sonia", persona: "Female", lang: "English (UK)", target_lang: "en", avatar: "/avatars/sonia.jpg", flag: "🇬🇧", desc: "Sophisticated British studio voice" },
    { id: "male_guy", name: "Guy", persona: "Male", lang: "English (US)", target_lang: "en", avatar: "/avatars/guy.jpg", flag: "🇺🇸", desc: "Dynamic cinematic narrator" },
    { id: "male_prabhat", name: "Prabhat", persona: "Male", lang: "English (India)", target_lang: "en", avatar: "/avatars/prabhat.jpg", flag: "🇮🇳", desc: "Indian English storyteller" },
    { id: "male_ryan", name: "Ryan", persona: "Male", lang: "English (UK)", target_lang: "en", avatar: "/avatars/ryan.jpg", flag: "🇬🇧", desc: "Deep BBC documentary voice" },
    { id: "child_ana", name: "Ana", persona: "Child", lang: "English (US)", target_lang: "en", avatar: "/avatars/ana.jpg", flag: "🌟", desc: "Bright, cheerful & playful kid" },
    { id: "alien_zorg", name: "Zorg", persona: "Alien", lang: "Cosmic Entity", target_lang: "en", avatar: "/avatars/alien.jpg", flag: "🛸", desc: "Galactic space traveler" },
    { id: "cartoon_chirp", name: "Chirp", persona: "Cartoon", lang: "Comic Animation", target_lang: "en", avatar: "/avatars/cartoon.jpg", flag: "🎨", desc: "Animated comic character" },
    { id: "hindi_madhur", name: "Madhur", persona: "Male", lang: "Hindi (हिंदी)", target_lang: "hi", avatar: "/avatars/madhur.jpg", flag: "🇮🇳", desc: "Deep Indian Hindi voice" },
    { id: "japanese_nanami", name: "Nanami", persona: "Female", lang: "Japanese (日本語)", target_lang: "ja", avatar: "/avatars/nanami.jpg", flag: "🇯🇵", desc: "Gentle Tokyo Japanese voice" },
    { id: "spanish_elvira", name: "Elvira", persona: "Female", lang: "Spanish (Español)", target_lang: "es", avatar: "/avatars/elvira.jpg", flag: "🇪🇸", desc: "Warm Castilian Spanish" },
    { id: "french_denise", "name": "Denise", persona: "Female", lang: "French (Français)", target_lang: "fr", avatar: "/avatars/denise.jpg", flag: "🇫🇷", desc: "Chic Parisian French" },
    { id: "german_katja", "name": "Katja", persona: "Female", lang: "German (Deutsch)", target_lang: "de", avatar: "/avatars/katja.jpg", flag: "🇩🇪", desc: "Smooth Berlin German voice" },
  ]);

  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);

  useEffect(() => {
    let sid = localStorage.getItem("tidetone_session_id");
    if (!sid) {
      sid = "usr_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("tidetone_session_id", sid);
    }
    setSessionId(sid);

    const checkUrl = async () => {
      const candidates = [
        "http://localhost:8000",
        process.env.NEXT_PUBLIC_API_URL,
        "https://appliances-exotic-held-literature.trycloudflare.com"
      ].filter(Boolean) as string[];

      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/api/health`, { method: "GET" });
          if (res.ok) {
            setApiBase(base);
            setBackendHealthy(true);
            const vRes = await fetch(`${base}/api/voices`);
            if (vRes.ok) {
              const vData = await vRes.json();
              if (vData.prebuilt) setVoices(vData.prebuilt);
            }
            return;
          }
        } catch {}
      }
      setBackendHealthy(true);
    };

    checkUrl();
  }, []);

  const setupWebAudio = () => {
    if (!audioRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaElementSource(audioRef.current);
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        src.connect(an);
        an.connect(ctx.destination);
        setAnalyser(an);
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn("Web Audio notice:", e);
    }
  };

  const playDirectly = (url: string) => {
    setAudioUrl(url);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setupWebAudio();
          setIsPlaying(true);
        })
        .catch((e) => {
          console.warn("Play error:", e);
        });
    }
  };

  const handleGenerateTTS = async (customVoiceId?: string, customText?: string) => {
    const targetVid = customVoiceId || voiceId;
    const targetTxt = customText || text;
    if (!targetTxt.trim()) return;

    setLoading(true);
    if (customVoiceId) setPreviewingVoice(customVoiceId);
    setStatusMessage("Synthesizing neural voice...");

    try {
      const fd = new FormData();
      fd.append("text", targetTxt);
      fd.append("voice_id", targetVid);
      fd.append("speed", speed.toString());
      fd.append("pitch", pitch.toString());
      fd.append("session_id", sessionId);
      fd.append("auto_translate", autoTranslate.toString());

      const res = await fetch(`${apiBase}/api/tts/generate`, {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const playableUrl = data.audio_base64 || (data.download_url.startsWith("http") ? data.download_url : `${apiBase}${data.download_url}`);
          const currentVoice = voices.find((v) => v.id === targetVid);
          const currentVoiceName = currentVoice?.name || "Aria";

          if (data.spoken_text) {
            setLastSpokenText(data.spoken_text);
          }

          setStatusMessage(`Voice synthesized in ${currentVoice?.lang || "Selected Language"}!`);

          setHistory((prev) => [
            {
              id: data.job_id,
              text: targetTxt.slice(0, 45) + (targetTxt.length > 45 ? "..." : ""),
              spokenText: data.spoken_text,
              voiceName: currentVoiceName,
              audioUrl: playableUrl,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
            ...prev.slice(0, 5),
          ]);

          playDirectly(playableUrl);
          setLoading(false);
          setPreviewingVoice(null);
          return;
        }
      }
      throw new Error("Backend synthesis failed");
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(targetTxt);
        utterance.rate = speed * 0.95;
        utterance.pitch = 1.0 + pitch * 0.15;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setStatusMessage("Playing via Native Speech Engine");
      }
    } finally {
      setLoading(false);
      setPreviewingVoice(null);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) {
      if (text.trim()) handleGenerateTTS();
      return;
    }
    setupWebAudio();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const selectedVoiceObj = voices.find((v) => v.id === voiceId) || voices[0];

  const filteredVoices = voices.filter((v) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "female") return v.persona === "Female";
    if (activeCategory === "male") return v.persona === "Male";
    if (activeCategory === "child") return v.persona === "Child";
    if (activeCategory === "alien") return v.persona === "Alien";
    if (activeCategory === "cartoon") return v.persona === "Cartoon";
    if (activeCategory === "languages") return !v.lang.includes("English");
    return true;
  });

  return (
    <div className="relative min-h-screen text-[#0A1128] flex flex-col justify-between overflow-x-hidden font-sans selection:bg-[#BEE1E6] selection:text-[#0A1128]">
      <BeachDroneBackground />

      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* Floating Translucent Liquid Glass Header */}
        <header className="backdrop-blur-2xl bg-white/[0.30] border border-white/60 rounded-3xl p-4 sm:px-7 mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
          <div className="flex items-center gap-4">
            <TideToneLogo className="w-12 h-12 transition-transform hover:scale-105" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[#0A1128]">
                  TideTone
                </h1>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#FFB5A7]/40 text-[#8C3A2E] px-3 py-0.5 rounded-full border border-white/70 shadow-xs backdrop-blur-md">
                  Multilingual AI Studio
                </span>
              </div>
              <p className="text-xs text-[#3A506B] font-semibold">
                Neural Speech Synthesis • 14 Custom Avatars • Liquid Glassmorphism
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.35] backdrop-blur-xl rounded-2xl border border-white/60 text-xs font-mono text-[#0A1128] font-bold shadow-xs">
              <Lock className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Session: <strong className="text-[#E07A5F]">{sessionId.slice(0, 8)}</strong></span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.35] backdrop-blur-xl rounded-2xl border border-white/60 text-xs font-bold text-[#0A1128] shadow-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${backendHealthy ? "bg-[#81B29A] animate-pulse" : "bg-[#F4A261]"}`} />
              <span>{backendHealthy ? "Engine Ready" : "Local Engine"}</span>
              <button onClick={() => window.location.reload()} className="hover:text-[#81B29A] ml-1">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Studio Workspace */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Singularity Shader Stage */}
          <section className="lg:col-span-6 backdrop-blur-2xl bg-white/[0.28] border border-white/60 rounded-3xl p-6 sm:p-8 flex flex-col items-center relative shadow-[0_24px_60px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]">
            <div className="w-full flex justify-between items-center mb-2 z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-[#FFB5A7] animate-ping" : "bg-[#BEE1E6]"}`} />
                <span className="text-xs font-black uppercase tracking-wider text-[#0A1128]">
                  {isPlaying ? "Black Hole Accretion Disk (Active)" : "Singularity Orb (Standby)"}
                </span>
              </div>
              <span className="text-xs font-mono text-[#3A506B] font-bold bg-white/[0.4] px-2.5 py-0.5 rounded-full border border-white/60 shadow-xs backdrop-blur-md">
                {isPlaying ? "Live Audio FFT" : "GLSL Quantum Accretion"}
              </span>
            </div>

            <div className="w-full flex justify-center py-2 z-10">
              <SiriVisualizer analyserNode={analyser} isPlaying={isPlaying} />
            </div>

            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              preload="auto"
              onPlay={() => {
                setupWebAudio();
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
              className="hidden"
            />

            {/* Translated Narration Pill */}
            {lastSpokenText && (
              <div className="w-full mt-3 bg-white/[0.45] backdrop-blur-md border border-white/70 p-3 rounded-2xl z-10 shadow-xs flex items-center gap-2 text-xs">
                <Languages className="w-4 h-4 text-[#81B29A] shrink-0" />
                <div className="truncate flex-1 font-medium text-[#0A1128]">
                  <strong className="text-[#81B29A] mr-1.5">Spoken:</strong>
                  <span>{lastSpokenText}</span>
                </div>
              </div>
            )}

            {/* Translucent Player Bar with Prominent Controls */}
            <div className="w-full mt-4 bg-white/[0.35] backdrop-blur-xl border border-white/60 rounded-2xl p-4 space-y-3 z-10 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#0A1128]">
                <span>
                  {Math.floor(audioCurrentTime)}s / {Math.floor(audioDuration || 0)}s
                </span>
                <span className="text-[#81B29A] font-extrabold uppercase tracking-wider">
                  {audioUrl ? `Speaking as ${selectedVoiceObj.name}` : "Ready to Synthesize"}
                </span>
              </div>

              <div
                className="w-full bg-white/[0.4] h-3 rounded-full cursor-pointer overflow-hidden border border-white/60 relative shadow-inner"
                onClick={(e) => {
                  if (!audioRef.current || !audioDuration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = pos * audioDuration;
                }}
              >
                <div
                  className="bg-gradient-to-r from-[#BEE1E6] via-[#FFB5A7] to-[#FCD5CE] h-full rounded-full transition-all"
                  style={{
                    width: `${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Play / Pause, Volume Slider & Download Button */}
              <div className="flex items-center gap-2 pt-1 w-full">
                <button
                  onClick={togglePlayback}
                  className="flex-1 py-3 bg-gradient-to-r from-[#BEE1E6]/90 to-[#98D8C8]/90 hover:from-[#98D8C8] hover:to-[#BEE1E6] text-[#0A1128] font-extrabold text-xs uppercase tracking-wider rounded-2xl border border-white/80 shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 backdrop-blur-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause Speech" : "Play In-Browser Audio"}
                </button>

                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white/[0.45] backdrop-blur-md rounded-2xl border border-white/60 shadow-xs shrink-0">
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-[#3A506B]" /> : <Volume2 className="w-3.5 h-3.5 text-[#81B29A]" />}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    className="w-14 sm:w-16 h-1.5 accent-[#81B29A]"
                    title="Volume"
                  />
                </div>

                {audioUrl && (
                  <a
                    href={audioUrl}
                    download="tidetone_voice.mp3"
                    className="px-3.5 py-3 bg-white/[0.6] hover:bg-white text-[#0A1128] font-extrabold text-xs rounded-2xl border border-white/80 shadow-xs transition flex items-center gap-1.5 backdrop-blur-md active:scale-95"
                    title="Download audio file"
                  >
                    <Download className="w-4 h-4 text-[#E07A5F]" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
              </div>

              {/* Mobile Download Button */}
              {audioUrl && (
                <a
                  href={audioUrl}
                  download="tidetone_voice.mp3"
                  className="sm:hidden w-full py-2.5 bg-white/[0.5] hover:bg-white text-[#0A1128] font-extrabold text-xs rounded-xl border border-white/70 shadow-xs transition flex items-center justify-center gap-1.5 backdrop-blur-md mt-2"
                >
                  <Download className="w-4 h-4 text-[#E07A5F]" />
                  <span>Download MP3 Audio</span>
                </a>
              )}
            </div>

            {/* Persona Categories Badges */}
            <div className="w-full mt-4 flex flex-wrap gap-1.5 justify-center text-xs z-10">
              {[
                { id: "all", label: "All Personas", icon: Sparkles },
                { id: "female", label: "Female (Warm)", icon: Heart },
                { id: "male", label: "Male (Deep)", icon: User },
                { id: "child", label: "Child", icon: Baby },
                { id: "alien", label: "Alien", icon: Bot },
                { id: "cartoon", label: "Cartoon", icon: Smile },
                { id: "languages", label: "Languages", icon: Globe2 },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold backdrop-blur-md ${
                      activeCategory === cat.id
                        ? "bg-[#BEE1E6]/90 text-[#0A1128] border-white shadow-sm scale-105"
                        : "bg-white/[0.3] hover:bg-white/[0.6] text-[#0A1128] border-white/50 shadow-2xs"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right Column: Studio Controls */}
          <section className="lg:col-span-6 backdrop-blur-2xl bg-white/[0.28] border border-white/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_24px_60px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]">
            <div className="flex items-center justify-between border-b border-white/50 pb-3">
              <h2 className="text-lg font-black text-[#0A1128] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E07A5F]" />
                Neural Speech Synthesizer
              </h2>

              <div
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border cursor-pointer transition text-xs font-bold backdrop-blur-md ${
                  autoTranslate
                    ? "bg-[#81B29A]/80 text-[#0A1128] border-white shadow-xs"
                    : "bg-white/[0.3] text-[#3A506B] border-white/50"
                }`}
                title="Toggle Automatic Language Translation"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Auto-Translate: {autoTranslate ? "ON" : "OFF"}</span>
              </div>
            </div>

            {statusMessage && (
              <div className="bg-[#BEE1E6]/80 backdrop-blur-md border border-white/80 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold text-[#0A1128] shadow-xs">
                <span>{statusMessage}</span>
                <button onClick={() => setStatusMessage(null)} className="text-[#0A1128] font-black ml-2">
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-[#0A1128]">
                  <label className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#E07A5F]" />
                    Narration Script
                  </label>
                  <span className="text-[#3A506B] font-mono">{text.length} chars</span>
                </div>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type in English, Hindi, Japanese, or any language..."
                  className="w-full bg-white/[0.4] backdrop-blur-xl border border-white/60 rounded-2xl p-4 text-sm font-medium text-[#0A1128] placeholder:text-[#3A506B] focus:outline-none focus:border-[#BEE1E6] focus:ring-2 focus:ring-[#BEE1E6]/50 resize-none shadow-xs"
                />
                <div className="flex gap-2 flex-wrap">
                  {[
                    "Hello there. Welcome to TideTone. Listen closely and let me speak to you.",
                    "The sunset over the beach is peaceful, calm, and soothing.",
                    "Good morning! I hope you have a wonderful day ahead.",
                    "Greetings traveler, cosmic coordinates are locked and ready.",
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setText(prompt)}
                      className="text-[11px] font-bold bg-white/[0.3] hover:bg-white/[0.6] text-[#3A506B] hover:text-[#0A1128] px-3 py-1 rounded-xl border border-white/50 shadow-2xs backdrop-blur-md transition"
                    >
                      Preset #{pIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* 14 Persona Grid with 1-Click Instant Previews */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-[#0A1128]">
                  <label className="flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-[#E07A5F]" />
                    Select Persona & Instant Preview (Click Character)
                  </label>
                  <span className="text-[#81B29A] font-semibold flex items-center gap-1">
                    Language: <strong>{selectedVoiceObj.lang}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {filteredVoices.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        setVoiceId(v.id);
                        handleGenerateTTS(v.id, text);
                      }}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center text-center relative backdrop-blur-xl group ${
                        voiceId === v.id
                          ? "bg-gradient-to-tr from-[#BEE1E6]/90 to-[#D8E2DC]/90 text-[#0A1128] border-white shadow-lg scale-[1.04]"
                          : "bg-white/[0.3] hover:bg-white/[0.6] hover:-translate-y-0.5 text-[#0A1128] border-white/50 shadow-2xs"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden mb-1.5 border border-white/80 bg-white/50 relative shadow-xs">
                        {v.avatar ? (
                          <img src={v.avatar} alt={v.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-[#81B29A] text-sm">{v.name[0]}</div>
                        )}
                        {v.flag && (
                          <span className="absolute bottom-0 right-0 text-xs drop-shadow-xs">{v.flag}</span>
                        )}
                        {previewingVoice === v.id && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                            <Volume2 className="w-5 h-5 animate-spin" />
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold text-xs truncate w-full flex items-center justify-center gap-1">
                        {v.name}
                      </span>
                      <span className={`text-[10px] font-semibold truncate w-full ${voiceId === v.id ? "text-[#0A1128]" : "text-[#3A506B]"}`}>
                        {v.lang.split("/")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.35] backdrop-blur-xl border border-white/60 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex justify-between text-xs font-bold text-[#0A1128]">
                    <span>Pace / Speed</span>
                    <span className="font-mono text-[#E07A5F] font-black">{speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#E07A5F]"
                  />
                </div>

                <div className="bg-white/[0.35] backdrop-blur-xl border border-white/60 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <div className="flex justify-between text-xs font-bold text-[#0A1128]">
                    <span>Pitch Tuning</span>
                    <span className="font-mono text-[#E07A5F] font-black">
                      {pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1)} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="4.0"
                    step="0.5"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-[#E07A5F]"
                  />
                </div>
              </div>

              <button
                onClick={() => handleGenerateTTS()}
                disabled={loading || !text.trim()}
                className="w-full py-4 bg-gradient-to-r from-[#FFB5A7]/95 via-[#FCD5CE]/95 to-[#FFB5A7]/95 hover:from-[#FCD5CE] hover:to-[#FFB5A7] text-[#0A1128] font-black text-xs uppercase tracking-wider rounded-2xl border border-white/90 shadow-lg active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Synthesizing Speech..." : `Generate Voice & Play Instantly (${selectedVoiceObj.name})`}
              </button>
            </div>

            {history.length > 0 && (
              <div className="pt-3 border-t border-white/50 space-y-2">
                <label className="text-xs font-black text-[#0A1128] uppercase tracking-wider">
                  Your Private Session Takes
                </label>
                <div className="space-y-1.5">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white/[0.35] backdrop-blur-xl p-3 rounded-2xl border border-white/60 text-xs shadow-xs"
                    >
                      <div className="truncate max-w-[220px]">
                        <span className="font-black text-[#E07A5F] mr-2">{item.voiceName}</span>
                        <span className="text-[#0A1128] font-medium truncate">{item.spokenText || item.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playDirectly(item.audioUrl)}
                          className="p-1 hover:text-[#E07A5F] text-[#0A1128] font-black flex items-center gap-1"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </button>
                        <a href={item.audioUrl} download="tidetone_voice.mp3" className="p-1 hover:text-[#E07A5F] text-[#3A506B]">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className="max-w-7xl mx-auto w-full p-4 sm:px-8 mt-6 text-center text-xs text-[#3A506B] font-bold">
        TideTone Multilingual Studio • Neural Speech Synthesizer • Translucent Liquid Glassmorphism
      </footer>
    </div>
  );
}
