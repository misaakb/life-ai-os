import sqlite3
import json
from datetime import datetime
from pathlib import Path
from config import DB_PATH

class MemoryEngine:
    def __init__(self, db_path=DB_PATH):
        self.db_path = str(db_path)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
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

            # User Persona & Deep Profile Memory (Seni Tanıma Katmanı)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_profile (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    category TEXT DEFAULT 'general', -- 'goals', 'habits', 'relationships', 'preferences'
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

    def get_recent_logs(self, limit: int = 50):
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
                logs.append({
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "source": row["source"],
                    "category": row["category"],
                    "content": row["content"],
                    "summary": row["summary"],
                    "tags": json.loads(row["tags"] or "[]"),
                    "metadata": json.loads(row["metadata"] or "{}")
                })
            return logs

    def search_logs(self, query: str, limit: int = 20):
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

    def add_task(self, title: str, priority: str = "medium", category: str = "general", due_date: str = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tasks (title, priority, category, due_date)
                VALUES (?, ?, ?, ?)
            ''', (title, priority, category, due_date))
            conn.commit()
            return cursor.lastrowid

    def get_tasks(self, status: str = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC', (status,))
            else:
                cursor.execute('SELECT * FROM tasks ORDER BY created_at DESC')
            return [dict(row) for row in cursor.fetchall()]

    def update_task_status(self, task_id: int, status: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE tasks SET status = ? WHERE id = ?', (status, task_id))
            conn.commit()

    def get_projects(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM projects ORDER BY last_updated DESC')
            return [dict(row) for row in cursor.fetchall()]

    def add_project(self, name: str, description: str, progress: int = 0):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO projects (name, description, progress)
                VALUES (?, ?, ?)
            ''', (name, description, progress))
            conn.commit()
            return cursor.lastrowid

    # --- Profile & Persona Management ---
    def set_profile_item(self, key: str, value: str, category: str = "general"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_profile (key, value, category, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, category=excluded.category, updated_at=CURRENT_TIMESTAMP
            ''', (key, value, category))
            conn.commit()

    def get_profile(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT key, value, category, updated_at FROM user_profile')
            return {row["key"]: {"value": row["value"], "category": row["category"]} for row in cursor.fetchall()}

    # --- Proactive Recommendations ---
    def add_recommendation(self, rec_type: str, title: str, advice: str, reasoning: str = "", priority: str = "medium"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO proactive_recommendations (type, title, advice, reasoning, priority)
                VALUES (?, ?, ?, ?, ?)
            ''', (rec_type, title, advice, reasoning, priority))
            conn.commit()
            return cursor.lastrowid

    def get_recommendations(self, status: str = "active"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, timestamp, type, title, advice, reasoning, status, priority 
                FROM proactive_recommendations 
                WHERE status = ? 
                ORDER BY timestamp DESC
            ''', (status,))
            return [dict(row) for row in cursor.fetchall()]

    def update_recommendation_status(self, rec_id: int, status: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE proactive_recommendations SET status = ? WHERE id = ?', (status, rec_id))
            conn.commit()

memory = MemoryEngine()
