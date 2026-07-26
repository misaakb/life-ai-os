import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from config import DB_PATH, DATA_DIR

class MemoryEngine:
    def __init__(self, db_path=DB_PATH):
        self.db_path = str(db_path)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
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

            # Tasks table
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

            # Projects table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
                    progress INTEGER DEFAULT 0,  -- 0 to 100
                    category TEXT DEFAULT 'Projects',
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # User Persona & Profile Memory
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_profile (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    category TEXT DEFAULT 'general',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Explicit Memory Items ("What AI Knows About You")
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS memory_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT, -- 'knowledge', 'projects', 'schedule', 'finance', 'health', 'goals', 'learning'
                    fact TEXT NOT NULL,
                    confidence INTEGER DEFAULT 95,
                    learned_from TEXT DEFAULT 'AI Interaction',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # AI Agent Executions Log (Execution steps: ✓ Calendar Analyzed, ✓ Plan Generated)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS agent_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    agent_name TEXT, -- 'Research Agent', 'Planning Agent', 'Health Agent', 'Finance Agent', 'Learning Agent'
                    user_prompt TEXT,
                    steps TEXT,      -- JSON array of steps: ['✓ Calendar Analyzed', '✓ Priorities Ranked']
                    result_output TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Proactive Recommendations
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

            # Seed initial memory items if empty
            cursor.execute("SELECT COUNT(*) as cnt FROM memory_items")
            row = cursor.fetchone()
            if row and row["cnt"] == 0:
                self._seed_initial_memory_items(cursor)
                conn.commit()

    def _seed_initial_memory_items(self, cursor):
        initial_facts = [
            ("goals", "Misa, tüm dijital hayatını %100 AI ile canlı entegre etmek istiyor.", 99, "Profil"),
            ("preferences", "Sıfır laf kalabalığı, direkt net tavsiyeler ve proaktif yönlendirme tercih ediyor.", 95, "Profil"),
            ("tech_stack", "Python, Node.js, React, Docker, Antigravity IDE ile yazılım geliştiriyor.", 95, "Geliştirme Ortamı"),
            ("health", "Uzun saatler aralıksız çalışma eğiliminde. Mola ve odaklanma dengesi takibi yapılıyor.", 90, "Sağlık Analizi"),
            ("learning", "Geleceğin otonom AI sistemleri ve çoklu model mimarileri üzerine araştırmalar yapıyor.", 92, "Öğrenme")
        ]
        for cat, fact, conf, learned in initial_facts:
            cursor.execute('''
                INSERT INTO memory_items (category, fact, confidence, learned_from)
                VALUES (?, ?, ?, ?)
            ''', (cat, fact, conf, learned))

    def get_memory_items(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM memory_items ORDER BY created_at DESC')
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[MemoryEngine Error - get_memory_items]: {e}")
            return []

    def add_memory_item(self, category: str, fact: str, confidence: int = 95, learned_from: str = "AI Interaction"):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO memory_items (category, fact, confidence, learned_from)
                    VALUES (?, ?, ?, ?)
                ''', (category, fact, confidence, learned_from))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_memory_item]: {e}")
            return 0

    def delete_memory_item(self, item_id: int):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM memory_items WHERE id = ?', (item_id,))
                conn.commit()
                return True
        except Exception as e:
            print(f"[MemoryEngine Error - delete_memory_item]: {e}")
            return False

    def add_agent_execution(self, agent_name: str, user_prompt: str, steps: list, result_output: str):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO agent_executions (agent_name, user_prompt, steps, result_output)
                    VALUES (?, ?, ?, ?)
                ''', (agent_name, user_prompt, json.dumps(steps or []), result_output))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_agent_execution]: {e}")
            return 0

    def get_agent_executions(self, limit: int = 20):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM agent_executions ORDER BY created_at DESC LIMIT ?', (limit,))
                rows = cursor.fetchall()
                results = []
                for row in rows:
                    steps = []
                    try:
                        steps = json.loads(row["steps"] or "[]")
                    except Exception:
                        pass
                    results.append({
                        "id": row["id"],
                        "agent_name": row["agent_name"],
                        "user_prompt": row["user_prompt"],
                        "steps": steps,
                        "result_output": row["result_output"],
                        "created_at": row["created_at"]
                    })
                return results
        except Exception as e:
            print(f"[MemoryEngine Error - get_agent_executions]: {e}")
            return []

    # Timeline Logs
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

    # Tasks
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

    # Projects
    def get_projects(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM projects ORDER BY last_updated DESC')
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[MemoryEngine Error - get_projects]: {e}")
            return []

    def add_project(self, name: str, description: str, progress: int = 0, category: str = "Projects"):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO projects (name, description, progress, category)
                    VALUES (?, ?, ?, ?)
                ''', (name, description, progress, category))
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            print(f"[MemoryEngine Error - add_project]: {e}")
            return 0

    # User Profile
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

    # Proactive Recommendations
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

memory = MemoryEngine()
