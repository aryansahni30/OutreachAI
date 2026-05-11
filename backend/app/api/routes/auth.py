import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.send",
]

# In-memory session store (v1 — move to DB/Redis for production)
_sessions: dict[str, dict] = {}
# CSRF state tokens
_pending_states: set[str] = set()


@router.get("/google/login")
async def google_login():
    """Redirect user to Google OAuth consent screen."""
    state = secrets.token_urlsafe(32)
    _pending_states.add(state)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(code: str, state: str):
    """Handle Google OAuth callback — exchange code for tokens."""
    if state not in _pending_states:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    _pending_states.discard(state)

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")

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

    # Redirect to frontend with session token
    frontend_url = settings.frontend_url
    return RedirectResponse(f"{frontend_url}?session={session_id}")


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
