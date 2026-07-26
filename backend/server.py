import os
import sys
import threading
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import PORT, HOST, TELEGRAM_BOT_TOKEN, BASE_DIR
from memory_engine import memory
from agent_router import agent_router
from proactive_advisor import proactive_advisor
from agents_swarm import agent_swarm
from connectors.telegram_bot import run_bot_polling

app = FastAPI(title="Life AI OS Swarm Engine", version="3.8.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputMessage(BaseModel):
    content: str
    source: Optional[str] = "web_dashboard"

class TaskItem(BaseModel):
    title: str
    priority: Optional[str] = "medium"
    category: Optional[str] = "general"
    due_date: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: str

class ProfileUpdate(BaseModel):
    key: str
    value: str
    category: Optional[str] = "general"

class RecStatusUpdate(BaseModel):
    status: str

class MemoryItemCreate(BaseModel):
    category: str
    fact: str
    confidence: Optional[int] = 95
    learned_from: Optional[str] = "User Input"

class AgentRunRequest(BaseModel):
    agent_name: str
    prompt: str

@app.on_event("startup")
def startup_event():
    token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    if token:
        print(f"[Server Startup] Telegram Bot token detected. Starting background polling...")
        t = threading.Thread(target=run_bot_polling, daemon=True)
        t.start()

# --- Serve Production React Web Dashboard ---
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_dashboard():
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    def read_root():
        return {"status": "online", "system": "Life AI OS Swarm Engine v3.8"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- 7-Agent Swarm Endpoints ---
@app.post("/api/agents/swarm/run")
def run_agent_swarm():
    results = agent_swarm.run_all_agents()
    return {"status": "success", "swarm_results": results}

@app.get("/api/agents/swarm/status")
def get_swarm_status():
    return {
        "active_agents": 7,
        "agents": [
            {"id": "orchestrator", "name": "👑 Master Orchestrator Agent", "status": "Active"},
            {"id": "planning", "name": "📅 Planning & Time-Blocking Agent", "status": "Active"},
            {"id": "research", "name": "🔬 Deep Research Agent", "status": "Active"},
            {"id": "health", "name": "❤️ Health & Energy Cycle Agent", "status": "Active"},
            {"id": "finance", "name": "💰 Finance & Budget Agent", "status": "Active"},
            {"id": "learning", "name": "📚 Skill & Learning Agent", "status": "Active"},
            {"id": "telemetry", "name": "🔔 Proactive Telemetry Alert Agent", "status": "Active"}
        ]
    }

# --- Core API Endpoints ---
@app.get("/api/overview")
def get_overview():
    tasks = memory.get_tasks(status="pending")
    recs = memory.get_recommendations(status="active")
    projects = memory.get_projects()
    
    top_priorities = [t["title"] for t in tasks[:3]]
    if not top_priorities:
        top_priorities = ["AI Hayat Entegrasyonu", "Günlük Odaklanma Bloğu", "Proaktif Ajan Analizi"]

    return {
        "user_name": "Misa",
        "greeting": "Good morning, Misa",
        "summary_title": "Bugün seni analiz ettim. 3 önemli konu var:",
        "top_priorities": top_priorities,
        "active_recommendations_count": len(recs),
        "pending_tasks_count": len(tasks),
        "active_projects_count": len(projects)
    }

@app.get("/api/memory-items")
def get_memory_items():
    return memory.get_memory_items()

@app.post("/api/memory-items")
def create_memory_item(item: MemoryItemCreate):
    m_id = memory.add_memory_item(
        category=item.category,
        fact=item.fact,
        confidence=item.confidence,
        learned_from=item.learned_from
    )
    return {"id": m_id, "status": "created"}

@app.delete("/api/memory-items/{item_id}")
def delete_memory_item(item_id: int):
    success = memory.delete_memory_item(item_id)
    return {"id": item_id, "deleted": success}

@app.get("/api/agents")
def get_agents():
    executions = memory.get_agent_executions(limit=10)
    agents_list = [
        {"name": "Master Orchestrator Agent", "role": "Tüm sistemi koordine eder.", "status": "Active"},
        {"name": "Planning Agent", "role": "Günlük & Haftalık Planlama.", "status": "Active"},
        {"name": "Research Agent", "role": "Derin Araştırma & Özetleme.", "status": "Active"},
        {"name": "Health Agent", "role": "Enerji & Çalışma Ritmi Analizi.", "status": "Active"},
        {"name": "Finance Agent", "role": "Bütçe & Harcama Takibi.", "status": "Active"},
        {"name": "Learning Agent", "role": "Eğitim & Yetenek Planlaması.", "status": "Active"},
        {"name": "Telemetry Agent", "role": "7/24 Canlı İzleme & Uyarılama.", "status": "Active"}
    ]
    return {"agents": agents_list, "recent_executions": executions}

@app.post("/api/agents/run")
def run_agent(req: AgentRunRequest):
    result = agent_router.process_input(user_input=f"[{req.agent_name}]: {req.prompt}", source=req.agent_name.lower().replace(" ", "_"))
    return result

@app.get("/api/logs")
def get_logs(limit: int = 50, query: Optional[str] = None):
    if query:
        return memory.search_logs(query=query, limit=limit)
    return memory.get_recent_logs(limit=limit)

@app.post("/api/logs")
def ingest_log(msg: InputMessage):
    result = agent_router.process_input(user_input=msg.content, source=msg.source)
    return result

@app.get("/api/tasks")
def get_tasks(status: Optional[str] = None):
    return memory.get_tasks(status=status)

@app.post("/api/tasks")
def add_task(task: TaskItem):
    t_id = memory.add_task(
        title=task.title,
        priority=task.priority,
        category=task.category,
        due_date=task.due_date
    )
    return {"id": t_id, "status": "created"}

@app.patch("/api/tasks/{task_id}")
def update_task_status(task_id: int, payload: TaskStatusUpdate):
    memory.update_task_status(task_id, payload.status)
    return {"id": task_id, "status": payload.status}

@app.get("/api/projects")
def get_projects():
    return memory.get_projects()

@app.get("/api/recommendations")
def get_recommendations(status: str = "active"):
    recs = memory.get_recommendations(status=status)
    if not recs:
        return proactive_advisor.generate_proactive_advice()
    return recs

@app.post("/api/recommendations/refresh")
def refresh_recommendations():
    return proactive_advisor.generate_proactive_advice()

@app.patch("/api/recommendations/{rec_id}")
def update_recommendation_status(rec_id: int, payload: RecStatusUpdate):
    memory.update_recommendation_status(rec_id, payload.status)
    return {"id": rec_id, "status": payload.status}

@app.get("/api/user-profile")
def get_user_profile():
    return memory.get_profile()

@app.post("/api/user-profile")
def update_user_profile(item: ProfileUpdate):
    memory.set_profile_item(key=item.key, value=item.value, category=item.category)
    proactive_advisor.generate_proactive_advice()
    return {"status": "updated", "key": item.key}

@app.get("/api/stats")
def get_stats():
    logs = memory.get_recent_logs(limit=100)
    tasks = memory.get_tasks()
    projects = memory.get_projects()
    recs = memory.get_recommendations(status="active")
    memories = memory.get_memory_items()
    
    pending_tasks = [t for t in tasks if t["status"] == "pending"]
    completed_tasks = [t for t in tasks if t["status"] == "completed"]
    
    return {
        "total_logs": len(logs),
        "total_tasks": len(tasks),
        "pending_tasks": len(pending_tasks),
        "completed_tasks": len(completed_tasks),
        "active_projects": len(projects),
        "active_recommendations": len(recs),
        "memory_facts_count": len(memories),
        "ai_engine_status": "Life AI OS 7-Agent Swarm Engine v3.8",
        "last_sync": logs[0]["timestamp"] if logs else "Henüz kayıt yok"
    }

if __name__ == "__main__":
    import uvicorn
    target_port = int(os.getenv("PORT", PORT))
    target_host = os.getenv("HOST", "0.0.0.0")
    print(f"[Server Launch] Running on http://{target_host}:{target_port}")
    uvicorn.run("server:app", host=target_host, port=target_port, reload=False)
