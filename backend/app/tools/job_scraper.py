import re

import httpx
from bs4 import BeautifulSoup

# Tags that contain job content on most boards (Greenhouse, Lever, Workday, etc.)
_CONTENT_SELECTORS = [
    "#content",
    ".job-description",
    ".job__description",
    ".posting-description",
    "[data-automation='job-description']",
    ".jobDescription",
    ".description",
    "article",
    "main",
]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

MAX_CHARS = 4000


async def scrape_job_posting(url: str) -> dict:
    """Fetch a job posting URL and return cleaned text. Returns error on failure."""
    if not url.startswith(("http://", "https://")):
        return {"text": "", "error": "Invalid URL — must start with http:// or https://"}

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=_HEADERS) as client:
            response = await client.get(url)

        if response.status_code >= 400:
            return {"text": "", "error": f"HTTP {response.status_code} fetching job URL"}

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove noise
        for tag in soup(["script", "style", "nav", "header", "footer", "noscript"]):
            tag.decompose()

        # Try known job content containers first
        text = ""
        for selector in _CONTENT_SELECTORS:
            node = soup.select_one(selector)
            if node:
                text = node.get_text(separator="\n", strip=True)
                if len(text) > 200:
                    break

        # Fall back to full body
        if len(text) < 200:
            body = soup.find("body")
            text = body.get_text(separator="\n", strip=True) if body else soup.get_text(separator="\n", strip=True)

        # Collapse excess whitespace / blank lines
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        text = text[:MAX_CHARS]

        return {"text": text, "error": None}

    except httpx.TimeoutException:
        return {"text": "", "error": "Timed out fetching job URL"}
    except Exception as e:
        return {"text": "", "error": f"Failed to fetch job posting: {str(e)[:100]}"}
