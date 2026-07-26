import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR / ".env")

# Database Paths
DB_PATH = DATA_DIR / "life_ai_os.db"
CHROMA_DB_PATH = DATA_DIR / "chroma_db"

# API Keys & Tokens
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Preferred Models
DEFAULT_ROUTER_MODEL = "gemini-1.5-flash"
REASONING_MODEL = "claude-3-5-sonnet"
LOCAL_MODEL = "llama3.1"
