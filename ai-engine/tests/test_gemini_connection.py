
import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

print("API key loaded:", bool(api_key))
print("Model:", model)

if not api_key:
    raise SystemExit("GEMINI_API_KEY missing from .env")

client = genai.Client(api_key=api_key)

print("\nSending request to Gemini...")
start = time.time()

try:
    response = client.models.generate_content(
        model=model,
        contents="Reply with exactly GEMINI_OK"
    )

    print("\nSUCCESS")
    print("Response:", response.text)
    print("Elapsed:", round(time.time() - start, 2), "seconds")

except Exception as exc:
    print("\nFAILED")
    print("Exception:", type(exc).__name__)
    print("Details:", str(exc))
    print("Elapsed:", round(time.time() - start, 2), "seconds")
