"""Notifications router: list notifications, unread counts, mark read."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user_required),
):
    notifs = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(limit).to_list(limit)
    return [NotificationResponse(**n) for n in notifs]


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}},
    )
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user_required)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"message": "All notifications marked as read"}
