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

async def test_lite():
    model_name = "gemini-3.5-flash-lite"
    print(f"Testing {model_name}...")
    try:
        config = types.GenerateContentConfig(
            system_instruction="Bạn là bạn tốt. Trả lời dưới 20 từ.",
            response_mime_type="application/json",
            response_schema=GeminiRoleplayOutput,
            max_output_tokens=300,
            thinking_config=types.ThinkingConfig(thinking_budget=0)
        )
        res = await client.aio.models.generate_content(
            model=model_name,
            contents="Chào cậu!",
            config=config
        )
        print("Success with", model_name, ":", res.text)
    except Exception as e:
        print("Error with", model_name, ":", e)

asyncio.run(test_lite())
