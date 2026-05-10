from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.outreach import router as outreach_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate all API keys are set
    required_keys = [
        ("GROQ_API_KEY", settings.groq_api_key),
        ("APOLLO_API_KEY", settings.apollo_api_key),
        ("TAVILY_API_KEY", settings.tavily_api_key),
        ("SUPABASE_URL", settings.supabase_url),
    ]
    for name, value in required_keys:
        if not value or value.endswith("_here"):
            raise RuntimeError(f"{name} not configured. Check .env file.")

    print("Cold Reach API started. All keys validated.")
    yield
    print("Cold Reach API shutting down.")


app = FastAPI(
    title="Cold Reach API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(outreach_router)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
