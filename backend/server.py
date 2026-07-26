import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

sys.path.append(str(Path(__file__).resolve().parent))

from memory_engine import memory
from agent_router import agent_router
from proactive_advisor import proactive_advisor
from connectors.audio_transcriber import audio_transcriber

app = FastAPI(title="Life AI OS Stable Backend", version="2.0.0")

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

@app.get("/")
def read_root():
    return {"status": "online", "system": "Life AI OS Stable Engine", "version": "2.0.0"}

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
    
    pending_tasks = [t for t in tasks if t["status"] == "pending"]
    completed_tasks = [t for t in tasks if t["status"] == "completed"]
    
    return {
        "total_logs": len(logs),
        "total_tasks": len(tasks),
        "pending_tasks": len(pending_tasks),
        "completed_tasks": len(completed_tasks),
        "active_projects": len(projects),
        "active_recommendations": len(recs),
        "ai_engine_status": "Proactive Life Coach (Gemini Live API)",
        "last_sync": logs[0]["timestamp"] if logs else "Henüz kayıt yok"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8008, reload=False)
