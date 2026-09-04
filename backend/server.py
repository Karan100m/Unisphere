import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection & indexes
from lib.db import client, ensure_indexes

# Import all routers
from routers.auth_router import router as auth_router
from routers.users_router import router as users_router
from routers.connections_router import router as connections_router
from routers.posts_router import router as posts_router
from routers.stories_router import router as stories_router
from routers.meet_router import router as meet_router
from routers.calls_router import router as calls_router
from routers.messages_router import router as messages_router
from routers.projects_router import router as projects_router
from routers.meetings_router import router as meetings_router
from routers.colleges_router import router as colleges_router
from routers.reputation_router import router as reputation_router
from routers.notifications_router import router as notifications_router
from routers.safety_router import router as safety_router
from routers.admin_router import router as admin_router
from routers.search_router import router as search_router
from routers.ai_router import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    yield
    client.close()


# Main FastAPI app
app = FastAPI(
    title="Unisphere API",
    description="Backend API for Unisphere - Student Social, Professional & Video Networking Platform",
    lifespan=lifespan,
)

# Main API router under /api prefix
api_router = APIRouter(prefix="/api")


# Basic health check endpoint
@api_router.get("/")
async def root():
    return {
        "status": "online",
        "service": "Unisphere API",
        "version": "1.0.0",
        "tagline": "Your Campus Is Bigger Than Your Campus",
    }


# Mount all sub-routers onto api_router
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(connections_router)
api_router.include_router(posts_router)
api_router.include_router(stories_router)
api_router.include_router(meet_router)
api_router.include_router(calls_router)
api_router.include_router(messages_router)
api_router.include_router(projects_router)
api_router.include_router(meetings_router)
api_router.include_router(colleges_router)
api_router.include_router(reputation_router)
api_router.include_router(notifications_router)
api_router.include_router(safety_router)
api_router.include_router(admin_router)
api_router.include_router(search_router)
api_router.include_router(ai_router)

# Include the router in the main app (MUST be last route configuration)
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("unisphere")
