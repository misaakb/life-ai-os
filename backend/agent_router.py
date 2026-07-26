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
        memory_items = memory.get_memory_items()
        
        context_str = "\n".join([f"- [{log['timestamp']}] ({log['category']}): {log['content']}" for log in recent_logs])
        profile_str = "\n".join([f"- {k}: {v['value']}" for k, v in profile.items()]) if profile else "Bilinmiyor."
        memory_str = "\n".join([f"- [{m['category']}]: {m['fact']}" for m in memory_items[:5]])

        system_prompt = f"""
Sen Misa'nın dijital ikincil beyni (Digital Second Brain) ve otonom komut merkezi olan LIFE AI OS asistanısın.

SENİN YAKLAŞIMIN:
- Apple + OpenAI + Notion + Linear seviyesinde ultra akıllı, minimal, doğrudan ve fütüristik.
- Kullanıcıya klasik bir chatbot gibi değil, dijital yaşam kokpiti gibi rehberlik edersin.

Kullanıcı Kimliği & Hafızası:
{profile_str}

Bildiği Bilgiler (Memory Bank):
{memory_str}

Son Olaylar:
{context_str}

Kullanıcı Girdisi: "{user_input}"
Kaynak: {source}

GÖREVİN:
1. Yanıtı aksiyon kartı mantığıyla ver.
2. Gerçekleştirilen işlem adımlarını (Execution Steps) çıkar (Örn: ["✓ Takvim Analiz Edildi", "✓ Öncelikler Belirlendi", "✓ Aksiyon Planı Hazırlandı"]).
3. Çıkarılan görevleri ve proaktif tavsiyeyi hazırla.

JSON FORMATI:
{{
    "reply": "Kullanıcıya verilecek doğrudan, samimi, akıllı ve yönlendirici yanıt",
    "execution_steps": ["✓ Takvim Analiz Edildi", "✓ Öncelikler Belirlendi", "✓ Plan Oluşturuldu"],
    "category": "knowledge | projects | schedule | finance | health | goals | learning",
    "summary": "1 cümlelik öz ve analitik özet",
    "extracted_tasks": ["Yapılacak iş 1"],
    "proactive_insight": "Bu girdiye dayanarak verilecek PROAKTİF TAVSİYE / UYARI",
    "new_memory_fact": "Kullanıcı hakkında öğrenilen yeni bir bilgi varsa ekle (yoksa null)",
    "tags": ["etiket1", "etiket2"]
}}
"""

        result = self._call_ai(system_prompt, user_input, source)
        
        # Log to timeline
        log_id = memory.add_log(
            source=source,
            category=result.get("category", "personal"),
            content=user_input,
            summary=result.get("summary", ""),
            tags=result.get("tags", []),
            metadata=metadata
        )

        # Record Agent Execution Steps
        execution_steps = result.get("execution_steps", ["✓ Girdi Analiz Edildi", "✓ Hafızaya İşlendi"])
        memory.add_agent_execution(
            agent_name="Master Assistant Agent",
            user_prompt=user_input,
            steps=execution_steps,
            result_output=result.get("reply", "")
        )

        # Extract tasks
        extracted_tasks = result.get("extracted_tasks", [])
        added_tasks = []
        for task_title in extracted_tasks:
            t_id = memory.add_task(title=task_title, category=result.get("category", "general"))
            added_tasks.append({"id": t_id, "title": task_title})

        # Check if new memory fact was learned
        if result.get("new_memory_fact"):
            memory.add_memory_item(
                category=result.get("category", "knowledge"),
                fact=result["new_memory_fact"],
                confidence=95,
                learned_from="AI Interaction"
            )

        # Add proactive insight if present
        if result.get("proactive_insight"):
            memory.add_recommendation(
                rec_type="strategic",
                title="💡 Anlık Canlı AI Tavsiyesi",
                advice=result["proactive_insight"],
                reasoning=f"Girdi analizi sonucu üretildi: {user_input[:40]}",
                priority="high"
            )

        try:
            proactive_advisor.generate_proactive_advice()
        except Exception:
            pass

        return {
            "log_id": log_id,
            "reply": result.get("reply", "Harika! Girdinizi dijital kokpite işledim."),
            "execution_steps": execution_steps,
            "category": result.get("category", "personal"),
            "summary": result.get("summary", ""),
            "extracted_tasks": added_tasks,
            "proactive_insight": result.get("proactive_insight", ""),
            "tags": result.get("tags", [])
        }

    def _call_ai(self, prompt: str, user_input: str, source: str = "web") -> dict:
        api_key = os.getenv("GEMINI_API_KEY", self.api_key).strip()
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

        category = "schedule" if "yap" in user_input.lower() or "plan" in user_input.lower() else "knowledge"
        return {
            "reply": f"Harika! '{user_input}' konusunu dijital ikincil beyninize kaydettim ve aksiyon planına ekledim.",
            "execution_steps": ["✓ İçerik Taranıyor", "✓ Öncelikler Sıralandı", "✓ Dijital Kokpite İşlendi"],
            "category": category,
            "summary": user_input[:100],
            "extracted_tasks": [user_input] if "yap" in user_input.lower() else [],
            "proactive_insight": f"Girdiğiniz '{user_input[:40]}' konusunu takip listeme aldım.",
            "tags": ["canlı-takip", source]
        }

agent_router = AgentRouter()
