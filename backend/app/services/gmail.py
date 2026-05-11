import base64
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

GMAIL_SEND_URL = "https://www.googleapis.com/gmail/v1/users/me/messages/send"


async def send_email(
    access_token: str,
    to_email: str,
    subject: str,
    body: str,
    sender_name: str,
    sender_email: str,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> dict:
    """
    Send email via Gmail API.

    Args:
        access_token: OAuth2 access token with gmail.send scope
        to_email: Recipient email
        subject: Email subject
        body: Email body (plain text)
        sender_name: Sender display name
        sender_email: Sender email
        attachments: List of (filename, content_bytes, content_type)

    Returns:
        Gmail API response with message ID
    """
    if attachments:
        message = MIMEMultipart()
        message.attach(MIMEText(body, "plain"))

        for filename, content, content_type in attachments:
            maintype, subtype = content_type.split("/", 1)
            attachment = MIMEBase(maintype, subtype)
            attachment.set_payload(content)
            base64.encodebytes(content)  # Validate content is bytes
            attachment.add_header("Content-Transfer-Encoding", "base64")
            attachment.set_payload(base64.b64encode(content).decode())
            attachment.add_header(
                "Content-Disposition", "attachment", filename=filename
            )
            message.attach(attachment)
    else:
        message = MIMEText(body, "plain")

    message["to"] = to_email
    message["from"] = f"{sender_name} <{sender_email}>"
    message["subject"] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GMAIL_SEND_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            json={"raw": raw},
        )

        if response.status_code != 200:
            error = response.json()
            error_msg = error.get("error", {}).get("message", "Gmail API error")
            return {"success": False, "error": error_msg}

        data = response.json()
        return {
            "success": True,
            "message_id": data.get("id", ""),
            "thread_id": data.get("threadId", ""),
        }
