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

async def test_lite_stream():
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Chào bạn!")])
    ]
    # KHÔNG dùng thinking_config với flash-lite
    config = types.GenerateContentConfig(
        system_instruction="Bạn là Hoàng Nam (19 tuổi). Trả lời bằng tiếng Việt dưới 20 từ.",
        response_mime_type="application/json",
        response_schema=GeminiRoleplayOutput,
        max_output_tokens=300
    )
    res = await client.aio.models.generate_content_stream(
        model="gemini-flash-lite-latest",
        contents=contents,
        config=config
    )
    async for chunk in res:
        print(chunk.text or "", end="", flush=True)
    print("\nDone lite stream!")

asyncio.run(test_lite_stream())
