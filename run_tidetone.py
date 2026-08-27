"""
TideTone Launcher Script
Runs both FastAPI Backend (port 8000) and Next.js Frontend (port 3000) concurrently.
"""
import subprocess
import sys
import time
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

def run_tidetone():
    print("=" * 60)
    print("🌊 Starting TideTone AI Voice Studio...")
    print("=" * 60)
    
    # 1. Start Backend
    print("[1/2] Launching FastAPI Backend on http://localhost:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    backend_process = subprocess.Popen(backend_cmd, cwd=str(ROOT_DIR / "backend"))
    
    time.sleep(1)
    
    # 2. Start Frontend
    print("[2/2] Launching Next.js Studio on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_process = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(ROOT_DIR / "frontend"))
    
    print("\n✅ TideTone Studio is running!")
    print("👉 Frontend: http://localhost:3000")
    print("👉 Backend API: http://localhost:8000\n")
    print("Press Ctrl+C to stop both servers.")
    
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping TideTone processes...")
        backend_process.terminate()
        frontend_process.terminate()
        print("TideTone stopped successfully.")

if __name__ == "__main__":
    run_tidetone()
