import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Compass, Terminal, Cpu, ShieldCheck, Zap, Send, Sparkles, 
  Layers, Search, CheckCircle2, Clock, Trash2, Plus, ArrowRight, UserCheck, 
  BookOpen, Briefcase, Calendar as CalendarIcon, DollarSign, Heart, Target, GraduationCap,
  Activity, Bell, Lock, ShieldAlert, Lightbulb, RefreshCw
} from 'lucide-react';

export default function App() {
  const [overview, setOverview] = useState({ top_priorities: [] });
  const [memoryItems, setMemoryItems] = useState([]);
  const [agentsData, setAgentsData] = useState({ agents: [], recent_executions: [] });
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [stats, setStats] = useState({});

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastExecutionSteps, setLastExecutionSteps] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'memory', 'agents', 'dashboard', 'privacy'

  // New Memory Modal/Form State
  const [newMemFact, setNewMemFact] = useState('');
  const [newMemCat, setNewMemCat] = useState('knowledge');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [overRes, memRes, agentRes, logsRes, tasksRes, projRes, recRes, profRes, statsRes] = await Promise.all([
        fetch('/api/overview'),
        fetch('/api/memory-items'),
        fetch('/api/agents'),
        fetch('/api/logs'),
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/recommendations'),
        fetch('/api/user-profile'),
        fetch('/api/stats')
      ]);

      if (overRes.ok) setOverview(await overRes.json());
      if (memRes.ok) setMemoryItems(await memRes.json());
      if (agentRes.ok) setAgentsData(await agentRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (recRes.ok) setRecommendations(await recRes.json());
      if (profRes.ok) setUserProfile(await profRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  const handleCommandSubmit = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptToUse = customPrompt || inputPrompt;
    if (!promptToUse.trim()) return;

    setLoading(true);
    setLastExecutionSteps(["✓ İçerik Analiz Ediliyor...", "✓ Bağlam Taranıyor..."]);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: promptToUse, source: 'command_center' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.execution_steps) setLastExecutionSteps(data.execution_steps);
        setInputPrompt('');
        await fetchData();
      }
    } catch (err) {
      console.error("Command error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async (agentName, prompt) => {
    setLoading(true);
    setLastExecutionSteps([`✓ ${agentName} Tetiklendi`, "✓ Veriler Taranıyor...", "✓ Özet Üretiliyor"]);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, prompt: prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.execution_steps) setLastExecutionSteps(data.execution_steps);
        await fetchData();
      }
    } catch (err) {
      console.error("Agent Run Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await fetch(`/api/memory-items/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error("Delete Memory Error:", err);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newMemFact.trim()) return;
    try {
      await fetch('/api/memory-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newMemCat, fact: newMemFact, confidence: 98, learned_from: 'Misa Input' })
      });
      setNewMemFact('');
      fetchData();
    } catch (err) {
      console.error("Add Memory Error:", err);
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

  return (
    <div className="app-container">
      {/* Desktop Sidebar Navigation */}
      <aside className="sidebar-panel">
        <div className="brand-wrapper">
          <div className="brand-badge">
            <BrainCircuit size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-text">Life AI OS</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>Second Brain v3.0</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <Compass size={18} /> AI Overview
          </li>
          <li className={`nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
            <UserCheck size={18} /> Your AI Memory ({memoryItems.length})
          </li>
          <li className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
            <Cpu size={18} /> AI Agents (5)
          </li>
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layers size={18} /> Life Dashboard
          </li>
          <li className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <ShieldCheck size={18} /> Privacy & Control
          </li>
        </ul>

        {/* Telemetry Indicator */}
        <div style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            <Sparkles size={14} /> Gemini 2.0 Live Engine
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>7/24 Kesintisiz Otonom Takip</div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="main-content">

        {/* SECTION 1: AI OVERVIEW (TOP HERO BRIEFING) */}
        <section className="hero-briefing">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="hero-subtitle">⚡ AI Daily Briefing</div>
              <h1 className="hero-title">{overview.greeting || "İyi Günler, Misa"}</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '15px' }}>
                {overview.summary_title || "Bugün senin için önemli olanlar:"}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {stats.pending_tasks || 0} Görev
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Bekleyen Aksiyon</div>
            </div>
          </div>

          {/* AI Priority Pills */}
          <div className="hero-priorities">
            {(overview.top_priorities || []).map((priority, idx) => (
              <div key={idx} className="priority-pill">
                <CheckCircle2 size={16} color="var(--accent-cyan)" />
                <span><strong>{idx + 1}.</strong> {priority}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TAB 1: OVERVIEW & CENTRAL AI ASSISTANT COMMAND SPACE */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Central Personal AI Assistant Workspace */}
            <div className="linear-card command-console">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} /> Personal AI Command Space
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Ask anything...</span>
              </div>

              {/* Quick Action Chips */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handleCommandSubmit(null, "Bugün ne yapmalıyım?")} className="priority-pill" style={{ cursor: 'pointer', background: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--accent-cyan)' }}>
                  🎯 Bugün ne yapmalıyım?
                </button>
                <button onClick={() => handleCommandSubmit(null, "Bu haftayı düzenle ve öncelikleri çıkar")} className="priority-pill" style={{ cursor: 'pointer' }}>
                  📅 Bu haftayı düzenle
                </button>
                <button onClick={() => handleCommandSubmit(null, "Son aldığım kararları ve projeleri özetle")} className="priority-pill" style={{ cursor: 'pointer' }}>
                  🧠 Projeleri özetle
                </button>
              </div>

              {/* Main Input Form */}
              <form onSubmit={handleCommandSubmit} style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  className="input-box" 
                  placeholder="Dijital beyninize bir talimat verin veya soru sorun..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="action-btn" disabled={loading}>
                  {loading ? 'İşleniyor...' : <><Send size={16} /> Çalıştır</>}
                </button>
              </form>

              {/* Dynamic AI Process Execution Steps (✓ Calendar Analyzed, ✓ Plan Generated) */}
              {lastExecutionSteps.length > 0 && (
                <div className="execution-steps-box">
                  {lastExecutionSteps.map((step, idx) => (
                    <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {step} {idx < lastExecutionSteps.length - 1 && "→"}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content Split: Proactive Insights + Recent Interactions */}
            <div className="content-grid">
              {/* Proactive Insights Cards */}
              <div className="linear-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lightbulb size={20} /> Proaktif AI Önerileri
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {recommendations.map((rec) => (
                    <div key={rec.id} style={{ background: 'rgba(3, 7, 18, 0.6)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--accent-amber)' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{rec.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>{rec.advice}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="linear-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} /> Canlı Akış & Yanıtlar
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} style={{ background: 'rgba(3, 7, 18, 0.5)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>[{log.source.toUpperCase()}] • {log.timestamp}</div>
                      <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>{log.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMORY SYSTEM ("YOUR AI MEMORY") */}
        {activeTab === 'memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="linear-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck size={24} color="var(--accent-cyan)" /> Your AI Memory
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    Yapay zeka asistanınızın hakkınızda öğrendiği ve hafızasında tuttuğu tüm bilgiler:
                  </p>
                </div>
              </div>

              {/* Add New Memory Fact Form */}
              <form onSubmit={handleAddMemory} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <select 
                  className="input-box" 
                  value={newMemCat} 
                  onChange={e => setNewMemCat(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="knowledge">🧠 Knowledge</option>
                  <option value="projects">💼 Projects</option>
                  <option value="schedule">📅 Schedule</option>
                  <option value="finance">💰 Finance</option>
                  <option value="health">❤️ Health</option>
                  <option value="goals">🎯 Goals</option>
                  <option value="learning">📚 Learning</option>
                </select>
                <input 
                  type="text" 
                  className="input-box" 
                  placeholder="Yapay zekanın sizin hakkınızda bilmesini istediğiniz bir gerçeği ekleyin..." 
                  value={newMemFact}
                  onChange={e => setNewMemFact(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="action-btn">
                  <Plus size={16} /> Hafızaya Ekle
                </button>
              </form>

              {/* Memory Fact Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {memoryItems.map((item) => (
                  <div key={item.id} className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.7)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)' }}>
                        {item.category}
                      </span>
                      <button 
                        onClick={() => handleDeleteMemory(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      >
                        <Trash2 size={14} /> Bu Bilgiyi Sil
                      </button>
                    </div>

                    <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600, lineHeight: '1.5' }}>
                      {item.fact}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>
                      <span>Güven Skoru: %{item.confidence}</span>
                      <span>Kaynak: {item.learned_from}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI AGENTS HUB */}
        {activeTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="linear-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={24} color="var(--accent-violet)" /> Autonomous AI Agents
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Farklı alanlarda sizin için otonom araştırma, planlama, sağlık ve finans takibi yapan alt yapay zeka ajanları:
              </p>

              {/* Agents Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {(agentsData.agents || []).map((agent, idx) => (
                  <div key={idx} className="linear-card" style={{ padding: '20px', background: 'rgba(3, 7, 18, 0.8)' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="var(--accent-cyan)" /> {agent.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>{agent.role}</div>
                    
                    <button 
                      onClick={() => handleRunAgent(agent.name, `${agent.name} modunda analiz yap ve önerilerini sun.`)}
                      className="action-btn"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                    >
                      Ajana Görev Ver <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIFE DASHBOARD (7 CATEGORIES) */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="linear-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} color="var(--accent-cyan)" /> Life Dashboard (7 Hayat Kategorisi)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <BookOpen size={18} /> 🧠 Knowledge (Bilgi Deposu)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {memoryItems.filter(m => m.category === 'knowledge').length} İndekslenmiş Bilgi
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <Briefcase size={18} /> 💼 Projects (Canlı Projeler)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {projects.length} Aktif Proje
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <CalendarIcon size={18} /> 📅 Schedule (Takvim & Görevler)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {tasks.length} Bekleyen Aksiyon
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <DollarSign size={18} /> 💰 Finance (Finans Takibi)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    AI Finans Takibi Aktif
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <Heart size={18} /> ❤️ Health (Sağlık & Enerji)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Enerji & Odaklanma Dengesi İyi
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <Target size={18} /> 🎯 Goals (Hedefler)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    %100 AI Hayat Entegrasyonu
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '18px', background: 'rgba(3, 7, 18, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <GraduationCap size={18} /> 📚 Learning (Öğrenme)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Otonom AI & Multi-Model
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRIVACY & DATA CONTROL CENTER */}
        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="linear-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={24} /> Privacy & Data Control Center
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Kişisel verileriniz ve yapay zekanın sahip olduğu tüm erişim izinleri üzerinde %100 tam kontrole sahipsiniz:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="linear-card" style={{ padding: '20px', background: 'rgba(3, 7, 18, 0.8)' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="var(--accent-emerald)" /> Veri Gizliliği
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Tüm verileriniz şifrelenmiş kişisel SQLite veritabanında saklanır ve asla 3. taraf reklam şirketleriyle paylaşılmaz.
                  </div>
                </div>

                <div className="linear-card" style={{ padding: '20px', background: 'rgba(3, 7, 18, 0.8)' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trash2 size={18} color="var(--accent-rose)" /> Hafıza Yönetimi
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    'Your AI Memory' sekmesinden yapay zekanın öğrendiği herhangi bir bilgiyi tek tıkla silebilirsiniz.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <div className="mobile-nav-bar">
        <div className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <Compass size={20} />
          <span>Overview</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
          <UserCheck size={20} />
          <span>Memory</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
          <Cpu size={20} />
          <span>Agents</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Layers size={20} />
          <span>Dashboard</span>
        </div>
      </div>
    </div>
  );
}
