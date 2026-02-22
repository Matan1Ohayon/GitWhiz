import chromadb
import hashlib
import os
import httpx

# Persistent storage so indexed repos survive server restarts
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_data")
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

# Cohere Embed - free tier, reliable. Get key at dashboard.cohere.com
COHERE_URL = "https://api.cohere.com/v1/embed"
COHERE_MODEL = "embed-english-light-v3.0"  # 384 dims
BATCH_SIZE = 96  # Cohere max per call


def _encode(texts: list[str], input_type: str = "search_document") -> list[list[float]]:
    """Encode via Cohere API - free tier, zero local memory."""
    if not texts:
        return []
    key = os.getenv("COHERE_API_KEY")
    if not key:
        raise RuntimeError("COHERE_API_KEY required. Get a free key at dashboard.cohere.com")
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        with httpx.Client(timeout=90) as c:
            r = c.post(
                COHERE_URL,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"texts": batch, "model": COHERE_MODEL, "input_type": input_type},
            )
            r.raise_for_status()
            data = r.json()
        all_embeddings.extend(data["embeddings"])
    return all_embeddings


def _safe_collection_name(repo_name: str) -> str:
    return repo_name.replace("/", "_").replace("-", "_")


def get_or_create_collection(repo_name: str):
    """Creates or retrieves a collection by the repo name"""
    return client.get_or_create_collection(name=_safe_collection_name(repo_name))


def collection_exists(repo_name: str) -> bool:
    """Checks if a repo has already been indexed"""
    safe_name = _safe_collection_name(repo_name)
    try:
        col = client.get_collection(name=safe_name)
        return col.count() > 0
    except Exception:
        return False

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Splits text into small chunks"""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def index_files(repo_name: str, files: list) -> int:
    """Stores all files in ChromaDB"""
    collection = get_or_create_collection(repo_name)
    
    all_chunks = []
    all_embeddings = []
    all_ids = []
    all_metadata = []

    for file in files:
        chunks = chunk_text(file["content"])
        for i, chunk in enumerate(chunks):
            chunk_id = hashlib.md5(f"{file['path']}_{i}".encode()).hexdigest()
            all_chunks.append(chunk)
            all_ids.append(chunk_id)
            all_metadata.append({"path": file["path"]})

    if all_chunks:
        all_embeddings = _encode(all_chunks)
        collection.add(
            documents=all_chunks,
            embeddings=all_embeddings,
            ids=all_ids,
            metadatas=all_metadata
        )

    return len(all_chunks)

def search(repo_name: str, query: str, n_results: int = 5) -> list:
    """Searches for chunks relevant to the question"""
    collection = get_or_create_collection(repo_name)
    query_embedding = _encode([query], input_type="search_query")[0]
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    return [
        {"content": doc, "path": meta["path"]}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]