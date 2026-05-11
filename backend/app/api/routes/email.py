from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.api.routes.auth import get_session
from app.services.gmail import send_email

router = APIRouter(prefix="/api/email", tags=["email"])

MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/send")
async def send_outreach_email(
    request: Request,
    to_email: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    attachments: list[UploadFile] = File(default=[]),
):
    """Send email via user's Gmail with optional attachments."""
    session_id = request.headers.get("Authorization", "").replace("Bearer ", "")
    session = get_session(session_id)

    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated. Sign in with Google first.")

    # Process attachments
    file_attachments: list[tuple[str, bytes, str]] = []
    for file in attachments:
        content = await file.read()
        if len(content) > MAX_ATTACHMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Attachment '{file.filename}' exceeds 10MB limit",
            )
        file_attachments.append((
            file.filename or "attachment",
            content,
            file.content_type or "application/octet-stream",
        ))

    result = await send_email(
        access_token=session["access_token"],
        to_email=to_email,
        subject=subject,
        body=body,
        sender_name=session["name"],
        sender_email=session["email"],
        attachments=file_attachments if file_attachments else None,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
