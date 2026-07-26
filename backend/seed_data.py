from memory_engine import memory

def seed():
    # User Profile / Persona Data (Seni Tanıma Katmanı)
    memory.set_profile_item("Ana Hedef", "Tüm projelerimi, işlerimi ve kişisel takvimimi %100 yapay zeka ile entegre canlı bir ekosisteme dönüştürmek.", "goals")
    memory.set_profile_item("Çalışma Tarzı", "Yoğun tempo, yüksek odaklanma isteği, sıfır laf kalabalığı, direkt ve net tavsiyeler.", "preferences")
    memory.set_profile_item("Zayıf Noktalar / Riskler", "Uzun saatler odaklanıp mola vermemek, toplantı sonrası aksiyonları not almayı unutmak.", "risks")
    memory.set_profile_item("Kilit Kişiler & Ağ", "Ahmet (Yazılım Proje Ortağı), Zeynep (Tasarım Lideri).", "relationships")

    # Initial projects
    memory.add_project(
        name="Canlı AI Hayat Entegrasyonu (Life AI OS)",
        description="Mesajlar, ses kayıtları, takvim ve araştırmaların tek bir canlı yapay zeka merkezinde toplanması.",
        progress=45
    )

    # Initial tasks
    memory.add_task("Ahmet ile yapılacak Cuma günkü lansman toplantısı öncesi sunumu kontrol et", priority="high", category="task")
    memory.add_task("Google Calendar & Telegram Bot canlı ses entegrasyonu izinlerini aktifleştir", priority="medium", category="task")

    # Initial Proactive Recommendations
    memory.add_recommendation(
        rec_type="strategic",
        title="⚠️ Cuma Lansmanı Risk Uyarısı",
        advice="Ahmet ile yapılan son görüşmeye göre Cuma canlıya geçiş hedeflenmiş. Yazılım projesindeki aksiyonları bugün tamamlamazsanız Perşembe gecesi aşırı yüklenme riski oluşacak.",
        reasoning="Geçmiş görüşme logları ve Cuma hedef tarihi eşleştirildi.",
        priority="high"
    )
    
    memory.add_recommendation(
        rec_type="energy_coach",
        title="🧠 Odaklanma & Ritim Tavsiyesi",
        advice="Kişisel profilinize göre uzun saatler molasız çalışıyorsunuz. Bugün en kritik 1 görevi (Lansman kontrolü) bitirdikten sonra 30 dk zihinsel mola verin.",
        reasoning="Kullanıcı zayıf noktalar analizi.",
        priority="medium"
    )

    print("Proactive Persona & Recommendation Seed completed successfully!")

if __name__ == "__main__":
    seed()
