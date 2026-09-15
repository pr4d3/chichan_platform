import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv

load_dotenv("backend/.env", override=True)
from google import genai
from schemas.roleplay_schema import GeminiRoleplayOutput

api_key = os.getenv("AI_API_KEY")
client = genai.Client(api_key=api_key)

async def test_gen():
    print("Testing generate_content with gemini-3.6-flash...")
    res = await client.aio.models.generate_content(
        model="gemini-3.6-flash",
        contents="Xin chào, bạn là ai?"
    )
    print("Text response:", res.text)

    print("\nTesting generate_content_stream with gemini-3.6-flash...")
    stream_response = await client.aio.models.generate_content_stream(
        model="gemini-3.6-flash",
        contents="Kể 1 câu chuyện cực ngắn 1 câu."
    )
    async for chunk in stream_response:
        print(chunk.text, end="", flush=True)
    print("\nStream finished!")

    print("\nTesting structured output...")
    res_struct = await client.aio.models.generate_content(
        model="gemini-3.6-flash",
        contents="Người chơi nói: Chào bạn!",
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GeminiRoleplayOutput
        )
    )
    print("Structured response:", res_struct.text)

    print("\nTesting embedding...")
    emb = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents="Kiểm tra an toàn thông tin"
    )
    print("Embedding size:", len(emb.embeddings[0].values))

asyncio.run(test_gen())
