import chromadb
from sentence_transformers import SentenceTransformer
import hashlib
import os

# Persistent storage so indexed repos survive server restarts
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_data")
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

_model = None


def _get_model():
    """Lazy load the model - only download on first use. Speeds up Render startup."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


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
            embedding = _get_model().encode(chunk).tolist()
            
            all_chunks.append(chunk)
            all_embeddings.append(embedding)
            all_ids.append(chunk_id)
            all_metadata.append({"path": file["path"]})

    if all_chunks:
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
    query_embedding = _get_model().encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    return [
        {"content": doc, "path": meta["path"]}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]