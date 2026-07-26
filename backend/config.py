import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Load .env if present locally, otherwise fallback to OS environment variables
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)

# API Keys & Tokens (Loaded from OS environment variables on Render/Cloud)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Preferred Models
DEFAULT_ROUTER_MODEL = "gemini-2.0-flash"
REASONING_MODEL = "claude-3-5-sonnet"
