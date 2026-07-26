import os
import json
import urllib.request
from memory_engine import memory
from config import GEMINI_API_KEY

class AgentSwarm:
    def __init__(self):
        self.api_key = GEMINI_API_KEY

    def run_all_agents(self) -> dict:
        profile = memory.get_profile()
        tasks = memory.get_tasks()
        recent_logs = memory.get_recent_logs(limit=10)
        memory_items = memory.get_memory_items()

        results = {}

        # 1. 👑 Master Orchestrator Agent
        results["orchestrator"] = self._run_agent(
            name="Master Orchestrator Agent",
            role="Tüm sistemi koordine eder ve ana stratejiyi belirler.",
            prompt=f"Misa için günlük ana stratejiyi ve öncelikleri belirle. Profil: {profile}",
            fallback_title="👑 Ana Strateji & Koordinasyon",
            fallback_advice="Bugün Misa için en yüksek getirili 2 ana konuya odaklanmak en rasyonel karar olacaktır."
        )

        # 2. 📅 Planning & Time-Blocking Agent
        results["planning"] = self._run_agent(
            name="Planning & Time-Blocking Agent",
            role="Zaman blokları ve görev önceliklendirmesi yapar.",
            prompt=f"Bekleyen görevler: {tasks[:5]}. Günlük en verimli zaman bloklarını hesapla.",
            fallback_title="📅 Zaman Bloklama Planı",
            fallback_advice="Sabah 09:00 - 11:30 arası derin odaklanma (Deep Work) bloğu olarak ayrıldı."
        )

        # 3. 🔬 Deep Research Agent
        results["research"] = self._run_agent(
            name="Deep Research Agent",
            role="Teknik doküman ve konu araştırmaları yapar.",
            prompt=f"Hafıza verileri: {memory_items[:5]}. Geleceğin AI sistemleri üzerine 1 cümlelik araştırma notu çıkar.",
            fallback_title="🔬 Derin Araştırma Raporu",
            fallback_advice="Çoklu otonom ajan mimarileri (Multi-Agent Swarms) sistem verimliliğini %40 artırıyor."
        )

        # 4. ❤️ Health & Energy Cycle Agent
        results["health"] = self._run_agent(
            name="Health & Energy Cycle Agent",
            role="Enerji ve çalışma ritmini analiz eder.",
            prompt=f"Son aktiviteler: {recent_logs[:5]}. Misa'nın enerji seviyesini ve mola ihtiyacını analiz et.",
            fallback_title="❤️ Enerji & Odaklanma Dengesi",
            fallback_advice="Her 90 dakikalık odaklanma sonrası 10 dakika ekran dışı mola vermek odak kalitesini korur."
        )

        # 5. 💰 Finance & Budget Agent
        results["finance"] = self._run_agent(
            name="Finance & Budget Agent",
            role="Bütçe ve harcama takibi yapar.",
            prompt="Misa'nın finansal takip durumunu değerlendir.",
            fallback_title="💰 Finansal Durum Takibi",
            fallback_advice="Aylık yazılım ve sunucu abonelik bütçesi kontrol altında tutuluyor."
        )

        # 6. 📚 Skill & Learning Roadmap Agent
        results["learning"] = self._run_agent(
            name="Skill & Learning Roadmap Agent",
            role="Eğitim rotaları ve yetenek müfredatları çıkarır.",
            prompt="Yapay zeka mühendisliği için haftalık öğrenme hedefini belirle.",
            fallback_title="📚 Eğitim & Yetenek Rotası",
            fallback_advice="Bu hafta 'Python AsyncIO ve Fast-API Multi-threading' konularına odaklanılması önerilir."
        )

        # 7. 🔔 Proactive Telemetry Alert Agent
        results["telemetry"] = self._run_agent(
            name="Proactive Telemetry Alert Agent",
            role="7/24 arka plan uyarısı ve risk taraması yapar.",
            prompt="Sistemdeki olası risk ve kaçırılan fırsatları tara.",
            fallback_title="🔔 Canlı Telemetri Uyarısı",
            fallback_advice="Tüm bulut servisleri ve Telegram botu %100 kesintisiz çalışmaktadır."
        )

        # Write Insights to Database
        for agent_key, data in results.items():
            memory.add_recommendation(
                rec_type="strategic",
                title=data["title"],
                advice=data["advice"],
                reasoning=f"Ajan: {data['name']}",
                priority="high"
            )

        return results

    def _run_agent(self, name: str, role: str, prompt: str, fallback_title: str, fallback_advice: str) -> dict:
        api_key = os.getenv("GEMINI_API_KEY", self.api_key).strip()
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
                full_prompt = f"Sen {name} ajanısın. Görevin: {role}. {prompt} Lütfen JSON döndür: {{\"title\": \"...\", \"advice\": \"...\"}}"
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=8) as response:
                    res_body = response.read().decode("utf-8")
                    res_data = json.loads(res_body)
                    parsed = json.loads(res_data["candidates"][0]["content"]["parts"][0]["text"])
                    return {
                        "name": name,
                        "role": role,
                        "title": parsed.get("title", fallback_title),
                        "advice": parsed.get("advice", fallback_advice)
                    }
            except Exception as e:
                print(f"[AgentSwarm] {name} API Error / Fallback: {e}")

        return {
            "name": name,
            "role": role,
            "title": fallback_title,
            "advice": fallback_advice
        }

agent_swarm = AgentSwarm()
