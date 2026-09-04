"""Calendly-style Meeting Scheduling Router."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    AvailabilitySet,
    AvailabilityResponse,
    MeetingBookRequest,
    MeetingResponse,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("/availability/{user_id}", response_model=AvailabilityResponse)
async def get_user_availability(user_id: str):
    avail = await db.availabilities.find_one({"user_id": user_id})
    if not avail:
        # Generate default availability
        return AvailabilityResponse(
            user_id=user_id,
            topics=["Project Collaboration", "Career Discussion", "Networking", "Hackathon Collab"],
            timezone="UTC",
            weekly_schedule=[
                {
                    "day": day,
                    "active": True,
                    "slots": [
                        {"start_time": "14:00", "end_time": "14:30", "is_booked": False},
                        {"start_time": "15:00", "end_time": "15:30", "is_booked": False},
                        {"start_time": "16:00", "end_time": "16:30", "is_booked": False},
                        {"start_time": "17:00", "end_time": "17:30", "is_booked": False},
                    ]
                }
                for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            ]
        )
    return AvailabilityResponse(**avail)


@router.post("/availability", response_model=AvailabilityResponse)
async def set_my_availability(
    input_data: AvailabilitySet,
    current_user: dict = Depends(get_current_user_required),
):
    avail_dict = {
        "user_id": current_user["id"],
        "topics": input_data.topics,
        "timezone": input_data.timezone,
        "weekly_schedule": [d.model_dump() for d in input_data.weekly_schedule],
    }
    await db.availabilities.update_one(
        {"user_id": current_user["id"]},
        {"$set": avail_dict},
        upsert=True,
    )
    return AvailabilityResponse(**avail_dict)


@router.post("/book", response_model=MeetingResponse)
async def book_meeting(
    input_data: MeetingBookRequest,
    current_user: dict = Depends(get_current_user_required),
):
    if input_data.host_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot schedule a meeting with yourself.")

    host = await db.users.find_one({"id": input_data.host_id})
    if not host:
        raise HTTPException(status_code=404, detail="Host student not found.")

    meeting_id = str(uuid.uuid4())
    meeting_link = f"https://meet.unisphere.edu/room/{meeting_id[:8]}"
    now = datetime.utcnow()

    meeting_dict = {
        "id": meeting_id,
        "host_id": input_data.host_id,
        "host_name": host["full_name"],
        "host_avatar": host.get("avatar_url", ""),
        "host_college": host.get("college", ""),
        "guest_id": current_user["id"],
        "guest_name": current_user["full_name"],
        "guest_avatar": current_user.get("avatar_url", ""),
        "guest_college": current_user.get("college", ""),
        "title": input_data.title,
        "description": input_data.description,
        "topic": input_data.topic,
        "meeting_date": input_data.meeting_date,
        "start_time": input_data.start_time,
        "end_time": input_data.end_time,
        "meeting_link": meeting_link,
        "status": "upcoming",
        "created_at": now,
    }
    await db.meetings.insert_one(meeting_dict)

    # Notify host
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": input_data.host_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "meeting_booked",
        "title": "New Meeting Scheduled",
        "message": f"{current_user['full_name']} scheduled a meeting '{input_data.title}' for {input_data.meeting_date} at {input_data.start_time}.",
        "link": "/meetings",
        "is_read": False,
        "created_at": now,
    })

    return MeetingResponse(**meeting_dict)


@router.get("/my", response_model=List[MeetingResponse])
async def get_my_meetings(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user_required),
):
    user_id = current_user["id"]
    query = {"$or": [{"host_id": user_id}, {"guest_id": user_id}]}
    if status_filter and status_filter != "all":
        query["status"] = status_filter

    meetings = await db.meetings.find(query).sort("meeting_date", 1).to_list(200)
    return [MeetingResponse(**m) for m in meetings]


@router.post("/{meeting_id}/cancel")
async def cancel_meeting(
    meeting_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    meeting = await db.meetings.find_one({
        "id": meeting_id,
        "$or": [{"host_id": current_user["id"]}, {"guest_id": current_user["id"]}],
    })
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    await db.meetings.update_one({"id": meeting_id}, {"$set": {"status": "cancelled"}})

    # Notify the other party
    other_id = meeting["guest_id"] if meeting["host_id"] == current_user["id"] else meeting["host_id"]
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": other_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "meeting_cancelled",
        "title": "Meeting Cancelled",
        "message": f"{current_user['full_name']} cancelled the meeting '{meeting['title']}'.",
        "link": "/meetings",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    return {"message": "Meeting cancelled"}


@router.post("/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    meeting = await db.meetings.find_one({
        "id": meeting_id,
        "$or": [{"host_id": current_user["id"]}, {"guest_id": current_user["id"]}],
    })
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    await db.meetings.update_one({"id": meeting_id}, {"$set": {"status": "completed"}})
    return {"message": "Meeting marked as completed"}
