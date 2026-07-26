import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from config import DB_PATH, DATA_DIR

class MemoryEngine:
    def __init__(self, db_path=DB_PATH):
        self.db_path = str(db_path)
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        # Enable PRAGMA WAL mode for better concurrency
        try:
            conn.execute("PRAGMA journal_mode=WAL;")
        except Exception:
            pass
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Timeline Logs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS timeline_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    source TEXT,       -- 'telegram', 'voice', 'calendar', 'manual', 'browser'
                    category TEXT,     -- 'personal', 'project', 'call', 'research', 'task'
                    content TEXT,
                    summary TEXT,
                    tags TEXT,         -- JSON array
                    metadata TEXT      -- JSON object
                )
            ''')

            # Active Tasks & Habits
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'in_progress'
                    priority TEXT DEFAULT 'medium',-- 'low', 'medium', 'high'
                    due_date TEXT,
                    category TEXT DEFAULT 'general',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Active Projects
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
                    progress INTEGER DEFAULT 0,  -- 0 to 100
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # User Persona & Deep Profile Memory
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_profile (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    category TEXT DEFAULT 'general',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Proactive AI Recommendations & Life Coach Advice
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS proactive_recommendations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    type TEXT,        -- 'strategic', 'risk_alert', 'energy_coach', 'action_plan'
                    title TEXT NOT NULL,
                    advice TEXT NOT NULL,
                    reasoning TEXT,
                    status TEXT DEFAULT 'active', -- 'active', 'dismissed', 'acted'
                    priority TEXT DEFAULT 'medium'
                )
            ''')

            conn.commit()

    def add_log(self, source: str, category: str, content: str, summary: str = "", tags: list = None, metadata: dict = None):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO timeline_logs (source, category, content, summary, tags, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    source,
                    category,
                    content,
                    summary,
                    json.dumps(tags or []),
                    json.dumps(metadata or {})
                ))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_log]: {e}")
            return 0

    def get_recent_logs(self, limit: int = 50):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, timestamp, source, category, content, summary, tags, metadata 
                    FROM timeline_logs 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (limit,))
                rows = cursor.fetchall()
                logs = []
                for row in rows:
                    tags = []
                    metadata = {}
                    try:
                        tags = json.loads(row["tags"] or "[]")
                    except Exception:
                        pass
                    try:
                        metadata = json.loads(row["metadata"] or "{}")
                    except Exception:
                        pass

                    logs.append({
                        "id": row["id"],
                        "timestamp": row["timestamp"],
                        "source": row["source"],
                        "category": row["category"],
                        "content": row["content"],
                        "summary": row["summary"],
                        "tags": tags,
                        "metadata": metadata
                    })
                return logs
        except Exception as e:
            print(f"[MemoryEngine Error - get_recent_logs]: {e}")
            return []

    def search_logs(self, query: str, limit: int = 20):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, timestamp, source, category, content, summary, tags 
                    FROM timeline_logs 
                    WHERE content LIKE ? OR summary LIKE ? OR tags LIKE ?
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (f"%{query}%", f"%{query}%", f"%{query}%", limit))
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"[MemoryEngine Error - search_logs]: {e}")
            return []

    def add_task(self, title: str, priority: str = "medium", category: str = "general", due_date: str = None):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO tasks (title, priority, category, due_date)
                    VALUES (?, ?, ?, ?)
                ''', (title, priority, category, due_date))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_task]: {e}")
            return 0

    def get_tasks(self, status: str = None):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                if status:
                    cursor.execute('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', (status,))
                else:
                    cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[MemoryEngine Error - get_tasks]: {e}")
            return []

    def update_task_status(self, task_id: int, status: str):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE tasks SET status = ? WHERE id = ?', (status, task_id))
                conn.commit()
        except Exception as e:
            print(f"[MemoryEngine Error - update_task_status]: {e}")

    def get_projects(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM projects ORDER BY last_updated DESC')
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[MemoryEngine Error - get_projects]: {e}")
            return []

    def add_project(self, name: str, description: str, progress: int = 0):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO projects (name, description, progress)
                    VALUES (?, ?, ?)
                ''', (name, description, progress))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_project]: {e}")
            return 0

    def set_profile_item(self, key: str, value: str, category: str = "general"):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO user_profile (key, value, category, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(key) DO UPDATE SET value=excluded.value, category=excluded.category, updated_at=CURRENT_TIMESTAMP
                ''', (key, value, category))
                conn.commit()
        except Exception as e:
            print(f"[MemoryEngine Error - set_profile_item]: {e}")

    def get_profile(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT key, value, category, updated_at FROM user_profile')
                return {row["key"]: {"value": row["value"], "category": row["category"]} for row in cursor.fetchall()}
        except Exception as e:
            print(f"[MemoryEngine Error - get_profile]: {e}")
            return {}

    def add_recommendation(self, rec_type: str, title: str, advice: str, reasoning: str = "", priority: str = "medium"):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO proactive_recommendations (type, title, advice, reasoning, priority)
                    VALUES (?, ?, ?, ?, ?)
                ''', (rec_type, title, advice, reasoning, priority))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_recommendation]: {e}")
            return 0

    def get_recommendations(self, status: str = "active"):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, timestamp, type, title, advice, reasoning, status, priority 
                    FROM proactive_recommendations 
                    WHERE status = ? 
                    ORDER BY timestamp DESC
                ''', (status,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[MemoryEngine Error - get_recommendations]: {e}")
            return []

    def update_recommendation_status(self, rec_id: int, status: str):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE proactive_recommendations SET status = ? WHERE id = ?', (status, rec_id))
                conn.commit()
        except Exception as e:
            print(f"[MemoryEngine Error - update_recommendation_status]: {e}")

# Global instance
memory = MemoryEngine()
