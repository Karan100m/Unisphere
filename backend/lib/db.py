"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "app")]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [
        IndexModel([("id", ASCENDING)], name="user_id_unique", unique=True),
        IndexModel([("email", ASCENDING)], name="user_email_unique", unique=True),
        IndexModel([("college", ASCENDING)], name="user_college"),
        IndexModel([("role", ASCENDING)], name="user_role"),
        IndexModel([("created_at", DESCENDING)], name="user_created_at"),
    ],
    "connections": [
        IndexModel([("id", ASCENDING)], name="conn_id_unique", unique=True),
        IndexModel([("requester_id", ASCENDING), ("recipient_id", ASCENDING)], name="conn_pair_idx"),
        IndexModel([("status", ASCENDING)], name="conn_status"),
    ],
    "posts": [
        IndexModel([("id", ASCENDING)], name="post_id_unique", unique=True),
        IndexModel([("created_at", DESCENDING)], name="post_created_desc"),
        IndexModel([("author_id", ASCENDING)], name="post_author"),
        IndexModel([("category", ASCENDING)], name="post_category"),
    ],
    "post_likes": [
        IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)], name="like_unique", unique=True),
    ],
    "post_comments": [
        IndexModel([("id", ASCENDING)], name="comment_id_unique", unique=True),
        IndexModel([("post_id", ASCENDING), ("created_at", ASCENDING)], name="comment_post_created"),
    ],
    "post_bookmarks": [
        IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)], name="bookmark_unique", unique=True),
    ],
    "stories": [
        IndexModel([("id", ASCENDING)], name="story_id_unique", unique=True),
        IndexModel([("expires_at", ASCENDING)], name="story_expires"),
        IndexModel([("created_at", DESCENDING)], name="story_created_desc"),
    ],
    "conversations": [
        IndexModel([("id", ASCENDING)], name="conv_id_unique", unique=True),
        IndexModel([("participants", ASCENDING)], name="conv_participants"),
        IndexModel([("last_message_at", DESCENDING)], name="conv_last_msg_desc"),
    ],
    "messages": [
        IndexModel([("id", ASCENDING)], name="msg_id_unique", unique=True),
        IndexModel([("conversation_id", ASCENDING), ("created_at", ASCENDING)], name="msg_conv_created"),
    ],
    "projects": [
        IndexModel([("id", ASCENDING)], name="project_id_unique", unique=True),
        IndexModel([("owner_id", ASCENDING)], name="project_owner"),
        IndexModel([("category", ASCENDING)], name="project_category"),
        IndexModel([("created_at", DESCENDING)], name="project_created_desc"),
    ],
    "project_requests": [
        IndexModel([("id", ASCENDING)], name="proj_req_id_unique", unique=True),
        IndexModel([("project_id", ASCENDING)], name="proj_req_project"),
        IndexModel([("applicant_id", ASCENDING)], name="proj_req_applicant"),
    ],
    "meetings": [
        IndexModel([("id", ASCENDING)], name="meeting_id_unique", unique=True),
        IndexModel([("host_id", ASCENDING)], name="meeting_host"),
        IndexModel([("guest_id", ASCENDING)], name="meeting_guest"),
        IndexModel([("meeting_date", ASCENDING)], name="meeting_date"),
    ],
    "availabilities": [
        IndexModel([("user_id", ASCENDING)], name="avail_user_unique", unique=True),
    ],
    "colleges": [
        IndexModel([("id", ASCENDING)], name="college_id_unique", unique=True),
        IndexModel([("name", ASCENDING)], name="college_name_unique", unique=True),
    ],
    "reputation_reviews": [
        IndexModel([("id", ASCENDING)], name="review_id_unique", unique=True),
        IndexModel([("target_user_id", ASCENDING)], name="review_target"),
        IndexModel([("reviewer_id", ASCENDING), ("target_user_id", ASCENDING)], name="reviewer_target_unique", unique=True),
    ],
    "notifications": [
        IndexModel([("id", ASCENDING)], name="notif_id_unique", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="notif_user_created"),
    ],
    "reports": [
        IndexModel([("id", ASCENDING)], name="report_id_unique", unique=True),
        IndexModel([("status", ASCENDING)], name="report_status"),
        IndexModel([("created_at", DESCENDING)], name="report_created"),
    ],
    "blocks": [
        IndexModel([("blocker_id", ASCENDING), ("blocked_user_id", ASCENDING)], name="block_unique", unique=True),
    ],
    "meet_sessions": [
        IndexModel([("id", ASCENDING)], name="meet_sess_id_unique", unique=True),
        IndexModel([("created_at", DESCENDING)], name="meet_sess_created"),
    ],
    "call_sessions": [
        IndexModel([("id", ASCENDING)], name="call_sess_id_unique", unique=True),
        IndexModel([("caller_id", ASCENDING)], name="call_sess_caller"),
        IndexModel([("recipient_id", ASCENDING)], name="call_sess_recipient"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document.get("name"), exc)
