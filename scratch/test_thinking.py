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

async def test_stream():
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Chào bạn, mình là học sinh.")])
    ]
    # In Gemini 2.5/3.x, thinkingConfig can be set or max_output_tokens increased
    config = types.GenerateContentConfig(
        system_instruction="Bạn là Hoàng Nam (19 tuổi). Hãy trả lời bằng tiếng Việt dưới 30 từ.",
        response_mime_type="application/json",
        response_schema=GeminiRoleplayOutput,
        max_output_tokens=400,
        thinking_config=types.ThinkingConfig(thinking_budget=0) # Tắt thinking để response nhanh và không tốn token
    )
    res = await client.aio.models.generate_content_stream(
        model="gemini-3.6-flash",
        contents=contents,
        config=config
    )
    full = ""
    async for chunk in res:
        txt = chunk.text or ""
        full += txt
        print(txt, end="", flush=True)
    print("\nFull output:", full)

asyncio.run(test_stream())
