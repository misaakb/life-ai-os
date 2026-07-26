import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Calendar, MessageSquare, CheckSquare, 
  FolderGit2, Zap, Send, PhoneCall, Mic, Search, Bot, Clock, AlertCircle, Plus,
  ShieldAlert, Lightbulb, UserCheck, RefreshCw, Sparkles, User, Target, ThumbsUp, X
} from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [stats, setStats] = useState({});
  
  const [inputContent, setInputContent] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingRecs, setRefreshingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState('stream');

  // New Profile Form
  const [profileKey, setProfileKey] = useState('');
  const [profileVal, setProfileVal] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, tasksRes, projectsRes, statsRes, recsRes, profRes] = await Promise.all([
        fetch('/api/logs'),
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/stats'),
        fetch('/api/recommendations'),
        fetch('/api/user-profile')
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (profRes.ok) setUserProfile(await profRes.json());
    } catch (err) {
      console.error("API Fetch Error:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputContent, source: 'web_dashboard' })
      });
      if (res.ok) {
        setInputContent('');
        await fetchData();
      }
    } catch (err) {
      console.error("Send Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);
    try {
      const res = await fetch('/api/recommendations/refresh', { method: 'POST' });
      if (res.ok) {
        setRecommendations(await res.json());
        fetchData();
      }
    } catch (err) {
      console.error("Rec Refresh Error:", err);
    } finally {
      setRefreshingRecs(false);
    }
  };

  const handleDismissRec = async (id) => {
    try {
      await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      });
      fetchData();
    } catch (err) {
      console.error("Dismiss Error:", err);
    }
  };

  const handleAddProfileTrait = async (e) => {
    e.preventDefault();
    if (!profileKey.trim() || !profileVal.trim()) return;
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: profileKey, value: profileVal, category: 'preferences' })
      });
      setProfileKey('');
      setProfileVal('');
      fetchData();
    } catch (err) {
      console.error("Profile Add Error:", err);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error("Task Update Error:", err);
    }
  };

  const filteredLogs = logs.filter(log => 
    !filterQuery || 
    log.content.toLowerCase().includes(filterQuery.toLowerCase()) ||
    log.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-title">Life AI Co-Pilot</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Proaktif Hayat Koçu v2.0</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'stream' ? 'active' : ''}`} onClick={() => setActiveTab('stream')}>
            <Activity size={18} /> Canlı Akış & Tavsiyeler
          </li>
          <li className={`nav-item ${activeTab === 'persona' ? 'active' : ''}`} onClick={() => setActiveTab('persona')}>
            <UserCheck size={18} /> Seni Tanıma Katmanı ({Object.keys(userProfile).length})
          </li>
          <li className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <CheckSquare size={18} /> Yapılacaklar ({stats.pending_tasks || 0})
          </li>
          <li className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            <FolderGit2 size={18} /> Aktif Projeler ({stats.active_projects || 0})
          </li>
        </ul>

        <div className="status-pill" style={{ marginTop: 'auto' }}>
          <div className="pulse-dot"></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Proaktif Takip Açık</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>7/24 Danışman Motoru</div>
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={28} color="var(--accent-violet)" /> Canlı Hayat Yapay Zeka Ortağı
            </h1>
            <p>Sizi tanıyan, alışkanlıklarınızı ve hedeflerinizi izleyip proaktif tavsiyeler veren AI Koçunuz.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={handleRefreshRecommendations}
              className="send-btn"
              style={{ background: 'rgba(139, 92, 246, 0.2)', border: '1px solid var(--accent-violet)', color: '#fff' }}
              disabled={refreshingRecs}
            >
              <RefreshCw size={16} className={refreshingRecs ? "spin" : ""} />
              {refreshingRecs ? 'Analiz Ediliyor...' : 'Yapay Zekayı Tetikle'}
            </button>
          </div>
        </header>

        {/* PROACTIVE AI ADVISOR BANNER (PROAKTİF TAVSİYE MERKEZİ) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} /> AI Canlı Hayat Koçu Tavsiye & Risk Bildirimleri
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{recommendations.length} Aktif Tavsiye</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="glass-panel"
                style={{ 
                  padding: '18px', 
                  borderLeft: rec.priority === 'high' ? '4px solid var(--accent-rose)' : '4px solid var(--accent-amber)',
                  background: 'rgba(18, 26, 43, 0.85)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {rec.type === 'risk_alert' ? <ShieldAlert size={18} color="var(--accent-rose)" /> : <Lightbulb size={18} color="var(--accent-amber)" />}
                    {rec.title}
                  </div>
                  <button 
                    onClick={() => handleDismissRec(rec.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)', marginBottom: '10px' }}>
                  {rec.advice}
                </div>

                {rec.reasoning && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                    🔍 <strong>AI Mantığı:</strong> {rec.reasoning}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tab 1: Live Stream & Input */}
        {activeTab === 'stream' && (
          <div className="dashboard-grid">
            <div className="left-stream-panel">
              {/* Input Box */}
              <div className="glass-panel live-input-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} /> AI Ortağınızla Paylaşın (Karar, Ses Kaydı, Olay veya Proje Fikri)
                  </span>
                </div>
                <form onSubmit={handleSendMessage} className="input-wrapper">
                  <input 
                    type="text" 
                    className="ai-input" 
                    placeholder="Örn: 'Bugün yazılım lansmanı öncesi testlerde 2 hata bulduk. Ahmet'e iletmem gerekiyor.'"
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    disabled={loading}
                  />
                  <button type="submit" className="send-btn" disabled={loading}>
                    {loading ? 'Analiz Yapılıyor...' : <><Send size={16} /> Paylaş</>}
                  </button>
                </form>
              </div>

              {/* Timeline Stream */}
              <div className="glass-panel timeline-card">
                <div className="card-header">
                  <div className="card-title">
                    <Activity size={20} color="var(--accent-cyan)" /> Canlı Hayat Zaman Çizgisi
                  </div>
                </div>

                <div className="log-list">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className={`log-item category-${log.category}`}>
                      <div className="log-top">
                        <span className="log-source-tag">{log.source} • {log.category}</span>
                        <span><Clock size={12} inline="true" /> {log.timestamp}</span>
                      </div>
                      <div className="log-content">{log.content}</div>
                      {log.summary && (
                        <div className="log-summary">
                          ⚡ <strong>AI Analizi:</strong> {log.summary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side Tasks & Profile Snapshot */}
            <div className="right-panel">
              <div className="glass-panel timeline-card">
                <div className="card-header">
                  <div className="card-title">
                    <UserCheck size={20} color="var(--accent-violet)" /> Seni Tanıma Katmanı
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(userProfile).map(([key, val]) => (
                    <div key={key} style={{ background: 'rgba(10,15,26,0.5)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>{key}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '2px' }}>{val.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel timeline-card">
                <div className="card-header">
                  <div className="card-title">
                    <CheckSquare size={20} color="var(--accent-emerald)" /> Aksiyon Odaklı Görevler
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tasks.map(task => (
                    <div key={task.id} className="task-item">
                      <input 
                        type="checkbox" 
                        className="task-checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTask(task.id, task.status)}
                      />
                      <span style={{ flex: 1, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Persona Management */}
        {activeTab === 'persona' && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2>🧠 Yapay Zekanın Seni Tanıma Deposu (Persona & Preferences)</h2>
            <p style={{ color: 'var(--text-muted)' }}>Yapay zeka asistanınızın sizi daha iyi tanıması, riskleri öngörmesi ve kişiselleştirilmiş tavsiye vermesi için alışkanlıklarınızı ve hedeflerinizi ekleyin.</p>

            <form onSubmit={handleAddProfileTrait} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Özellik Başlığı (Örn: En Verimli Saatlerim)" 
                className="ai-input" 
                value={profileKey}
                onChange={e => setProfileKey(e.target.value)}
                style={{ width: '250px' }}
              />
              <input 
                type="text" 
                placeholder="Detay (Örn: Sabah 09:00 - 13:00 arası yüksek odaklanma)" 
                className="ai-input" 
                value={profileVal}
                onChange={e => setProfileVal(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="send-btn">
                <Plus size={16} /> Profile Ekle
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {Object.entries(userProfile).map(([key, val]) => (
                <div key={key} className="glass-panel" style={{ padding: '16px', background: 'rgba(10,15,26,0.6)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase' }}>{val.category}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '4px 0' }}>{key}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{val.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
