import httpx

from app.config import settings

APOLLO_BASE_URL = "https://api.apollo.io"


async def search_apollo(company: str, titles: list[str] | None = None) -> dict:
    """Search Apollo.io for contacts at a company, filtered by titles."""
    if titles is None:
        titles = [
            "VP of Engineering",
            "Engineering Manager",
            "Head of AI",
            "Head of Engineering",
            "CTO",
            "Director of Engineering",
            "Hiring Manager",
        ]

    async with httpx.AsyncClient(timeout=30) as client:
        # Try people search (requires paid plan)
        response = await client.post(
            f"{APOLLO_BASE_URL}/api/v1/mixed_people/search",
            headers={
                "Content-Type": "application/json",
                "x-api-key": settings.apollo_api_key,
            },
            json={
                "q_organization_name": company,
                "person_titles": titles,
                "page": 1,
                "per_page": 5,
            },
        )

        if response.status_code != 200:
            error_data = response.json() if response.status_code < 500 else {}
            error_msg = error_data.get("error", f"Apollo API error: {response.status_code}")
            return {"contacts": [], "error": error_msg}

        data = response.json()
        people = data.get("people", [])

        contacts = []
        for person in people:
            contacts.append({
                "name": person.get("name", "Unknown"),
                "title": person.get("title", "Unknown"),
                "email": person.get("email", ""),
                "linkedin_url": person.get("linkedin_url", ""),
            })

        return {"contacts": contacts}


async def verify_email(email: str) -> dict:
    """Basic email format and domain verification."""
    if not email or "@" not in email:
        return {"valid": False, "reason": "Invalid email format"}

    domain = email.split("@")[1]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.head(f"https://{domain}", follow_redirects=True)
            domain_exists = response.status_code < 500
    except Exception:
        domain_exists = True  # Assume valid if we can't check

    return {"valid": True, "email": email, "domain_exists": domain_exists}
