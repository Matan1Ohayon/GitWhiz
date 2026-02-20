from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv
from services.github_service import parse_github_url, get_repo_files, get_file_content
from services.rag_service import index_files, search

load_dotenv()

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class RepoRequest(BaseModel):
    url: str

@router.post("/ingest")
async def ingest_repo(request: RepoRequest):
    try:
        owner, repo = parse_github_url(request.url)
        repo_name = f"{owner}/{repo}"

        files = await get_repo_files(owner, repo)

        contents = []
        for file in files:
            content = await get_file_content(file["download_url"])
            contents.append({
                "path": file["path"],
                "content": content
            })

        chunks_count = index_files(repo_name, contents)

        # יצירת Overview עם Claude
        overview = await generate_overview(repo_name, contents)

        return {
            "owner": owner,
            "repo": repo,
            "files_count": len(contents),
            "chunks_indexed": chunks_count,
            "status": "ready",
            "overview": overview
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def generate_overview(repo_name: str, files: list) -> dict:
    """מייצר Overview מלא של ה-repo עם Claude"""

    # לוקחים את הקבצים החשובים ביותר
    important_files = ["README.md", "package.json", "requirements.txt", "main.py", "App.jsx", "App.tsx"]
    context_files = [f for f in files if any(f["path"].endswith(imp) or f["path"] == imp for imp in important_files)]

    # אם לא מצאנו קבצים חשובים, לוקחים את 5 הראשונים
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
    except:
        return {"what": message.content[0].text, "stack": [], "architecture": "", "getting_started": []}