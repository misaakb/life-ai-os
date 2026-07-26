import React, { useState, useEffect } from 'react';
import { 
  Cpu, Activity, Calendar, MessageSquare, CheckSquare, 
  FolderGit2, Zap, Send, PhoneCall, Mic, Search, Bot, Clock, AlertCircle, Plus,
  ShieldAlert, Lightbulb, UserCheck, RefreshCw, Sparkles, User, Target, ThumbsUp, X,
  Terminal, BellRing, BrainCircuit, ListTodo, Layers, Radio
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
  const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'terminal', 'notifications', 'tasks', 'persona'

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
      {/* Cyberpunk Navigation Sidebar */}
      <aside className="cyber-sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BrainCircuit size={28} color="#fff" />
          </div>
          <div>
            <div className="brand-title">Life AI OS</div>
            <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>CYBERPUNK v2.6</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            <Lightbulb size={18} color="var(--neon-amber)" /> İpuçları & Öneriler ({recommendations.length})
          </li>
          <li className={`nav-item ${activeTab === 'terminal' ? 'active' : ''}`} onClick={() => setActiveTab('terminal')}>
            <Terminal size={18} color="var(--neon-cyan)" /> İstek & Yanıt Terminali
          </li>
          <li className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <BellRing size={18} color="var(--neon-rose)" /> Bildirimler & Sistem Logları ({logs.length})
          </li>
          <li className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <ListTodo size={18} color="var(--neon-emerald)" /> Yapılacaklar & Görevler ({stats.pending_tasks || 0})
          </li>
          <li className={`nav-item ${activeTab === 'persona' ? 'active' : ''}`} onClick={() => setActiveTab('persona')}>
            <UserCheck size={18} color="var(--neon-magenta)" /> Seni Tanıma Deposu ({Object.keys(userProfile).length})
          </li>
        </ul>

        {/* Telemetry Status Badge */}
        <div className="status-hud">
          <div className="pulse-emerald"></div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>7/24 AI Telemetri</div>
            <div style={{ fontSize: '11px', color: 'var(--neon-emerald)', fontFamily: 'var(--font-mono)' }}>Gemini 2.0 Live API</div>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="main-content">
        {/* Cyber Top Header */}
        <header className="top-header">
          <div className="header-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Radio size={28} color="var(--neon-cyan)" /> Cyberpunk AI Life Command Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Misa için özelleştirilmiş otonom karar destek, takip ve rehberlik sistemi.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={handleRefreshRecommendations}
              className="cyber-btn"
              disabled={refreshingRecs}
            >
              <RefreshCw size={16} className={refreshingRecs ? "spin" : ""} />
              {refreshingRecs ? 'Analiz Yapılıyor...' : 'Yapay Zekayı Tetikle'}
            </button>
          </div>
        </header>

        {/* TAB 1: AI İPUÇLARI VE PROAKTİF ÖNERİLER (AI ADVICE & INSIGHTS HUB) */}
        {activeTab === 'insights' && (
          <div className="full-grid">
            <div className="cyber-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-amber)', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
                  <Lightbulb size={24} /> 💡 Canlı AI İpuçları, Stratejik Öneriler ve Risk Bildirimleri
                </h2>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{recommendations.length} Aktif Bildirim</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="cyber-card"
                    style={{ 
                      padding: '20px', 
                      background: 'rgba(5, 8, 20, 0.95)',
                      borderLeft: rec.priority === 'high' ? '4px solid var(--neon-rose)' : '4px solid var(--neon-amber)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rec.type === 'risk_alert' ? <ShieldAlert size={20} color="var(--neon-rose)" /> : <Lightbulb size={20} color="var(--neon-amber)" />}
                        {rec.title}
                      </div>
                      <button 
                        onClick={() => handleDismissRec(rec.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '14px' }}>
                      {rec.advice}
                    </div>

                    {rec.reasoning && (
                      <div style={{ fontSize: '12px', color: 'var(--neon-cyan)', background: 'rgba(0, 243, 255, 0.08)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid var(--neon-cyan)' }}>
                        🔍 <strong>AI Mantık Tespiti:</strong> {rec.reasoning}
                      </div>
                    )}
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    Henüz aktif bir ipucu veya risk bildirimi yok. 'Yapay Zekayı Tetikle' butonuna basarak yeni bir analiz başlatabilirsiniz!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: İSTEK VE YANITLAR TERMINALI (REQUEST & RESPONSE CHAT TERMINAL) */}
        {activeTab === 'terminal' && (
          <div className="full-grid">
            {/* Input Prompt Box */}
            <div className="cyber-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                  <Terminal size={18} /> İstek & Karar Komut Terminali
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Gemini 2.0 Prompt Engine</span>
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '14px' }}>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="Yapay zeka asistanınıza bir soru sorun, yeni bir karar veya proje fikri yazın..."
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  disabled={loading}
                  style={{ flex: 1, fontSize: '15px' }}
                />
                <button type="submit" className="cyber-btn" disabled={loading}>
                  {loading ? 'İşleniyor...' : <><Send size={16} /> Gönder</>}
                </button>
              </form>
            </div>

            {/* Conversation Log & Responses Feed */}
            <div className="cyber-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                <MessageSquare size={20} /> Etkileşim ve Yanıt Geçmişi
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {logs.map((log) => (
                  <div key={log.id} className={`cyber-log-item category-${log.category}`}>
                    <div className="log-top">
                      <span className="log-source-badge">{log.source} • {log.category}</span>
                      <span><Clock size={12} inline="true" /> {log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: '4px 0' }}>
                      💬 <strong>İstek:</strong> {log.content}
                    </div>
                    {log.summary && (
                      <div className="log-summary-box">
                        ⚡ <strong>AI Yanıt & Özet:</strong> {log.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BİLDİRİMLER VE SİSTEM LOGLARI (NOTIFICATIONS & TELEMETRY LOGS) */}
        {activeTab === 'notifications' && (
          <div className="full-grid">
            <div className="cyber-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-rose)', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
                  <BellRing size={24} /> 🔔 Canlı Bildirimler & Telemetri Akışı
                </h2>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Loglarda Ara..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="cyber-input"
                    style={{ width: '240px', paddingLeft: '36px', fontSize: '13px' }}
                  />
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredLogs.map((log) => (
                  <div key={log.id} className="cyber-card" style={{ padding: '16px', background: 'rgba(5, 8, 20, 0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>[{log.source.toUpperCase()}]</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '6px' }}>
                      {log.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: YAPILACAKLAR VE GÖREVLER (TASKS HUB) */}
        {activeTab === 'tasks' && (
          <div className="full-grid">
            <div className="cyber-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-emerald)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
                <ListTodo size={24} /> 📌 Yapılacaklar & Aksiyon Görevleri ({tasks.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.map(task => (
                  <div key={task.id} className="cyber-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(5, 8, 20, 0.8)' }}>
                    <input 
                      type="checkbox" 
                      className="task-checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTask(task.id, task.status)}
                    />
                    <span style={{ 
                      flex: 1, 
                      fontSize: '15px',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'var(--text-dim)' : 'var(--text-primary)'
                    }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 10px', borderRadius: '6px', background: 'rgba(0, 255, 153, 0.15)', color: 'var(--neon-emerald)' }}>
                      Öncelik: {task.priority.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SENİ TANIMA DEPOSU (USER PERSONA VAULT) */}
        {activeTab === 'persona' && (
          <div className="full-grid">
            <div className="cyber-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
                <UserCheck size={24} /> 🧠 Seni Tanıma Deposu (Persona Vault)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Yapay zeka asistanınızın sizi daha iyi tanıması, riskleri öngörmesi ve kişiselleştirilmiş tavsiye vermesi için alışkanlıklarınızı ve hedeflerinizi ekleyin.</p>

              <form onSubmit={handleAddProfileTrait} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Özellik Başlığı (Örn: En Verimli Saatlerim)" 
                  className="cyber-input" 
                  value={profileKey}
                  onChange={e => setProfileKey(e.target.value)}
                  style={{ width: '260px' }}
                />
                <input 
                  type="text" 
                  placeholder="Detay (Örn: Sabah 09:00 - 13:00 arası yüksek odaklanma)" 
                  className="cyber-input" 
                  value={profileVal}
                  onChange={e => setProfileVal(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="cyber-btn">
                  <Plus size={16} /> Ekle
                </button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px', marginTop: '10px' }}>
                {Object.entries(userProfile).map(([key, val]) => (
                  <div key={key} className="cyber-card" style={{ padding: '18px', background: 'rgba(5, 8, 20, 0.95)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neon-magenta)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{val.category}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{key}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{val.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
