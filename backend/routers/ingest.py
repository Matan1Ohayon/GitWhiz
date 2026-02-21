from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
import anthropic
import os
import re
import logging
from dotenv import load_dotenv
from services.github_service import parse_github_url, get_repo_files, get_file_content
from services.rag_service import index_files, search, collection_exists

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

GITHUB_URL_PATTERN = re.compile(r"^https?://github\.com/[\w.\-]+/[\w.\-]+/?$")

class RepoRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        if not GITHUB_URL_PATTERN.match(v.strip()):
            raise ValueError("Invalid GitHub URL. Expected format: https://github.com/owner/repo")
        return v.strip()

@router.post("/ingest")
@limiter.limit("5/day")
async def ingest_repo(request: Request, body: RepoRequest):
    try:
        owner, repo = parse_github_url(body.url)
        repo_name = f"{owner}/{repo}"

        if collection_exists(repo_name):
            overview = await generate_overview_from_cache(repo_name)
            return {
                "owner": owner,
                "repo": repo,
                "files_count": 0,
                "chunks_indexed": 0,
                "status": "already_indexed",
                "overview": overview
            }

        files = await get_repo_files(owner, repo)

        contents = []
        for file in files:
            content = await get_file_content(file["download_url"])
            contents.append({
                "path": file["path"],
                "content": content
            })

        chunks_count = index_files(repo_name, contents)
        overview = await generate_overview(repo_name, contents)

        return {
            "owner": owner,
            "repo": repo,
            "files_count": len(contents),
            "chunks_indexed": chunks_count,
            "status": "ready",
            "overview": overview
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingest error for URL '{body.url}': {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze the repository. Please check the URL and try again.")


async def generate_overview(repo_name: str, files: list) -> dict:
    """Generates a full overview of the repo with Claude"""

    # Select the most important files
    important_files = ["README.md", "package.json", "requirements.txt", "main.py", "App.jsx", "App.tsx"]
    context_files = [f for f in files if any(f["path"].endswith(imp) or f["path"] == imp for imp in important_files)]

    # If no important files are found, take the first 5 files
    if not context_files:
        context_files = files[:5]

    context = "\n\n".join([
        f"File: {f['path']}\n{f['content'][:1000]}"
        for f in context_files
    ])

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze this GitHub repository and return a JSON response with exactly this structure:
                {{
                "what": "2-3 sentences explaining what this project does",
                "stack": ["technology1", "technology2", "technology3"],
                "architecture": "2-3 sentences explaining how the project is structured",
                "getting_started": [
                    "Step 1: ...",
                    "Step 2: ...",
                    "Step 3: ..."
                ]
                }}

                Repository files:
                {context}

                Return ONLY the JSON, no markdown, no explanation."""
            }
        ]
    )

    import json
    try:
        return json.loads(message.content[0].text)
    except Exception:
        return {"what": message.content[0].text, "stack": [], "architecture": "", "getting_started": []}


async def generate_overview_from_cache(repo_name: str) -> dict:
    """Generates an overview from already-indexed chunks (no re-fetching from GitHub)"""
    chunks = search(repo_name, "project overview architecture tech stack", n_results=10)
    context = "\n\n".join([
        f"File: {chunk['path']}\n{chunk['content']}"
        for chunk in chunks
    ])

    import json
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze this GitHub repository and return a JSON response with exactly this structure:
                {{
                "what": "2-3 sentences explaining what this project does",
                "stack": ["technology1", "technology2", "technology3"],
                "architecture": "2-3 sentences explaining how the project is structured",
                "getting_started": [
                    "Step 1: ...",
                    "Step 2: ...",
                    "Step 3: ..."
                ]
                }}

                Repository files:
                {context}

                Return ONLY the JSON, no markdown, no explanation."""
            }
        ]
    )

    try:
        return json.loads(message.content[0].text)
    except Exception:
        return {"what": message.content[0].text, "stack": [], "architecture": "", "getting_started": []}