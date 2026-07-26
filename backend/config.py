import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATA_DIR = BASE_DIR / "data"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
BACKEND_DIR.mkdir(parents=True, exist_ok=True)

# Add backend to sys.path for foolproof imports anywhere
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Database Paths
DB_PATH = DATA_DIR / "life_ai_os.db"
CHROMA_DB_PATH = DATA_DIR / "chroma_db"

# Load .env if present locally
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)

# API Keys & Tokens
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()

# Cloud Server Configuration
PORT = int(os.getenv("PORT", 8008))
HOST = os.getenv("HOST", "0.0.0.0")

# Preferred AI Models
DEFAULT_ROUTER_MODEL = "gemini-2.0-flash"
REASONING_MODEL = "claude-3-5-sonnet"
