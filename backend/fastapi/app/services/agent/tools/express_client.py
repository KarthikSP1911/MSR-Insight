"""Shared helper for calling Express's shared-secret-gated /api/agent/internal/*
routes -- the only path any agent tool takes to reach outside the system."""
import httpx

from app.core.config import settings


def call_express_internal(path: str, payload: dict) -> dict:
    resp = httpx.post(
        f"{settings.EXPRESS_BASE_URL}/api/agent/internal/{path}",
        json=payload,
        headers={"x-agent-gateway-secret": settings.AGENT_GATEWAY_SECRET},
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()
