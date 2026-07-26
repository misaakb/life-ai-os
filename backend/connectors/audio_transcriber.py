import os
from agent_router import agent_router

class AudioTranscriber:
    def transcribe_and_process(self, audio_filepath: str, source: str = "voice_note") -> dict:
        """
        Transcribes audio recordings or voice notes and passes the text to the Agent Router.
        """
        if not os.path.exists(audio_filepath):
            return {"error": "Audio file not found"}

        # In production with Whisper or Gemini API:
        # Transcribe audio file to text
        transcript_text = f"[Ses Kaydı İncelemesi]: {os.path.basename(audio_filepath)} işlendi. Yeni proje fikirleri ve yapılacaklar kaydedildi."

        # Pass to Agent Router for reasoning and task extraction
        result = agent_router.process_input(
            user_input=transcript_text,
            source=source,
            metadata={"file": audio_filepath}
        )
        return result

audio_transcriber = AudioTranscriber()
