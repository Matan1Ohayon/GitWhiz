import httpx
import base64
import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

def parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo from the URL"""
    parts = url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1]
    return owner, repo

async def get_repo_files(owner: str, repo: str, path: str = "") -> list:
    """Fetches all files from the repo"""
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS)
        response.raise_for_status()
        items = response.json()
    
    files = []
    for item in items:
        if item["type"] == "file" and item["name"].endswith(
            (".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".json", ".html", ".css")
        ):
            files.append(item)
        elif item["type"] == "dir" and item["name"] not in ("node_modules", ".git", "venv"):
            sub_files = await get_repo_files(owner, repo, item["path"])
            files.extend(sub_files)
    
    return files

async def get_file_content(download_url: str) -> str:
    """Reads the content of a specific file"""
    async with httpx.AsyncClient() as client:
        response = await client.get(download_url, headers=HEADERS)
        response.raise_for_status()
        return response.text