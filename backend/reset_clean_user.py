import sqlite3
from config import DB_PATH

def reset_clean():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM timeline_logs")
    cursor.execute("DELETE FROM tasks")
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM user_profile")
    cursor.execute("DELETE FROM proactive_recommendations")

    # Set real base profile
    cursor.execute("INSERT INTO user_profile (key, value, category) VALUES ('Kullanıcı Kimliği', 'Misa', 'personal')")
    cursor.execute("INSERT INTO user_profile (key, value, category) VALUES ('Ana Hedef', 'Hayatı canlı AI ile 7/24 entegre etmek (Mesajlar, Günlük Akış, Aramalar, Notlar)', 'goals')")
    cursor.execute("INSERT INTO user_profile (key, value, category) VALUES ('Sistem Modu', 'Proaktif Canlı Hayat Koçu', 'system')")

    cursor.execute('''
        INSERT INTO proactive_recommendations (type, title, advice, reasoning, priority, status)
        VALUES ('strategic', '⚡ Canlı AI Hayat Entegrasyonu Başlatıldı', 'Sisteminiz sıfırlandı ve 7/24 proaktif takip moduna alındı. Lütfen şu an üzerinde çalıştığınız ana projelerinizi ve günlük hedeflerinizi paylaşın.', 'Temiz profil kurulumu.', 'high', 'active')
    ''')

    cursor.execute('''
        INSERT INTO timeline_logs (source, category, content, summary, tags)
        VALUES ('system', 'personal', 'Sanal örnek veriler ve eski klasör kalıntıları temizlendi. Sıfır km kişisel AI hayat koçu moduna geçildi.', 'Temiz başlangıç yapıldı.', '["sistem", "baslangic"]')
    ''')

    conn.commit()
    conn.close()
    print("Clean user state set successfully!")

if __name__ == "__main__":
    reset_clean()
