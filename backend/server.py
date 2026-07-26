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
from connectors.telegram_bot import run_bot_polling

app = FastAPI(title="Life AI OS Production Engine", version="3.0.0")

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
    agent_name: str # 'Research Agent', 'Planning Agent', 'Health Agent', 'Finance Agent', 'Learning Agent'
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
        return {
            "status": "online", 
            "system": "Life AI OS Production Engine v3.0", 
            "version": "3.0.0",
            "telegram_bot": "active" if os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN) else "missing_token"
        }

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- AI Overview Briefing Endpoint ---
@app.get("/api/overview")
def get_overview():
    tasks = memory.get_tasks(status="pending")
    recs = memory.get_recommendations(status="active")
    projects = memory.get_projects()
    
    # Priority breakdown
    top_priorities = [t["title"] for t in tasks[:3]]
    if not top_priorities:
        top_priorities = ["AI Hayat Entegrasyonunu Tamamla", "Günlük Hedeflerini Belirle"]

    return {
        "user_name": "Misa",
        "greeting": "İyi Günler, Misa",
        "summary_title": "Bugün senin için önemli olanlar:",
        "top_priorities": top_priorities,
        "active_recommendations_count": len(recs),
        "pending_tasks_count": len(tasks),
        "active_projects_count": len(projects)
    }

# --- Memory Inspector Endpoints ---
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

# --- AI Agents Endpoints ---
@app.get("/api/agents")
def get_agents():
    executions = memory.get_agent_executions(limit=10)
    agents_list = [
        {"name": "Research Agent", "role": "Derin Araştırma & Özetleme", "status": "Ready", "color": "cyan"},
        {"name": "Planning Agent", "role": "Günlük & Haftalık Planlama", "status": "Ready", "color": "violet"},
        {"name": "Health Agent", "role": "Enerji & Çalışma Ritmi Analizi", "status": "Ready", "color": "emerald"},
        {"name": "Finance Agent", "role": "Bütçe & Harcama Takibi", "status": "Ready", "color": "amber"},
        {"name": "Learning Agent", "role": "Eğitim & Yetenek Planlaması", "status": "Ready", "color": "rose"}
    ]
    return {"agents": agents_list, "recent_executions": executions}

@app.post("/api/agents/run")
def run_agent(req: AgentRunRequest):
    prompt_with_agent = f"[{req.agent_name} Moda]: {req.prompt}"
    result = agent_router.process_input(user_input=prompt_with_agent, source=req.agent_name.lower().replace(" ", "_"))
    return result

# --- Core Data Endpoints ---
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
        "ai_engine_status": "Life AI OS v3.0 Digital Second Brain",
        "last_sync": logs[0]["timestamp"] if logs else "Henüz kayıt yok"
    }

if __name__ == "__main__":
    import uvicorn
    target_port = int(os.getenv("PORT", PORT))
    target_host = os.getenv("HOST", "0.0.0.0")
    print(f"[Server Launch] Running on http://{target_host}:{target_port}")
    uvicorn.run("server:app", host=target_host, port=target_port, reload=False)
