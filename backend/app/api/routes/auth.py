import secrets

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# In-memory session store (v1 — move to DB/Redis for production)
_sessions: dict[str, dict] = {}


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str


@router.get("/google/config")
async def google_config():
    """Return OAuth config for frontend to initiate the flow."""
    return {
        "client_id": settings.google_client_id,
        "scopes": "openid email profile https://www.googleapis.com/auth/gmail.send",
    }


@router.post("/google/exchange")
async def google_exchange(body: GoogleAuthRequest):
    """Exchange auth code from frontend for tokens. No redirects needed."""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": body.code,
                "grant_type": "authorization_code",
                "redirect_uri": body.redirect_uri,
            },
        )

        if token_response.status_code != 200:
            error = token_response.json()
            raise HTTPException(
                status_code=400,
                detail=error.get("error_description", "Failed to exchange code"),
            )

        tokens = token_response.json()

        # Get user info
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )

        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        userinfo = userinfo_response.json()

    # Create session
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = {
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token", ""),
        "email": userinfo.get("email", ""),
        "name": userinfo.get("name", ""),
        "picture": userinfo.get("picture", ""),
    }

    return {
        "session_token": session_id,
        "user": {
            "email": userinfo.get("email", ""),
            "name": userinfo.get("name", ""),
            "picture": userinfo.get("picture", ""),
        },
    }


@router.get("/me")
async def get_current_user(request: Request):
    """Get current user from session token."""
    session_id = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not session_id or session_id not in _sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = _sessions[session_id]
    return {
        "email": session["email"],
        "name": session["name"],
        "picture": session["picture"],
    }


@router.post("/logout")
async def logout(request: Request):
    """Clear session."""
    session_id = request.headers.get("Authorization", "").replace("Bearer ", "")
    _sessions.pop(session_id, None)
    return {"status": "logged out"}


def get_session(session_id: str) -> dict | None:
    """Get session data by ID. Used by other routes."""
    return _sessions.get(session_id)
