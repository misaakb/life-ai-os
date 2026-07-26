import sqlite3
from pathlib import Path
from config import DB_PATH

def populate_baseline():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear old state safely
    cursor.execute("DELETE FROM user_profile")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM proactive_recommendations")

    # Real User Baseline Profile
    profile_items = [
        ("Kullanıcı Adı", "Misa", "personal"),
        ("Konum", "Eskişehir, Türkiye", "personal"),
        ("Ana Hedef", "Tüm hayatımı, projelerimi, aramalarımı ve günlük işlerimi %100 AI ile canlı entegre etmek.", "goals"),
        ("İletişim & Çalışma Tarzı", "Direkt, net, laf kalabalığı olmayan, risk ve fırsat odaklı proaktif rehberlik.", "preferences"),
        ("Geliştirme Ortamı", "Python, Node.js, React, Docker, Antigravity IDE", "tech_stack")
    ]

    for key, val, cat in profile_items:
        cursor.execute('''
            INSERT INTO user_profile (key, value, category, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, category=excluded.category, updated_at=CURRENT_TIMESTAMP
        ''', (key, val, cat))

    # Starter Real Tasks
    starter_tasks = [
        ("Telegram Botu (@Misanaibibot) üzerinden ilk sesli notu veya mesajı gönder", "high", "onboarding"),
        ("Yapay zeka asistanına günün en önemli 1 ana hedefini söyle", "medium", "daily"),
        ("Seni Tanıma Katmanına kişisel bir alışkanlığını ekle", "low", "profile")
    ]

    for title, prio, cat in starter_tasks:
        cursor.execute('''
            INSERT INTO tasks (title, priority, category, status, created_at)
            VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        ''', (title, prio, cat))

    # Starter Proactive Recommendations
    starter_recs = [
        ("strategic", "⚡ Canlı AI Hayat Entegrasyonu Aktif!", "Misa, sisteminiz 7/24 takip modunda yayında. @Misanaibibot üzerinden veya buradaki giriş kutusundan aklınıza gelen herhangi bir fikri veya kararı paylaşabilirsiniz.", "Sistem başlangıç kurulumu yapıldı.", "high"),
        ("energy_coach", "🧠 Günlük AI Koçluk İpucu", "Yapay zeka sizi tanıdıkça proaktif uarılar keskinleşecek. Bugün en kritik işinize odaklanın ve gerisini asistanınıza not ettirin.", "Kişisel profil analizi.", "medium")
    ]

    for rec_type, title, advice, reasoning, priority in starter_recs:
        cursor.execute('''
            INSERT INTO proactive_recommendations (type, title, advice, reasoning, priority, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        ''', (rec_type, title, advice, reasoning, priority))

    conn.commit()
    conn.close()
    print("Misa baseline profile populated successfully!")

if __name__ == "__main__":
    populate_baseline()
