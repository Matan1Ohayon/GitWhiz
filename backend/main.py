from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from routers import ingest,chat


app = FastAPI(title="GitWhiz API")

_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = ["*"] if not _raw else [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to GitWhiz!"}