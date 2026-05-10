import httpx

from app.config import settings

TAVILY_BASE_URL = "https://api.tavily.com"


async def search_news(company: str) -> dict:
    """Search for recent news, launches, and funding about a company."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{TAVILY_BASE_URL}/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": f"{company} recent news announcements product launch funding 2025 2026",
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True,
            },
        )

        if response.status_code != 200:
            return {"results": [], "error": f"Tavily API error: {response.status_code}"}

        data = response.json()
        results = []
        for item in data.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", "")[:500],
            })

        return {
            "results": results,
            "answer": data.get("answer", ""),
        }


async def search_jobs(company: str) -> dict:
    """Search for open job postings to infer company investment areas."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{TAVILY_BASE_URL}/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": f"{company} hiring jobs careers engineering AI ML 2025 2026",
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True,
            },
        )

        if response.status_code != 200:
            return {"results": [], "error": f"Tavily API error: {response.status_code}"}

        data = response.json()
        results = []
        for item in data.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "content": item.get("content", "")[:500],
            })

        return {
            "results": results,
            "answer": data.get("answer", ""),
        }


async def fetch_page(url: str) -> dict:
    """Fetch and return content from a specific URL."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return {"error": f"HTTP {response.status_code}"}
            text = response.text[:3000]
            return {"url": url, "content": text}
    except Exception as e:
        return {"error": str(e)}
