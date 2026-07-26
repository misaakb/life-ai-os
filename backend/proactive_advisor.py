import os
import json
import urllib.request
from memory_engine import memory
from config import GEMINI_API_KEY

class ProactiveAdvisor:
    def __init__(self):
        self.api_key = GEMINI_API_KEY

    def generate_proactive_advice(self) -> list:
        api_key = os.getenv("GEMINI_API_KEY", self.api_key)
        profile = memory.get_profile()
        recent_logs = memory.get_recent_logs(limit=10)
        pending_tasks = memory.get_tasks(status="pending")

        profile_str = "\n".join([f"- {k}: {v['value']}" for k, v in profile.items()]) if profile else "Bilinmiyor."
        logs_str = "\n".join([f"- [{l['timestamp']}] ({l['category']}): {l['content']}" for l in recent_logs])
        tasks_str = "\n".join([f"- {t['title']} (Öncelik: {t['priority']})" for t in pending_tasks])

        prompt = f"""
Sen kullanıcının kişisel hayat koçu, stratejik danışmanı ve 7/24 canlı takip eden yapay zeka ortağısın.

Kullanıcı Profili:
{profile_str}

Son Olaylar:
{logs_str}

Bekleyen Görevler:
{tasks_str}

Lütfen kullanıcı için ŞU AN EN KRİTİK 2 veya 3 PROAKTİF TAVSİYE / UYARI üret.
JSON formatında döndür:
[
    {{
        "type": "strategic | risk_alert | energy_coach | action_plan",
        "title": "Kısa ve çarpıcı tavsiye başlığı",
        "advice": "Kullanıcıya verilen doğrudan, derinlikli, aksiyon odaklı tavsiye metni",
        "reasoning": "Bu tavsiyenin arkasındaki mantık",
        "priority": "high | medium | low"
    }}
]
"""

        try:
            if api_key:
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
                    recs = json.loads(text_content)
                    
                    for r in recs:
                        memory.add_recommendation(
                            rec_type=r.get("type", "strategic"),
                            title=r.get("title", "Tavsiye"),
                            advice=r.get("advice", ""),
                            reasoning=r.get("reasoning", ""),
                            priority=r.get("priority", "medium")
                        )
                    return recs
        except Exception as e:
            print(f"[ProactiveAdvisor] Gemini API Error: {e}")

        default_recs = []
        if pending_tasks:
            default_recs.append({
                "type": "action_plan",
                "title": "📌 Günün Kritik Odak Noktası",
                "advice": f"Şu anda bekleyen {len(pending_tasks)} göreviniz var. İlk olarak '{pending_tasks[0]['title']}' görevini tamamlamanız ritminizi artıracaktır.",
                "reasoning": "Öncelikli görev tespiti.",
                "priority": "high"
            })

        for r in default_recs:
            memory.add_recommendation(
                rec_type=r.get("type", "strategic"),
                title=r.get("title", "Tavsiye"),
                advice=r.get("advice", ""),
                reasoning=r.get("reasoning", ""),
                priority=r.get("priority", "medium")
            )
        return default_recs

proactive_advisor = ProactiveAdvisor()
