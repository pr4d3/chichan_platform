import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv

load_dotenv("backend/.env", override=True)
from google import genai

api_key = os.getenv("AI_API_KEY")
client = genai.Client(api_key=api_key)

print("Listing available models for this API key:")
try:
    for m in client.models.list():
        # filter models that support generateContent
        supported = getattr(m, "supported_generation_methods", []) or []
        print(f" - {m.name} | Methods: {supported}")
except Exception as e:
    print(f"Error listing models: {e}")
