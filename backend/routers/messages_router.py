"""Real-time chat & direct messaging router."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    TypingNotification,
    UserResponse,
)

router = APIRouter(prefix="/conversations", tags=["messages"])

# In-memory tracking of user typing status
TYPING_USERS: Dict[str, Dict[str, datetime]] = {}


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.get("", response_model=List[ConversationResponse])
async def get_my_conversations(current_user: dict = Depends(get_current_user_required)):
    user_id = current_user["id"]
    convs = await db.conversations.find({"participants": user_id}).sort("last_message_at", -1).to_list(100)

    result = []
    for c in convs:
        # Find other participant
        other_id = [p for p in c["participants"] if p != user_id]
        if not other_id:
            continue
        other_user = await db.users.find_one({"id": other_id[0]})
        if not other_user:
            continue

        unread_count = c.get("unread_counts", {}).get(user_id, 0)
        result.append(ConversationResponse(
            id=c["id"],
            participants=c["participants"],
            other_user=UserResponse(**sanitize_user(other_user)),
            last_message=c.get("last_message", ""),
            last_message_at=c.get("last_message_at", datetime.utcnow()),
            unread_count=unread_count,
        ))
    return result


@router.post("/get-or-create/{target_user_id}", response_model=ConversationResponse)
async def get_or_create_conversation(
    target_user_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    if target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself.")

    target_user = await db.users.find_one({"id": target_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Student not found.")

    user_id = current_user["id"]
    conv = await db.conversations.find_one({
        "participants": {"$all": [user_id, target_user_id]}
    })

    if not conv:
        conv_id = str(uuid.uuid4())
        conv = {
            "id": conv_id,
            "participants": [user_id, target_user_id],
            "last_message": "Started a new conversation",
            "last_message_at": datetime.utcnow(),
            "unread_counts": {target_user_id: 0, user_id: 0},
            "created_at": datetime.utcnow(),
        }
        await db.conversations.insert_one(conv)

    return ConversationResponse(
        id=conv["id"],
        participants=conv["participants"],
        other_user=UserResponse(**sanitize_user(target_user)),
        last_message=conv.get("last_message", ""),
        last_message_at=conv.get("last_message_at", datetime.utcnow()),
        unread_count=conv.get("unread_counts", {}).get(user_id, 0),
    )


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    conv = await db.conversations.find_one({"id": conversation_id, "participants": current_user["id"]})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Mark messages as read and clear unread count
    await db.messages.update_many(
        {"conversation_id": conversation_id, "recipient_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}},
    )
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_counts.{current_user['id']}": 0}},
    )

    messages = await db.messages.find({"conversation_id": conversation_id}).sort("created_at", 1).to_list(500)
    return [MessageResponse(**m) for m in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    input_data: MessageCreate,
    current_user: dict = Depends(get_current_user_required),
):
    conv = await db.conversations.find_one({"id": conversation_id, "participants": current_user["id"]})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    other_id = [p for p in conv["participants"] if p != current_user["id"]][0]

    msg_id = str(uuid.uuid4())
    now = datetime.utcnow()
    msg_dict = {
        "id": msg_id,
        "conversation_id": conversation_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["full_name"],
        "sender_avatar": current_user.get("avatar_url", ""),
        "recipient_id": other_id,
        "content": input_data.content,
        "media_url": input_data.media_url,
        "is_read": False,
        "created_at": now,
    }
    await db.messages.insert_one(msg_dict)

    # Update conversation last message & unread count
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message": input_data.content,
                "last_message_at": now,
            },
            "$inc": {f"unread_counts.{other_id}": 1},
        }
    )

    # Create notification for recipient
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": other_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "message",
        "title": "New Direct Message",
        "message": f"{current_user['full_name']}: {input_data.content[:40]}...",
        "link": f"/messages?conv={conversation_id}",
        "is_read": False,
        "created_at": now,
    })

    return MessageResponse(**msg_dict)


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    msg = await db.messages.find_one({"id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg["sender_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own messages.")

    await db.messages.delete_one({"id": message_id})
    return {"message": "Message deleted"}


@router.post("/{conversation_id}/typing")
async def set_typing_status(
    conversation_id: str,
    input_data: TypingNotification,
    current_user: dict = Depends(get_current_user_required),
):
    if conversation_id not in TYPING_USERS:
        TYPING_USERS[conversation_id] = {}

    if input_data.is_typing:
        TYPING_USERS[conversation_id][current_user["id"]] = datetime.utcnow()
    else:
        TYPING_USERS[conversation_id].pop(current_user["id"], None)

    return {"status": "ok"}
