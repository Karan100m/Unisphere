"""Stories router: 24h stories, reaction, reply, viewer tracking."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from lib.db import db
from lib.auth import get_current_user_required, get_current_user_optional
from models.schemas import (
    StoryCreate,
    StoryResponse,
    UserStoriesGroup,
    StoryReactionRequest,
    StoryReplyRequest,
)

router = APIRouter(prefix="/stories", tags=["stories"])


@router.get("", response_model=List[UserStoriesGroup])
async def get_stories(current_user: Optional[dict] = Depends(get_current_user_optional)):
    now = datetime.utcnow()
    active_stories = await db.stories.find({"expires_at": {"$gt": now}}).sort("created_at", 1).to_list(200)

    user_id = current_user["id"] if current_user else None

    # Group stories by user_id
    grouped: dict[str, list] = {}
    for story in active_stories:
        views = story.get("views", [])
        story["views_count"] = len(views)
        story["viewed_by_me"] = user_id in views if user_id else False

        uid = story["user_id"]
        if uid not in grouped:
            grouped[uid] = []
        grouped[uid].append(story)

    result: List[UserStoriesGroup] = []
    for uid, stories_list in grouped.items():
        first_story = stories_list[0]
        has_unseen = any(not s.get("viewed_by_me", False) for s in stories_list)
        result.append(UserStoriesGroup(
            user_id=uid,
            user_name=first_story["user_name"],
            user_avatar=first_story["user_avatar"],
            user_college=first_story["user_college"],
            stories=[StoryResponse(**s) for s in stories_list],
            has_unseen=has_unseen,
        ))

    # Put current user's stories first, then unseen stories
    if user_id:
        result.sort(key=lambda g: (0 if g.user_id == user_id else (1 if g.has_unseen else 2)))
    return result


@router.post("", response_model=StoryResponse)
async def create_story(
    input_data: StoryCreate,
    current_user: dict = Depends(get_current_user_required),
):
    story_id = str(uuid.uuid4())
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=24)

    story_dict = {
        "id": story_id,
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_avatar": current_user.get("avatar_url", ""),
        "user_college": current_user.get("college", ""),
        "media_url": input_data.media_url,
        "media_type": input_data.media_type,
        "caption": input_data.caption,
        "text_background_color": input_data.text_background_color,
        "views": [],
        "reactions": [],
        "created_at": now,
        "expires_at": expires_at,
    }
    await db.stories.insert_one(story_dict)

    story_dict["views_count"] = 0
    story_dict["viewed_by_me"] = True
    return StoryResponse(**story_dict)


@router.post("/{story_id}/view")
async def track_story_view(
    story_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found or expired")

    await db.stories.update_one(
        {"id": story_id},
        {"$addToSet": {"views": current_user["id"]}},
    )
    return {"message": "View recorded"}


@router.post("/{story_id}/react")
async def react_to_story(
    story_id: str,
    input_data: StoryReactionRequest,
    current_user: dict = Depends(get_current_user_required),
):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found or expired")

    reaction = {
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "emoji": input_data.emoji,
        "created_at": datetime.utcnow(),
    }
    await db.stories.update_one(
        {"id": story_id},
        {"$push": {"reactions": reaction}},
    )

    # Notify story owner
    if story["user_id"] != current_user["id"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": story["user_id"],
            "actor_id": current_user["id"],
            "actor_name": current_user["full_name"],
            "actor_avatar": current_user.get("avatar_url", ""),
            "type": "story_reply",
            "title": "Story Reaction",
            "message": f"{current_user['full_name']} reacted {input_data.emoji} to your story.",
            "link": "/feed",
            "is_read": False,
            "created_at": datetime.utcnow(),
        })

    return {"message": "Reaction added", "reaction": reaction}


@router.post("/{story_id}/reply")
async def reply_to_story(
    story_id: str,
    input_data: StoryReplyRequest,
    current_user: dict = Depends(get_current_user_required),
):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found or expired")

    # Find or create conversation with story author
    other_user_id = story["user_id"]
    if other_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot reply to your own story as a message.")

    conv = await db.conversations.find_one({
        "participants": {"$all": [current_user["id"], other_user_id]}
    })
    if not conv:
        conv_id = str(uuid.uuid4())
        conv = {
            "id": conv_id,
            "participants": [current_user["id"], other_user_id],
            "last_message": f"Replied to your story: \"{input_data.message}\"",
            "last_message_at": datetime.utcnow(),
            "unread_counts": {other_user_id: 1, current_user["id"]: 0},
            "created_at": datetime.utcnow(),
        }
        await db.conversations.insert_one(conv)
    else:
        conv_id = conv["id"]
        await db.conversations.update_one(
            {"id": conv_id},
            {
                "$set": {
                    "last_message": f"Replied to story: \"{input_data.message}\"",
                    "last_message_at": datetime.utcnow(),
                },
                "$inc": {f"unread_counts.{other_user_id}": 1},
            }
        )

    msg_id = str(uuid.uuid4())
    msg_dict = {
        "id": msg_id,
        "conversation_id": conv_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["full_name"],
        "sender_avatar": current_user.get("avatar_url", ""),
        "recipient_id": other_user_id,
        "content": f"📷 Replied to your story: \"{input_data.message}\"",
        "media_url": story.get("media_url", ""),
        "is_read": False,
        "created_at": datetime.utcnow(),
    }
    await db.messages.insert_one(msg_dict)

    # Notify story owner
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": other_user_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "message",
        "title": "New Message from Story Reply",
        "message": f"{current_user['full_name']} replied to your story: \"{input_data.message[:30]}...\"",
        "link": f"/messages?conv={conv_id}",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    return {"message": "Reply sent as direct message", "conversation_id": conv_id}


@router.delete("/{story_id}")
async def delete_story(
    story_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    story = await db.stories.find_one({"id": story_id})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if story["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.stories.delete_one({"id": story_id})
    return {"message": "Story deleted"}
