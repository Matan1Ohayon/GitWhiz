from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from routers import ingest, chat


app = FastAPI(title="GitWhiz API")

_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = ["*"] if not _raw else [o.strip() for o in _raw.split(",") if o.strip()]


class CORSPreflightMiddleware:
    """Pure ASGI - handle OPTIONS before anything else (Koyeb fix)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] == "OPTIONS":
            origin = b"*"
            if "*" not in ALLOWED_ORIGINS:
                for k, v in scope.get("headers", []):
                    if k == b"origin":
                        origin = v
                        break
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": [
                    [b"access-control-allow-origin", origin],
                    [b"access-control-allow-methods", b"GET, POST, OPTIONS"],
                    [b"access-control-allow-headers", b"*"],
                    [b"access-control-max-age", b"86400"],
                ],
            })
            await send({"type": "http.response.body", "body": b""})
            return
        await self.app(scope, receive, send)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CORSPreflightMiddleware)

app.include_router(ingest.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to GitWhiz!"}