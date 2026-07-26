import os
import json
import urllib.request
from memory_engine import memory
from proactive_advisor import proactive_advisor
from config import GEMINI_API_KEY

class AgentRouter:
    def __init__(self):
        self.api_key = GEMINI_API_KEY

    def process_input(self, user_input: str, source: str = "telegram", metadata: dict = None) -> dict:
        recent_logs = memory.get_recent_logs(limit=5)
        profile = memory.get_profile()
        
        context_str = "\n".join([f"- [{log['timestamp']}] ({log['category']}): {log['content']}" for log in recent_logs])
        profile_str = "\n".join([f"- {k}: {v['value']}" for k, v in profile.items()]) if profile else "Bilinmiyor."

        system_prompt = f"""
Sen sadece not alan bir araç DEĞİLSİN. Sen Misa'nın hayatını canlı takip eden, kararlarında rehberlik eden ve proaktif yönlendirme yapan KİŞİSEL YAPAY ZEKA HAYAT KOÇUSUN (Life AI OS).

Kullanıcı Profili:
{profile_str}

Mevcut Son Bağlam:
{context_str}

Kullanıcı Girdisi: "{user_input}"
Kaynak: {source}

Lütfen şu formatta JSON döndür:
{{
    "reply": "Kullanıcıya verilecek doğrudan, samimi, akıllı, derinlikli ve yönlendirici yanıt",
    "category": "personal | project | call | research | task",
    "summary": "1 cümlelik öz ve analitik özet",
    "extracted_tasks": ["Yapılacak iş 1"],
    "proactive_insight": "Bu girdiye dayanarak kullanıcıya verilmesi gereken PROAKTİF TAVSİYE / UYARI",
    "tags": ["etiket1", "etiket2"]
}}
"""

        result = self._call_ai(system_prompt, user_input, source)
        
        log_id = memory.add_log(
            source=source,
            category=result.get("category", "personal"),
            content=user_input,
            summary=result.get("summary", ""),
            tags=result.get("tags", []),
            metadata=metadata
        )

        # Extract tasks
        extracted_tasks = result.get("extracted_tasks", [])
        added_tasks = []
        for task_title in extracted_tasks:
            t_id = memory.add_task(title=task_title, category=result.get("category", "general"))
            added_tasks.append({"id": t_id, "title": task_title})

        # Add proactive insight if present
        if result.get("proactive_insight"):
            memory.add_recommendation(
                rec_type="strategic",
                title="💡 Anlık Canlı AI Tavsiyesi",
                advice=result["proactive_insight"],
                reasoning=f"Girdi analizi sonucu üretildi: {user_input[:40]}",
                priority="high"
            )

        # Trigger background recommendation refresh
        try:
            proactive_advisor.generate_proactive_advice()
        except Exception:
            pass

        return {
            "log_id": log_id,
            "reply": result.get("reply", "Anlaşıldı, canlı hafızaya işlendi."),
            "category": result.get("category", "personal"),
            "summary": result.get("summary", ""),
            "extracted_tasks": added_tasks,
            "proactive_insight": result.get("proactive_insight", ""),
            "tags": result.get("tags", [])
        }

    def _call_ai(self, prompt: str, user_input: str, source: str = "web") -> dict:
        api_key = os.getenv("GEMINI_API_KEY", self.api_key)
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    res_data = json.loads(res_body)
                    text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(text_content)
            except Exception as e:
                print(f"[AgentRouter] Gemini API Error: {e}")

        category = "task" if "yap" in user_input.lower() or "hazırla" in user_input.lower() else "personal"
        return {
            "reply": f"Anlaşıldı! Girdini canlı hafızaya kaydettim: '{user_input[:60]}...'",
            "category": category,
            "summary": user_input[:100],
            "extracted_tasks": [user_input] if category == "task" else [],
            "proactive_insight": f"Girdiğiniz '{user_input[:40]}' konusunu takip listeme aldım.",
            "tags": ["canlı-takip", source]
        }

agent_router = AgentRouter()
