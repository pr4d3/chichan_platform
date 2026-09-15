import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv

load_dotenv("backend/.env", override=True)
from google import genai
from google.genai import types
from schemas.roleplay_schema import GeminiRoleplayOutput

api_key = os.getenv("AI_API_KEY")
client = genai.Client(api_key=api_key)

async def test_models():
    models_to_test = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-3.6-flash"]
    for m in models_to_test:
        print(f"\nTesting {m}...")
        try:
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiRoleplayOutput,
                max_output_tokens=300
            )
            res = await client.aio.models.generate_content(
                model=m,
                contents="Chào bạn!",
                config=config
            )
            print(f"Success with {m}:", res.text[:80])
        except Exception as e:
            print(f"Failed with {m}:", str(e)[:100])

asyncio.run(test_models())
