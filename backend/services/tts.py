import threading
import traceback

try:
    import pyttsx3
    _engine = pyttsx3.init()
except Exception:
    _engine = None


def speak(text: str, lang: str = "en") -> None:
    if not text:
        return

    def _do_speak(t):
        try:
            if _engine is None:
                print(f"[TTS] {t}")
            else:
                _engine.say(t)
                _engine.runAndWait()
        except Exception:
            print(f"TTS failed for text: {t}")
            traceback.print_exc()

    thread = threading.Thread(target=_do_speak, args=(text, ), daemon=True)
    thread.start()
