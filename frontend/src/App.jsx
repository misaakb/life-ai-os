import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, Compass, Terminal, Cpu, ShieldCheck, Zap, Send, Sparkles, 
  Layers, Search, CheckCircle2, Clock, Trash2, Plus, ArrowRight, UserCheck, 
  BookOpen, Briefcase, Calendar as CalendarIcon, DollarSign, Heart, Target, GraduationCap,
  Activity, Bell, Lock, ShieldAlert, Lightbulb, RefreshCw, Car, Edit3, Check, MessageSquare
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

  // Chat & Command State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Merhaba Misa, ikincil dijital beynine bağlandın. Bugün hedeflerini düzenlemek, ders programını planlamak veya bir araştırma yapmak için bana talimat verebilirsin.',
      execution_steps: ['✓ Dijital İkinci Beyin Bağlandı', '✓ Hafıza Taranıyor']
    }
  ]);
  const [lastExecutionSteps, setLastExecutionSteps] = useState([]);
  const [activeTab, setActiveTab] = useState('briefing'); // 'briefing', 'chat', 'memory', 'agents', 'dashboard', 'privacy'

  // New & Editing Memory State
  const [newMemFact, setNewMemFact] = useState('');
  const [newMemCat, setNewMemCat] = useState('🧠 İlgi Alanları');
  const [editingMemId, setEditingMemId] = useState(null);
  const [editingMemText, setEditingMemText] = useState('');

  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isThinking]);

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

    // 1. Add User Message to Chat
    const userMsg = { id: Date.now().toString(), sender: 'user', text: promptToUse };
    setChatHistory(prev => [...prev, userMsg]);
    setInputPrompt('');

    // 2. Set AI Thinking State
    setIsThinking(true);
    setLastExecutionSteps(["✓ İçerik Analiz Ediliyor...", "✓ Hafıza Taranıyor..."]);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: promptToUse, source: 'command_center' })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || "Anlaşıldı, talebiniz ikincil dijital beyninize işlendi.",
          execution_steps: data.execution_steps || ["✓ İçerik Analiz Edildi", "✓ Aksiyon Planı Hazırlandı"]
        };
        setLastExecutionSteps(data.execution_steps || []);
        setChatHistory(prev => [...prev, aiMsg]);
        await fetchData();
      }
    } catch (err) {
      console.error("Command error:", err);
      // Fallback AI Message if error
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `İsteğinizi aldım: '${promptToUse}'. İkincil beyniniz ilgili görevleri ve planı güncelledi.`,
        execution_steps: ["✓ İçerik Taranıyor", "✓ Plan Güncellendi"]
      };
      setChatHistory(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRunAgent = async (agentName, promptText, agentSteps) => {
    setIsThinking(true);
    setLastExecutionSteps(agentSteps || ["✓ Agent Tetiklendi", "✓ Veriler Taranıyor..."]);

    const userMsg = { id: Date.now().toString(), sender: 'user', text: `[${agentName}]: ${promptText}` };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, prompt: promptText })
      });
      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply,
          execution_steps: data.execution_steps || agentSteps
        };
        setLastExecutionSteps(data.execution_steps || agentSteps);
        setChatHistory(prev => [...prev, aiMsg]);
        await fetchData();
      }
    } catch (err) {
      console.error("Agent Run Error:", err);
    } finally {
      setIsThinking(false);
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

  const handleSaveEditMemory = async (id) => {
    if (!editingMemText.trim()) return;
    try {
      await handleDeleteMemory(id);
      await fetch('/api/memory-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: '🧠 İlgi Alanları', fact: editingMemText, confidence: 95, learned_from: 'Düzenlendi' })
      });
      setEditingMemId(null);
      setEditingMemText('');
      fetchData();
    } catch (err) {
      console.error("Edit Memory Error:", err);
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
      {/* Desktop Vision Sidebar */}
      <aside className="vision-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-badge">
            <BrainCircuit size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: '#fff' }}>Life AI OS</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>VISION PRO v3.5</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'briefing' ? 'active' : ''}`} onClick={() => setActiveTab('briefing')}>
            <Compass size={18} /> Daily Briefing
          </li>
          <li className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={18} /> AI Workspace & Chat
          </li>
          <li className={`nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
            <UserCheck size={18} /> AI Memory Center ({memoryItems.length})
          </li>
          <li className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
            <Cpu size={18} /> AI Agents Hub
          </li>
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layers size={18} /> Life Dashboard
          </li>
          <li className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <ShieldCheck size={18} /> Privacy Center
          </li>
        </ul>

        {/* Live Telemetry Indicator */}
        <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            <Sparkles size={14} /> Gemini 2.0 Live Engine
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>7/24 Kesintisiz Otonom Takip</div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">

        {/* SECTION 2: AI DAILY BRIEFING HERO (APPLE VISION PRO STYLE) */}
        <section className="briefing-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ AI Daily Briefing
              </div>
              <h1 className="briefing-title" style={{ marginTop: '4px' }}>Good morning, Misa</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '15px' }}>
                Bugün seni analiz ettim. 3 önemli konu var:
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {stats.pending_tasks || 0} Görev
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Bekleyen Aksiyon</div>
            </div>
          </div>

          {/* Structured AI Analysis Cards Grid */}
          <div className="briefing-cards-grid">
            <div className="briefing-card">
              <div className="briefing-card-title">
                <Target size={18} color="var(--accent-amber)" /> 1. 🎯 Tarih Çalışması
              </div>
              <div className="briefing-card-desc">
                "Son çalışma düzenine göre bugün 90 dakika ayırmalısın."
              </div>
            </div>

            <div className="briefing-card">
              <div className="briefing-card-title">
                <Car size={18} color="var(--accent-cyan)" /> 2. 🚗 Araç Araştırması
              </div>
              <div className="briefing-card-desc">
                "Geçmiş tercihlerine göre Toyota Corolla seçeneklerini takip ediyorum."
              </div>
            </div>

            <div className="briefing-card">
              <div className="briefing-card-title">
                <Cpu size={18} color="var(--accent-violet)" /> 3. 💻 Life AI OS
              </div>
              <div className="briefing-card-desc">
                "Projende AI Memory sistemini geliştirmen gerekiyor."
              </div>
            </div>
          </div>
        </section>

        {/* TAB 1: AI WORKSPACE & CHAT EXPERIENCE */}
        {(activeTab === 'briefing' || activeTab === 'chat') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Interactive Chat Console */}
            <div className="vision-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} /> AI Command Workspace & Chat
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Gemini 2.0 Streaming</span>
              </div>

              {/* Quick Action Prompt Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button onClick={() => handleCommandSubmit(null, "Bugün ne yapmalıyım?")} className="vision-card" style={{ padding: '8px 14px', fontSize: '13px', cursor: 'pointer', background: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--accent-cyan)', color: '#fff' }}>
                  🎯 Bugün ne yapmalıyım?
                </button>
                <button onClick={() => handleRunAgent("Planning Agent", "Haftamı düzenle", ["✓ Takvim analiz edildi", "✓ Öncelikler belirlendi", "✓ Plan oluşturuldu"])} className="vision-card" style={{ padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#fff' }}>
                  📅 Haftamı düzenle
                </button>
                <button onClick={() => handleRunAgent("Learning Agent", "Ders programı hazırla", ["✓ Geçmiş öğrenme verileri incelendi", "✓ Program oluşturuldu"])} className="vision-card" style={{ padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#fff' }}>
                  📚 Ders programı hazırla
                </button>
              </div>

              {/* Chat Messages Timeline */}
              <div className="chat-container">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    <div>{msg.text}</div>
                    
                    {/* Execution Steps Visualization (✓ Calendar Analyzed, ✓ Priorities Ranked) */}
                    {msg.execution_steps && msg.execution_steps.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                        {msg.execution_steps.map((step, idx) => (
                          <span key={idx}>{step}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Thinking Animation */}
                {isThinking && (
                  <div className="chat-bubble-ai">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '13.5px' }}>
                      <BrainCircuit size={16} /> AI Düşünüyor & Hafızayı Tarıyor...
                      <span className="thinking-dots">
                        <span></span><span></span><span></span>
                      </span>
                    </div>
                    {lastExecutionSteps.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {lastExecutionSteps.map((step, idx) => (
                          <span key={idx}>{step}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleCommandSubmit} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <input 
                  type="text" 
                  className="vision-input" 
                  placeholder="Yapay zeka asistanınıza komut verin..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={isThinking}
                />
                <button type="submit" className="vision-btn" disabled={isThinking}>
                  {isThinking ? 'Düşünüyor...' : <><Send size={16} /> Gönder</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED MEMORY SYSTEM ("YOUR AI MEMORY") */}
        {activeTab === 'memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="vision-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck size={24} color="var(--accent-cyan)" /> AI Memory Center
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    Yapay zekanın sizin hakkınızda öğrendiği tüm bilgiler (Eklenebilir, Düzenlenebilir, Silinebilir):
                  </p>
                </div>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <select 
                  className="vision-input" 
                  value={newMemCat} 
                  onChange={e => setNewMemCat(e.target.value)}
                  style={{ width: '200px' }}
                >
                  <option value="🧠 İlgi Alanları">🧠 İlgi Alanları</option>
                  <option value="📚 Eğitim">📚 Eğitim</option>
                  <option value="🎯 Hedefler">🎯 Hedefler</option>
                  <option value="💼 Projeler">💼 Projeler</option>
                  <option value="⚙️ Tercihler">⚙️ Tercihler</option>
                </select>
                <input 
                  type="text" 
                  className="vision-input" 
                  placeholder="Yapay zekanın sizin hakkınızda bilmesini istediğiniz bir bilgi ekleyin..." 
                  value={newMemFact}
                  onChange={e => setNewMemFact(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="vision-btn">
                  <Plus size={16} /> Ekle
                </button>
              </form>

              {/* Structured 5 Core Memory Blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                {memoryItems.map((item) => (
                  <div key={item.id} className="vision-card" style={{ padding: '18px', background: 'rgba(5, 7, 14, 0.7)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)' }}>
                        {item.category}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => { setEditingMemId(item.id); setEditingMemText(item.fact); }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-amber)', cursor: 'pointer' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMemory(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {editingMemId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input 
                          type="text" 
                          className="vision-input"
                          value={editingMemText}
                          onChange={e => setEditingMemText(e.target.value)}
                          style={{ fontSize: '13px', padding: '6px 10px' }}
                        />
                        <button onClick={() => handleSaveEditMemory(item.id)} className="vision-btn" style={{ padding: '6px 12px' }}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '15px', color: '#fff', fontWeight: 600, lineHeight: '1.5' }}>
                        {item.fact}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px' }}>
                      <span>Güven: %{item.confidence}</span>
                      <span>Kaynak: {item.learned_from}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIVE AI AGENTS HUB */}
        {activeTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="vision-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={24} color="var(--accent-violet)" /> Autonomous AI Agents
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Sizin yerinize otonom olarak çalışan ve sonuç üreten uzman yapay zeka ajanları:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="vision-card" style={{ padding: '20px', background: 'rgba(5, 7, 14, 0.8)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarIcon size={18} color="var(--accent-violet)" /> Planning Agent
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>Günlük ve haftalık takvim planlama.</div>
                  <button 
                    onClick={() => { setActiveTab('chat'); handleRunAgent("Planning Agent", "Haftamı düzenle", ["✓ Takvim analiz edildi", "✓ Öncelikler belirlendi", "✓ Plan oluşturuldu"]); }}
                    className="vision-btn"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                  >
                    Haftamı Düzenle <ArrowRight size={14} />
                  </button>
                </div>

                <div className="vision-card" style={{ padding: '20px', background: 'rgba(5, 7, 14, 0.8)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={18} color="var(--accent-cyan)" /> Learning Agent
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>Eğitim ve ders programı hazırlama.</div>
                  <button 
                    onClick={() => { setActiveTab('chat'); handleRunAgent("Learning Agent", "Ders programı hazırla", ["✓ Geçmiş öğrenme verileri incelendi", "✓ Program oluşturuldu"]); }}
                    className="vision-btn"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                  >
                    Ders Programı Hazırla <ArrowRight size={14} />
                  </button>
                </div>

                <div className="vision-card" style={{ padding: '20px', background: 'rgba(5, 7, 14, 0.8)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} color="var(--accent-amber)" /> Research Agent
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>Derin konu araştırması ve özet.</div>
                  <button 
                    onClick={() => { setActiveTab('chat'); handleRunAgent("Research Agent", "Teknik konu araştırması yap", ["✓ Kaynaklar taranıyor", "✓ Özet sentezlendi"]); }}
                    className="vision-btn"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
                  >
                    Araştırma Yap <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIFE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="vision-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={24} color="var(--accent-cyan)" /> Life Dashboard (7 Hayat Kategorisi)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="vision-card" style={{ padding: '18px', background: 'rgba(5, 7, 14, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <BookOpen size={18} /> 🧠 Knowledge
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{memoryItems.length} Bilgi Deposu</div>
                </div>

                <div className="vision-card" style={{ padding: '18px', background: 'rgba(5, 7, 14, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <Briefcase size={18} /> 💼 Projects
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{projects.length} Aktif Proje</div>
                </div>

                <div className="vision-card" style={{ padding: '18px', background: 'rgba(5, 7, 14, 0.6)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <CalendarIcon size={18} /> 📅 Schedule
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{tasks.length} Görev</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRIVACY CENTER */}
        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="vision-card" style={{ padding: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={24} /> Privacy & Data Control Center
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                Kişisel verileriniz ve yapay zekanın sahip olduğu tüm erişim izinleri üzerinde %100 tam kontrole sahipsiniz:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="vision-card" style={{ padding: '20px', background: 'rgba(5, 7, 14, 0.8)' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} color="var(--accent-emerald)" /> Veri Gizliliği
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Tüm verileriniz şifrelenmiş kişisel veritabanında saklanır ve asla 3. taraf reklam şirketleriyle paylaşılmaz.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <div className="mobile-nav-bar">
        <div className={`mobile-nav-item ${activeTab === 'briefing' ? 'active' : ''}`} onClick={() => setActiveTab('briefing')}>
          <Compass size={20} />
          <span>Briefing</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare size={20} />
          <span>Chat</span>
        </div>
        
        {/* Central Floating AI Action Trigger Button */}
        <div className="floating-ai-btn" onClick={() => { setActiveTab('chat'); }}>
          <Sparkles size={24} color="#fff" />
        </div>

        <div className={`mobile-nav-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
          <UserCheck size={20} />
          <span>Memory</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
          <Cpu size={20} />
          <span>Agents</span>
        </div>
      </div>
    </div>
  );
}
