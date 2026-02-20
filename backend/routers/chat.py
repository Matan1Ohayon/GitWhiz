from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv
from services.rag_service import search

load_dotenv()

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ChatRequest(BaseModel):
    repo_name: str
    question: str

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Step 1 — Fetch relevant chunks from ChromaDB
        relevant_chunks = search(request.repo_name, request.question)
        
        context = "\n\n".join([
            f"File: {chunk['path']}\n{chunk['content']}"
            for chunk in relevant_chunks
        ])
        
        # Step 2 — Send to Claude with the context
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""You are an expert code assistant analyzing a GitHub repository.
                    
                    Here are the most relevant parts of the codebase for the question:

                    {context}

                    Question: {request.question}

                    Answer in the same language as the question (Hebrew or English).
                    Be concise and specific, reference file names when relevant."""
                }
            ]
        )
        
        return {
            "answer": message.content[0].text,
            "sources": [chunk["path"] for chunk in relevant_chunks]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))