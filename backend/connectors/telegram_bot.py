import os
import sys
import time
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from config import TELEGRAM_BOT_TOKEN
from agent_router import agent_router

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def send_telegram_message(chat_id: int, text: str, parse_mode: str = "Markdown"):
    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"[Telegram Bot] Send Error: {e}")

def process_update(update: dict):
    if "message" not in update:
        return

    msg = update["message"]
    chat_id = msg["chat"]["id"]
    text = msg.get("text", "")
    
    # Handle /start or /help commands
    if text in ["/start", "/help"]:
        welcome_text = (
            "🤖 *Life AI OS Canlı Asistanına Hoş Geldiniz!*\n\n"
            "Ben Misa'nın tüm hayatını, projelerini, kararlarını ve günlerini 7/24 takip eden canlı AI yaşam asistanıyım.\n\n"
            "💡 *Neler Yapabilirsiniz?*\n"
            "• Herhangi bir fikir, karar, görüşme veya yapılacağı bana mesaj atın.\n"
            "• Sesli not gönderin (AI anında özet çıkarır).\n"
            "• Otomatik görevler ve proaktif tavsiyeler üretirim.\n\n"
            "🖥️ *Canlı Web Dashboard:* http://localhost:3000"
        )
        send_telegram_message(chat_id, welcome_text)
        return

    # Handle voice messages if present
    if "voice" in msg:
        voice_text = "[Telegram Sesli Not Alındı]: Ses kaydınız kaydedildi ve AI analizine gönderildi."
        res = agent_router.process_input(voice_text, source="telegram_voice")
        reply_msg = (
            f"🎙️ *Sesli Not İşlendi*\n\n"
            f"🤖 *AI Yanıtı:* {res['reply']}\n"
            f"⚡ *Özet:* {res.get('summary', '')}"
        )
        send_telegram_message(chat_id, reply_msg)
        return

    if not text:
        return

    # Process text input through Agent Router (Gemini Live API)
    print(f"[Telegram Bot] Received: '{text}' from chat {chat_id}")
    res = agent_router.process_input(text, source="telegram")

    # Format Telegram reply
    tasks_text = ""
    if res.get("extracted_tasks"):
        tasks = "\n".join([f"• {t['title']}" for t in res["extracted_tasks"]])
        tasks_text = f"\n\n📌 *Eklenen Görevler:*\n{tasks}"

    proactive_text = ""
    if res.get("proactive_insight"):
        proactive_text = f"\n\n💡 *Proaktif AI Tavsiyesi:*\n{res['proactive_insight']}"

    telegram_reply = (
        f"🤖 *AI Yaşam Asistanı Yanıtı:*\n"
        f"{res['reply']}"
        f"{tasks_text}"
        f"{proactive_text}"
    )

    send_telegram_message(chat_id, telegram_reply)

def run_bot_polling():
    if not BOT_TOKEN:
        print("[Telegram Bot] TELEGRAM_BOT_TOKEN bulunamadı!")
        return

    print(f"[Telegram Bot] Polling başlatıldı... Bot @Misanaibibot dinlemede!")
    offset = 0

    while True:
        try:
            url = f"{TELEGRAM_API_URL}/getUpdates?offset={offset}&timeout=20"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=25) as response:
                result = json.loads(response.read().decode("utf-8"))
                if result.get("ok"):
                    for update in result.get("result", []):
                        offset = update["update_id"] + 1
                        process_update(update)
        except Exception as e:
            print(f"[Telegram Bot] Polling Hatası (Yeniden deneniyor...): {e}")
            time.sleep(3)

if __name__ == "__main__":
    run_bot_polling()
