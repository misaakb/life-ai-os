import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, Compass, Terminal, Cpu, ShieldCheck, Zap, Send, Sparkles, 
  Layers, Search, CheckCircle2, Clock, Trash2, Plus, ArrowRight, UserCheck, 
  BookOpen, Briefcase, Calendar as CalendarIcon, DollarSign, Heart, Target, GraduationCap,
  Activity, Bell, Lock, ShieldAlert, Lightbulb, RefreshCw, Car, Edit3, Check, MessageSquare, Radio
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

  // Chat & Swarm State
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [runningSwarm, setRunningSwarm] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'İyi günler Misa. 7 Otonom AI Ajanı canlı olarak hazır. Sistemdeki tüm araştırmalar, planlamalar ve telemetri uyarıları arka planda otonom yürütülüyor.',
      execution_steps: ['✓ 7-Agent Swarm Aktif', '✓ Arka Plan İzleme Açık']
    }
  ]);
  const [activeTab, setActiveTab] = useState('briefing'); // 'briefing', 'chat', 'memory', 'agents', 'dashboard', 'privacy'

  // Memory Form
  const [newMemFact, setNewMemFact] = useState('');
  const [newMemCat, setNewMemCat] = useState('🧠 İlgi Alanları');

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

  const handleRunSwarm = async () => {
    setRunningSwarm(true);
    try {
      const res = await fetch('/api/agents/swarm/run', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        const aiMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: '⚡ 7 Otonom AI Ajanı eş zamanlı çalıştırıldı. Tüm zaman blokları, araştırma özetleri ve proaktif tavsiyeler güncellendi.',
          execution_steps: [
            '✓ Master Orchestrator', '✓ Planning Agent', '✓ Deep Research Agent', 
            '✓ Health Agent', '✓ Finance Agent', '✓ Skill Agent', '✓ Telemetry Alert'
          ]
        };
        setChatHistory(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("Swarm Run Error:", err);
    } finally {
      setRunningSwarm(false);
    }
  };

  const handleCommandSubmit = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    const promptToUse = customPrompt || inputPrompt;
    if (!promptToUse.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: promptToUse };
    setChatHistory(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

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
          text: data.reply || "Anlaşıldı, isteğinizi ikincil dijital beyninize kaydettim.",
          execution_steps: data.execution_steps || ["✓ Takvim Analiz Edildi", "✓ Aksiyon Planı Hazırlandı"]
        };
        setChatHistory(prev => [...prev, aiMsg]);
        await fetchData();
      }
    } catch (err) {
      console.error("Command error:", err);
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `İsteğinizi aldım: '${promptToUse}'. İkincil beyniniz ilgili planı güncelledi.`,
        execution_steps: ["✓ İçerik Taranıyor", "✓ Plan Güncellendi"]
      };
      setChatHistory(prev => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRunSingleAgent = async (agentName, promptText, steps) => {
    setIsThinking(true);
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
          execution_steps: data.execution_steps || steps
        };
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

  return (
    <div className="linear-app">
      {/* Linear Style Sidebar */}
      <aside className="linear-sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div className="brand-name">Life AI OS</div>
        </div>

        <ul className="nav-group">
          <li className={`nav-link ${activeTab === 'briefing' ? 'active' : ''}`} onClick={() => setActiveTab('briefing')}>
            <Compass size={16} /> Daily Briefing
          </li>
          <li className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={16} /> AI Workspace & Chat
          </li>
          <li className={`nav-link ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
            <UserCheck size={16} /> AI Memory ({memoryItems.length})
          </li>
          <li className={`nav-link ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
            <Cpu size={16} /> 7-Agent Swarm
          </li>
          <li className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layers size={16} /> Life Dashboard
          </li>
          <li className={`nav-link ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <ShieldCheck size={16} /> Privacy Center
          </li>
        </ul>
      </aside>

      {/* Main Container */}
      <main className="linear-main">
        {/* Top Telemetry Header */}
        <header className="top-bar">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Digital Second Brain • <span style={{ color: '#fff' }}>Misa Workspace</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={handleRunSwarm}
              className="command-btn"
              disabled={runningSwarm}
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
            >
              <Zap size={14} className={runningSwarm ? "spin" : ""} />
              {runningSwarm ? '7 Ajan Çalışıyor...' : '⚡ 7-Agent Swarm Çalıştır'}
            </button>
            <div className="telemetry-pill">
              <Radio size={12} /> 7 Ajan Canlı
            </div>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="workspace-scroll">
          
          {/* AI Daily Briefing Box */}
          <section className="hero-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Daily Intelligence Summary
                </div>
                <h1 className="hero-header" style={{ marginTop: '4px' }}>Good morning, Misa</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
                  Bugün seni analiz ettim. 3 önemli konu var:
                </p>
              </div>
            </div>

            {/* Briefing Items Grid */}
            <div className="briefing-grid">
              <div className="briefing-item">
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} color="var(--amber)" /> 🎯 Tarih Çalışması
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  "Son çalışma düzenine göre bugün 90 dakika ayırmalısın."
                </div>
              </div>

              <div className="briefing-item">
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} color="var(--cyan)" /> 🚗 Araç Araştırması
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  "Geçmiş tercihlerine göre Toyota Corolla seçeneklerini takip ediyorum."
                </div>
              </div>

              <div className="briefing-item">
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} color="var(--violet)" /> 💻 Life AI OS
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
                  "Projende AI Memory sistemini geliştirmen gerekiyor."
                </div>
              </div>
            </div>
          </section>

          {/* TAB 1: AI WORKSPACE & CHAT EXPERIENCE */}
          {(activeTab === 'briefing' || activeTab === 'chat') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Raycast / Linear Floating Input Bar */}
              <form onSubmit={handleCommandSubmit} className="command-bar">
                <Terminal size={18} color="var(--cyan)" />
                <input 
                  type="text" 
                  className="command-input" 
                  placeholder="Yapay zeka asistanınıza bir soru sorun veya komut verin..." 
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  disabled={isThinking}
                />
                <button type="submit" className="command-btn" disabled={isThinking}>
                  {isThinking ? 'Düşünüyor...' : <><Send size={14} /> Gönder</>}
                </button>
              </form>

              {/* Quick Action Chips */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handleCommandSubmit(null, "Bugün ne yapmalıyım?")} className="linear-card" style={{ padding: '8px 14px', fontSize: '12.5px', cursor: 'pointer', color: '#fff', background: 'rgba(56, 189, 248, 0.1)', borderColor: 'var(--cyan)' }}>
                  🎯 Bugün ne yapmalıyım?
                </button>
                <button onClick={() => handleRunSingleAgent("Planning Agent", "Haftamı düzenle", ["✓ Takvim analiz edildi", "✓ Öncelikler belirlendi", "✓ Plan oluşturuldu"])} className="linear-card" style={{ padding: '8px 14px', fontSize: '12.5px', cursor: 'pointer', color: '#fff' }}>
                  📅 Haftamı düzenle
                </button>
                <button onClick={() => handleRunSingleAgent("Learning Agent", "Ders programı hazırla", ["✓ Geçmiş öğrenme verileri incelendi", "✓ Program oluşturuldu"])} className="linear-card" style={{ padding: '8px 14px', fontSize: '12.5px', cursor: 'pointer', color: '#fff' }}>
                  📚 Ders programı hazırla
                </button>
              </div>

              {/* Chat Timeline Feed */}
              <div className="linear-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="var(--cyan)" /> AI Conversations & Actions
                </h3>

                <div className="chat-stream">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}>
                      <div>{msg.text}</div>
                      
                      {msg.execution_steps && msg.execution_steps.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)', background: 'rgba(56, 189, 248, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                          {msg.execution_steps.map((step, idx) => (
                            <span key={idx}>{step}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isThinking && (
                    <div className="bubble-ai">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)' }}>
                        <BrainCircuit size={16} /> AI Düşünüyor & Hafızayı Tarıyor...
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI MEMORY SYSTEM */}
          {activeTab === 'memory' && (
            <div className="linear-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={22} color="var(--cyan)" /> AI Memory Center
              </h2>

              <form onSubmit={handleAddMemory} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select className="command-input" style={{ width: '180px', background: 'rgba(8,9,10,0.8)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-dim)' }} value={newMemCat} onChange={e => setNewMemCat(e.target.value)}>
                  <option value="🧠 İlgi Alanları">🧠 İlgi Alanları</option>
                  <option value="📚 Eğitim">📚 Eğitim</option>
                  <option value="🎯 Hedefler">🎯 Hedefler</option>
                  <option value="💼 Projeler">💼 Projeler</option>
                  <option value="⚙️ Tercihler">⚙️ Tercihler</option>
                </select>
                <input type="text" className="command-input" style={{ flex: 1, background: 'rgba(8,9,10,0.8)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-dim)' }} placeholder="Yapay zekaya yeni bir bilgi öğret..." value={newMemFact} onChange={e => setNewMemFact(e.target.value)} />
                <button type="submit" className="command-btn"><Plus size={14} /> Ekle</button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {memoryItems.map((item) => (
                  <div key={item.id} className="linear-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{item.category}</span>
                      <button onClick={() => handleDeleteMemory(item.id)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{item.fact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 7-AGENT SWARM HUB */}
          {activeTab === 'agents' && (
            <div className="linear-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={22} color="var(--violet)" /> 7 Autonomous AI Agents Swarm
                </h2>
                <button onClick={handleRunSwarm} className="command-btn" disabled={runningSwarm}>
                  <Zap size={14} className={runningSwarm ? "spin" : ""} />
                  {runningSwarm ? 'Tüm Ajanlar Çalışıyor...' : 'Tüm Ajanları Eş Zamanlı Çalıştır'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyan)' }}>👑 Master Orchestrator Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Tüm alt ajanları koordine eder.</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>● Canlı Çalışıyor</div>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--violet)' }}>📅 Planning Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Takvim ve zaman bloklama.</div>
                  <button onClick={() => { setActiveTab('chat'); handleRunSingleAgent("Planning Agent", "Haftamı düzenle", ["✓ Takvim analiz edildi", "✓ Öncelikler belirlendi", "✓ Plan oluşturuldu"]); }} className="command-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>Çalıştır</button>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber)' }}>🔬 Deep Research Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Doküman & konu araştırması.</div>
                  <button onClick={() => { setActiveTab('chat'); handleRunSingleAgent("Research Agent", "Teknik konu araştırması yap", ["✓ Kaynaklar taranıyor", "✓ Özet sentezlendi"]); }} className="command-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>Çalıştır</button>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rose)' }}>❤️ Health & Energy Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Yorgunluk & mola takibi.</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>● Canlı Çalışıyor</div>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber)' }}>💰 Finance Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Bütçe & harcama analizi.</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>● Canlı Çalışıyor</div>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyan)' }}>📚 Learning Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>Ders & yetenek rotaları.</div>
                  <button onClick={() => { setActiveTab('chat'); handleRunSingleAgent("Learning Agent", "Ders programı hazırla", ["✓ Öğrenme verileri incelendi", "✓ Program oluşturuldu"]); }} className="command-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>Çalıştır</button>
                </div>

                <div className="linear-card" style={{ padding: '18px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald)' }}>🔔 Telemetry Alert Agent</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '6px 0' }}>7/24 Kesintisiz izleme.</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>● Canlı Çalışıyor</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="mobile-bottom-bar">
        <div className={`mobile-item ${activeTab === 'briefing' ? 'active' : ''}`} onClick={() => setActiveTab('briefing')}>
          <Compass size={18} />
          <span>Briefing</span>
        </div>
        <div className={`mobile-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare size={18} />
          <span>Chat</span>
        </div>
        <div className={`mobile-item ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
          <UserCheck size={18} />
          <span>Memory</span>
        </div>
      </div>
    </div>
  );
}
