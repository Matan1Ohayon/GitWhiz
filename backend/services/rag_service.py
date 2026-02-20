import chromadb
from sentence_transformers import SentenceTransformer
import hashlib

# Initialize ChromaDB and the embeddings model
client = chromadb.Client()
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_or_create_collection(repo_name: str):
    """Creates or retrieves a collection by the repo name"""
    safe_name = repo_name.replace("/", "_").replace("-", "_")
    return client.get_or_create_collection(name=safe_name)

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
            embedding = model.encode(chunk).tolist()
            
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
    query_embedding = model.encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    return [
        {"content": doc, "path": meta["path"]}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]