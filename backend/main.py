from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingest,chat


app = FastAPI(title="GitWhiz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to GitWhiz!"}