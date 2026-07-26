import os
import stat
import shutil
from pathlib import Path

SCRATCH_DIR = Path(r"C:\Users\Misa\.gemini\antigravity\scratch")
KEEP = {"life-ai-os", "ytmusic-desktop"}

def remove_readonly(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)

def cleanup():
    removed = []
    kept = []

    for item in SCRATCH_DIR.iterdir():
        if item.is_dir():
            if item.name in KEEP:
                kept.append(item.name)
            else:
                try:
                    shutil.rmtree(item, onerror=remove_readonly)
                    removed.append(item.name)
                except Exception as e:
                    print(f"Error removing {item.name}: {e}")

    print("REMOVED DIRS:", removed)
    print("KEPT DIRS:", kept)

if __name__ == "__main__":
    cleanup()
