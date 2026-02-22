from fastapi import FastAPI
import os
from routers import ingest, chat


app = FastAPI(title="GitWhiz API")

_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = ["*"] if not _raw else [o.strip() for o in _raw.split(",") if o.strip()]


def _get_origin(scope: dict) -> bytes:
    for k, v in scope.get("headers", []):
        if k == b"origin":
            return v
    return b"*"


def _cors_headers(scope: dict) -> list:
    origin = _get_origin(scope)
    if "*" in ALLOWED_ORIGINS:
        origin = b"*"
    else:
        allowed = [o.encode() if isinstance(o, str) else o for o in ALLOWED_ORIGINS]
        if origin not in allowed and allowed:
            origin = allowed[0]
    return [
        [b"access-control-allow-origin", origin],
        [b"access-control-allow-methods", b"GET, POST, OPTIONS"],
        [b"access-control-allow-headers", b"*"],
    ]


class CORSMiddleware:
    """Add CORS headers to every response. Handles OPTIONS and all other methods."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if scope["method"] == "OPTIONS":
            await send({
                "type": "http.response.start",
                "status": 200,
                "headers": _cors_headers(scope) + [[b"access-control-max-age", b"86400"]],
            })
            await send({"type": "http.response.body", "body": b""})
            return

        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message.get("headers", [])) + _cors_headers(scope)
            await send(message)

        await self.app(scope, receive, send_with_cors)


app.add_middleware(CORSMiddleware)

app.include_router(ingest.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to GitWhiz!"}