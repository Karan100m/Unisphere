"""Safety and moderation router: report content/user, block/unblock users."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    ReportCreate,
    ReportResponse,
    BlockRequest,
    BlockedUserResponse,
)

router = APIRouter(prefix="/safety", tags=["safety"])


@router.post("/report", response_model=ReportResponse)
async def submit_report(
    input_data: ReportCreate,
    current_user: dict = Depends(get_current_user_required),
):
    report_id = str(uuid.uuid4())
    target_name = ""

    # Fetch target details based on target_type
    if input_data.target_type == "user":
        u = await db.users.find_one({"id": input_data.target_id})
        target_name = u["full_name"] if u else "User"
    elif input_data.target_type == "post":
        p = await db.posts.find_one({"id": input_data.target_id})
        target_name = f"Post: {p['content'][:30]}..." if p else "Post"
        if p:
            await db.posts.update_one({"id": input_data.target_id}, {"$set": {"is_reported": True}})
    elif input_data.target_type == "comment":
        c = await db.post_comments.find_one({"id": input_data.target_id})
        target_name = f"Comment: {c['content'][:30]}..." if c else "Comment"
    elif input_data.target_type == "story":
        s = await db.stories.find_one({"id": input_data.target_id})
        target_name = f"Story by {s.get('user_name', 'Student')}" if s else "Story"

    report_dict = {
        "id": report_id,
        "reporter_id": current_user["id"],
        "reporter_name": current_user["full_name"],
        "target_type": input_data.target_type,
        "target_id": input_data.target_id,
        "target_name": target_name,
        "reason": input_data.reason,
        "details": input_data.details,
        "status": "pending",
        "action_notes": "",
        "created_at": datetime.utcnow(),
    }
    await db.reports.insert_one(report_dict)
    return ReportResponse(**report_dict)


@router.post("/block")
async def block_user(
    input_data: BlockRequest,
    current_user: dict = Depends(get_current_user_required),
):
    if input_data.blocked_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot block yourself.")

    target = await db.users.find_one({"id": input_data.blocked_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Student not found.")

    await db.blocks.update_one(
        {"blocker_id": current_user["id"], "blocked_user_id": input_data.blocked_user_id},
        {"$set": {"blocker_id": current_user["id"], "blocked_user_id": input_data.blocked_user_id, "created_at": datetime.utcnow()}},
        upsert=True,
    )

    # Break connection if exists
    await db.connections.delete_many({
        "$or": [
            {"requester_id": current_user["id"], "recipient_id": input_data.blocked_user_id},
            {"requester_id": input_data.blocked_user_id, "recipient_id": current_user["id"]},
        ]
    })

    return {"message": f"Successfully blocked {target['full_name']}"}


@router.post("/unblock")
async def unblock_user(
    input_data: BlockRequest,
    current_user: dict = Depends(get_current_user_required),
):
    await db.blocks.delete_one({"blocker_id": current_user["id"], "blocked_user_id": input_data.blocked_user_id})
    return {"message": "User unblocked"}


@router.get("/blocked-users", response_model=List[BlockedUserResponse])
async def get_blocked_users(current_user: dict = Depends(get_current_user_required)):
    blocks = await db.blocks.find({"blocker_id": current_user["id"]}).to_list(100)
    result = []
    for b in blocks:
        u = await db.users.find_one({"id": b["blocked_user_id"]})
        if u:
            result.append(BlockedUserResponse(
                blocked_user_id=u["id"],
                full_name=u["full_name"],
                avatar_url=u.get("avatar_url", ""),
                college=u.get("college", ""),
                created_at=b.get("created_at", datetime.utcnow()),
            ))
    return result
