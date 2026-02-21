from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import anthropic
import os
import json
import logging
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.rag_service import search

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MAX_HISTORY = 10

SYSTEM_PROMPT = """You are an expert code assistant analyzing a GitHub repository.
Answer in the same language as the question (Hebrew or English).
Be concise and specific, reference file names when relevant."""


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    repo_name: str
    question: str = Field(max_length=1000)
    history: list[Message] = []


@router.post("/chat")
@limiter.limit("50/day")
async def chat(request: Request, body: ChatRequest):
    try:
        relevant_chunks = search(body.repo_name, body.question)
    except Exception as e:
        logger.error(f"Search error for repo '{body.repo_name}': {e}")
        raise HTTPException(status_code=500, detail="Failed to search the codebase.")

    sources = list({chunk["path"] for chunk in relevant_chunks})
    context = "\n\n".join([
        f"File: {chunk['path']}\n{chunk['content']}"
        for chunk in relevant_chunks
    ])

    messages = []
    for msg in body.history[-MAX_HISTORY:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({
        "role": "user",
        "content": f"""Here are the most relevant parts of the codebase for the question:

{context}

Question: {body.question}"""
    })

    def generate():
        try:
            with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'chunk', 'content': text})}\n\n"

            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
        except Exception as e:
            logger.error(f"Streaming error for repo '{body.repo_name}': {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to generate a response.'})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")