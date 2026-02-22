from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import os
from routers import ingest, chat


app = FastAPI(title="GitWhiz API")

_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = ["*"] if not _raw else [o.strip() for o in _raw.split(",") if o.strip()]


class CORSPreflightMiddleware(BaseHTTPMiddleware):
    """Handle OPTIONS preflight before CORS - fixes 400 on some proxies."""

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            origin = "*" if "*" in ALLOWED_ORIGINS else request.headers.get("origin", "*")
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                },
            )
        return await call_next(request)


app.add_middleware(CORSPreflightMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to GitWhiz!"}