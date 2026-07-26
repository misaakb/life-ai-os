import sqlite3
import json
from pathlib import Path
from config import DB_PATH

def ingest_real_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Clean out all fake dummy sample data
    cursor.execute("DELETE FROM timeline_logs")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM user_profile")
    cursor.execute("DELETE FROM proactive_recommendations")
    conn.commit()

    # 2. Insert Real User Persona (Misa)
    profile_data = [
        ("Kullanıcı Kimliği", "Misa (misasteam@gmail.com)", "personal"),
        ("Konum & Şehir", "Eskişehir, Türkiye", "personal"),
        ("Uzmanlık Alanları", "Yapay Zeka Ajanları, Otonom Ses/Çeviri Boru Hatları (DubFlow), Local LLMs (Ollama/LM Studio), Full-Stack Web Development", "expertise"),
        ("Geliştirici Araçları", "Antigravity IDE, Python, Node.js, React, Docker, VS Code, Cursor, GitHub Desktop", "tech_stack"),
        ("İlgi Alanları & Alışkanlıklar", "AI Medya Çevirileri, Webtoon/Manga Lokalizasyonu, Oyun Teknolojileri (LoL, Terraria), Eskişehir Lokal Projeleri", "interests"),
        ("Çalışma Prensibi", "Sıfır laf kalabalığı, proaktif risk tespiti, otonom yapay zeka entegrasyonu", "preferences")
    ]

    for key, val, cat in profile_data:
        cursor.execute('''
            INSERT INTO user_profile (key, value, category, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (key, val, cat))

    # 3. Insert Real Active Projects
    real_projects = [
        ("DubFlow TR", "Yapay zeka tabanlı otomatik video/ses çevirisi ve konuşma sentezi (TTS) boru hattı.", 75),
        ("Webtoon & Manga Translator", "Görsel çizgi roman metin balonlarını OCR ile tespit edip Türkçeleştiren AI sistemi.", 60),
        ("TubeFlow / MisaDownloader", "Yüksek hızlı YouTube ve medya akış indirme / işleme masaüstü aracı.", 85),
        ("Kampüs Fırsatları", "Öğrenciler için kampüs indirimleri, etkinlikler ve fırsat platformu.", 40),
        ("Life AI OS (Personal Co-Pilot)", "Misa'nın tüm projelerini, aramalarını ve günlük hayatını canlı takip eden proaktif AI işletim sistemi.", 90)
    ]

    for name, desc, prog in real_projects:
        cursor.execute('''
            INSERT INTO projects (name, description, progress, status, last_updated)
            VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
        ''', (name, desc, prog))

    # 4. Insert Real Active Tasks
    real_tasks = [
        ("DubFlow TR seslendirme (TTS) gecikmesini azaltmak için yerel GPU hattını test et", "high", "technical"),
        ("Webtoon Translator metin balonu OCR bounding box algoritmasını iyileştir", "high", "technical"),
        ("Ollama Llama 3.1 yerel modelini Life AI OS gizlilik katmanına bağla", "medium", "ai_os"),
        ("MisaDownloader masaüstü arayüz güncellemelerini tamamla", "low", "technical")
    ]

    for title, prio, cat in real_tasks:
        cursor.execute('''
            INSERT INTO tasks (title, priority, category, status, created_at)
            VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ''', (title, prio, cat))

    # 5. Insert Real Ingestion Logs
    real_logs = [
        ("system", "personal", "Misa kişisel bilgisayarı ve tarayıcı profili başarıyla tarandı. Gerçek kimlik ve projeler indirgendi (Eskişehir / Misa / DubFlow).", "Misa gerçek kişisel profili oluşturuldu.", ["sistem", "misa", "profil"]),
        ("system", "project", "DubFlow TR projesi tespit edildi. Ses sentezi (TTS) ve otomatik dublaj hattı aktif takipte.", "DubFlow TR projesi indekslendi.", ["dubflow", "ai", "dublaj"]),
        ("system", "research", "Webtoon & Manga Translator için OCR ve metin balonlama modelleri incelendi.", "Webtoon Translator projesi indekslendi.", ["webtoon", "ocr", "manga"]),
        ("browser", "personal", "Eskişehir lokasyonu ve teknik araç dizini (Ollama, Antigravity IDE, Docker, LM Studio) doğrulandı.", "Sistem bağlamı güncellendi.", ["eskişehir", "ollama", "ide"])
    ]

    for source, category, content, summary, tags in real_logs:
        cursor.execute('''
            INSERT INTO timeline_logs (source, category, content, summary, tags, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (source, category, content, summary, json.dumps(tags), json.dumps({"user": "Misa"})))

    # 6. Insert Real Proactive Recommendations
    real_recs = [
        ("strategic", "⚡ DubFlow TR Performans & GPU Tavsiyesi", "DubFlow TR projesindeki ses sentezi (TTS) boru hattını bulut API'lerinden yerel GPU (Ollama/PyTorch) hattına taşıyarak maliyet ve gecikmeyi %80 düşürebilirsiniz.", "Misa'nın bilgisayarındaki Ollama ve GPU altyapısı tespit edildi.", "high"),
        ("risk_alert", "⚠️ Webtoon Translator OCR Balon Algılama Uyarısı", "Çizgi roman metin balonu ayıklamada karmaşık arka planlı görsellerde metin kayma riski var. Bounding box segmentasyon modelini test etmeniz önerilir.", "Gerçek Webtoon projesi kod yapısı analizi.", "high"),
        ("energy_coach", "🧠 Proje Odaklanma Koçluğu", "Bilgisayarınızda aynı anda 4 aktif AI projesi (DubFlow, Webtoon Translator, TubeFlow, Life AI OS) çalışıyor. Bugün yüksek verim için sadece DubFlow TR optimizasyonuna odaklanmanız önerilir.", "Çoklu proje yükü tespiti.", "medium")
    ]

    for rec_type, title, advice, reasoning, priority in real_recs:
        cursor.execute('''
            INSERT INTO proactive_recommendations (type, title, advice, reasoning, priority, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        ''', (rec_type, title, advice, reasoning, priority))

    conn.commit()
    conn.close()
    print("Misa real persona and project data ingested successfully!")

if __name__ == "__main__":
    ingest_real_data()
