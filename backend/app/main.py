import os, sys, io, uuid, json, math, struct, asyncio, numpy as np
from pathlib import Path
from typing import Optional, List, Dict

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend_engine"))

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

try:
    from deep_translator import MyMemoryTranslator, GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False

app = FastAPI(title="TideTone Multilingual Studio", version="3.9.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = BASE_DIR / "storage"
USERS_DIR = STORAGE_DIR / "users"
USERS_DIR.mkdir(parents=True, exist_ok=True)

VOICE_CATALOG = [
    {"id": "female_aria", "name": "Aria", "persona": "Female", "lang": "English (US)", "target_lang": "en", "mymemory_lang": "en-US", "avatar": "/avatars/aria.jpg", "flag": "🇺🇸", "desc": "Silky, warm & captivating broadcast host", "tts_voice": "en-US-AvaNeural", "rate_mod": "-3%", "pitch_mod": "-1Hz"},
    {"id": "female_ankita", "name": "Ankita", "persona": "Female", "lang": "Hindi (हिंदी)", "target_lang": "hi", "mymemory_lang": "hi-IN", "avatar": "/avatars/ankita.jpg", "flag": "🇮🇳", "desc": "Gentle, expressive Indian narrator", "tts_voice": "hi-IN-SwaraNeural", "rate_mod": "-4%", "pitch_mod": "-1Hz"},
    {"id": "female_sonia", "name": "Sonia", "persona": "Female", "lang": "English (UK)", "target_lang": "en", "mymemory_lang": "en-GB", "avatar": "/avatars/sonia.jpg", "flag": "🇬🇧", "desc": "Sophisticated British studio voice", "tts_voice": "en-GB-SoniaNeural", "rate_mod": "-4%", "pitch_mod": "-1Hz"},
    {"id": "male_guy", "name": "Guy", "persona": "Male", "lang": "English (US)", "target_lang": "en", "mymemory_lang": "en-US", "avatar": "/avatars/guy.jpg", "flag": "🇺🇸", "desc": "Crisp dynamic cinematic narrator", "tts_voice": "en-US-GuyNeural"},
    {"id": "male_prabhat", "name": "Prabhat", "persona": "Male", "lang": "Hindi / English", "target_lang": "hi", "mymemory_lang": "hi-IN", "avatar": "/avatars/prabhat.jpg", "flag": "🇮🇳", "desc": "Indian storyteller", "tts_voice": "en-IN-PrabhatNeural"},
    {"id": "male_ryan", "name": "Ryan", "persona": "Male", "lang": "English (UK)", "target_lang": "en", "mymemory_lang": "en-GB", "avatar": "/avatars/ryan.jpg", "flag": "🇬🇧", "desc": "Deep BBC documentary voice", "tts_voice": "en-GB-RyanNeural"},
    {"id": "child_ana", "name": "Ana", "persona": "Child", "lang": "English (US)", "target_lang": "en", "mymemory_lang": "en-US", "avatar": "/avatars/ana.jpg", "flag": "🌟", "desc": "Bright, cheerful & playful kid", "tts_voice": "en-US-AnaNeural"},
    {"id": "alien_zorg", "name": "Zorg", "persona": "Alien", "lang": "Cosmic Entity", "target_lang": "en", "mymemory_lang": "en-US", "avatar": "/avatars/alien.jpg", "flag": "🛸", "desc": "Galactic harmonic space traveler", "tts_voice": "en-US-ChristopherNeural", "pitch_mod": "+12Hz", "rate_mod": "-10%"},
    {"id": "cartoon_chirp", "name": "Chirp", "persona": "Cartoon", "lang": "Comic Animation", "target_lang": "en", "mymemory_lang": "en-US", "avatar": "/avatars/cartoon.jpg", "flag": "🎨", "desc": "Animated comic character", "tts_voice": "en-US-JennyNeural", "pitch_mod": "+35Hz", "rate_mod": "+25%"},
    {"id": "hindi_madhur", "name": "Madhur", "persona": "Male", "lang": "Hindi (हिंदी)", "target_lang": "hi", "mymemory_lang": "hi-IN", "avatar": "/avatars/madhur.jpg", "flag": "🇮🇳", "desc": "Deep Indian voice", "tts_voice": "hi-IN-MadhurNeural"},
    {"id": "japanese_nanami", "name": "Nanami", "persona": "Female", "lang": "Japanese (日本語)", "target_lang": "ja", "mymemory_lang": "ja-JP", "avatar": "/avatars/nanami.jpg", "flag": "🇯🇵", "desc": "Silky, gentle Tokyo Japanese voice", "tts_voice": "ja-JP-NanamiNeural", "rate_mod": "-4%"},
    {"id": "spanish_elvira", "name": "Elvira", "persona": "Female", "lang": "Spanish (Español)", "target_lang": "es", "mymemory_lang": "es-ES", "avatar": "/avatars/elvira.jpg", "flag": "🇪🇸", "desc": "Passionate, warm Castilian Spanish", "tts_voice": "es-ES-ElviraNeural", "rate_mod": "-3%"},
    {"id": "french_denise", "name": "Denise", "persona": "Female", "lang": "French (Français)", "target_lang": "fr", "mymemory_lang": "fr-FR", "avatar": "/avatars/denise.jpg", "flag": "🇫🇷", "desc": "Chic Parisian French", "tts_voice": "fr-FR-DeniseNeural", "rate_mod": "-4%"},
    {"id": "german_katja", "name": "Katja", "persona": "Female", "lang": "German (Deutsch)", "target_lang": "de", "mymemory_lang": "de-DE", "avatar": "/avatars/katja.jpg", "flag": "🇩🇪", "desc": "Smooth Berlin German voice", "tts_voice": "de-DE-KatjaNeural", "rate_mod": "-3%"},
]

def get_user_dirs(session_id: str):
    clean_id = "".join(c for c in session_id if c.isalnum() or c in "-_")[:36]
    if not clean_id: clean_id = "default_user"
    user_root = USERS_DIR / clean_id
    audio_dir = user_root / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    return user_root, audio_dir

def robust_translate(text: str, target_lang: str, mymemory_lang: str) -> str:
    if not text or not text.strip() or target_lang == "en":
        return text.strip()

    cleaned = text.strip()
    if TRANSLATOR_AVAILABLE:
        # Tier 1: MyMemoryTranslator
        try:
            res = MyMemoryTranslator(source='en-US', target=mymemory_lang).translate(cleaned)
            if res and len(res.strip()) > 0 and not res.startswith("MYMEMORY WARNING"):
                return res.strip()
        except Exception:
            pass

        # Tier 2: GoogleTranslator
        try:
            res = GoogleTranslator(source='auto', target=target_lang).translate(cleaned)
            if res and len(res.strip()) > 0:
                return res.strip()
        except Exception:
            pass

    return cleaned

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "TideTone Multilingual Studio",
        "version": "3.9.0",
        "storage_root": str(USERS_DIR),
        "translator": TRANSLATOR_AVAILABLE,
        "edge_tts": EDGE_TTS_AVAILABLE
    }

@app.get("/api/voices")
async def get_voices():
    return {"prebuilt": VOICE_CATALOG}

@app.post("/api/tts/generate")
async def generate_speech(
    text: str = Form(...),
    voice_id: str = Form("female_aria"),
    speed: float = Form(1.0),
    pitch: float = Form(0.0),
    session_id: str = Form("default_user"),
    auto_translate: bool = Form(True)
):
    try:
        _, audio_dir = get_user_dirs(session_id)
        job_id = f"tide_{str(uuid.uuid4())[:10]}"
        output_file = audio_dir / f"{job_id}.mp3"

        selected_voice = next((v for v in VOICE_CATALOG if v["id"] == voice_id), VOICE_CATALOG[0])
        tts_voice_name = selected_voice.get("tts_voice", "en-US-AvaNeural")
        target_lang = selected_voice.get("target_lang", "en")
        mymemory_lang = selected_voice.get("mymemory_lang", "en-US")

        spoken_text = text.strip()
        if auto_translate and target_lang != "en":
            spoken_text = robust_translate(text, target_lang, mymemory_lang)

        base_speed_delta = 0
        if selected_voice.get("rate_mod"):
            try:
                base_speed_delta = int(selected_voice["rate_mod"].replace("%", ""))
            except Exception:
                pass

        base_pitch_delta = 0
        if selected_voice.get("pitch_mod") and "Hz" in selected_voice.get("pitch_mod", ""):
            try:
                base_pitch_delta = int(selected_voice["pitch_mod"].replace("Hz", ""))
            except Exception:
                pass

        user_speed_percent = int(round((speed - 1.0) * 100))
        total_speed_percent = user_speed_percent + base_speed_delta
        rate_str = f"+{total_speed_percent}%" if total_speed_percent >= 0 else f"{total_speed_percent}%"

        user_pitch_val = int(round(pitch * 5))
        total_pitch_val = user_pitch_val + base_pitch_delta
        pitch_str = f"+{total_pitch_val}Hz" if total_pitch_val >= 0 else f"{total_pitch_val}Hz"

        saved_successfully = False
        if EDGE_TTS_AVAILABLE:
            try:
                communicate = edge_tts.Communicate(text=spoken_text, voice=tts_voice_name, rate=rate_str, pitch=pitch_str)
                await communicate.save(str(output_file))
                saved_successfully = output_file.exists() and output_file.stat().st_size > 0
            except Exception:
                saved_successfully = False

        if not saved_successfully and GTTS_AVAILABLE:
            try:
                tts = gTTS(text=spoken_text, lang=target_lang if target_lang in ["hi", "ja", "es", "fr", "de", "en"] else "en")
                tts.save(str(output_file))
                saved_successfully = True
            except Exception:
                saved_successfully = False

        if not saved_successfully:
            raise Exception("Unable to synthesize audio on server")

        return {
            "success": True,
            "job_id": job_id,
            "voice_id": voice_id,
            "spoken_text": spoken_text,
            "target_lang": target_lang,
            "download_url": f"/api/audio/download/{session_id}/{job_id}",
            "stream_url": f"/api/audio/stream/{session_id}/{job_id}"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": str(e), "message": "Failed to synthesize speech. Please retry."}
        )

@app.get("/api/audio/download/{session_id}/{job_id}")
async def download_audio(session_id: str, job_id: str):
    _, audio_dir = get_user_dirs(session_id)
    file_path = None
    for ext in [".mp3", ".wav"]:
        candidate = audio_dir / f"{job_id}{ext}"
        if candidate.exists():
            file_path = candidate
            break

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    media_type = "audio/mpeg" if file_path.suffix == ".mp3" else "audio/wav"
    return FileResponse(str(file_path), media_type=media_type, filename=f"tidetone_{job_id}{file_path.suffix}", headers={"Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*"})

@app.get("/api/audio/stream/{session_id}/{job_id}")
async def stream_audio(session_id: str, job_id: str):
    _, audio_dir = get_user_dirs(session_id)
    file_path = None
    for ext in [".mp3", ".wav"]:
        candidate = audio_dir / f"{job_id}{ext}"
        if candidate.exists():
            file_path = candidate
            break

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    media_type = "audio/mpeg" if file_path.suffix == ".mp3" else "audio/wav"
    return FileResponse(str(file_path), media_type=media_type, headers={"Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"})
