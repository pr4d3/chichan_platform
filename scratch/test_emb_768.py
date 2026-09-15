import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv

load_dotenv("backend/.env", override=True)
from google import genai
from google.genai import types

api_key = os.getenv("AI_API_KEY")
client = genai.Client(api_key=api_key)

async def test_emb():
    res = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents="An toàn mạng",
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    vec = res.embeddings[0].values
    print("Vector len with output_dimensionality=768:", len(vec))

asyncio.run(test_emb())
