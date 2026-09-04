"""Direct 1-to-1 WebRTC Video/Audio Call Router."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    CallInitiateRequest,
    CallRespondRequest,
    CallSessionResponse,
    CallSignalRequest,
)

router = APIRouter(prefix="/calls", tags=["calls"])

# In-memory storage for active call signaling (offer, answer, candidates)
CALL_SIGNAL_BUFFERS: Dict[str, List[Dict[str, Any]]] = {}


@router.post("/initiate", response_model=CallSessionResponse)
async def initiate_call(
    input_data: CallInitiateRequest,
    current_user: dict = Depends(get_current_user_required),
):
    if input_data.recipient_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot call yourself.")

    recipient = await db.users.find_one({"id": input_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient student not found.")

    call_id = f"call-{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow()

    call_record = {
        "id": call_id,
        "caller_id": current_user["id"],
        "caller_name": current_user["full_name"],
        "caller_avatar": current_user.get("avatar_url", ""),
        "caller_college": current_user.get("college", ""),
        "recipient_id": input_data.recipient_id,
        "recipient_name": recipient["full_name"],
        "recipient_avatar": recipient.get("avatar_url", ""),
        "recipient_college": recipient.get("college", ""),
        "call_type": input_data.call_type,
        "status": "ringing",
        "created_at": now,
    }
    await db.call_sessions.insert_one(call_record)
    CALL_SIGNAL_BUFFERS[call_id] = []

    # Notify recipient of incoming call
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": input_data.recipient_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "incoming_call",
        "title": f"Incoming {input_data.call_type.capitalize()} Call",
        "message": f"{current_user['full_name']} is calling you...",
        "link": f"/calls/{call_id}",
        "is_read": False,
        "created_at": now,
    })

    return CallSessionResponse(
        call_id=call_id,
        caller_id=call_record["caller_id"],
        caller_name=call_record["caller_name"],
        caller_avatar=call_record["caller_avatar"],
        caller_college=call_record["caller_college"],
        recipient_id=call_record["recipient_id"],
        recipient_name=call_record["recipient_name"],
        recipient_avatar=call_record["recipient_avatar"],
        recipient_college=call_record["recipient_college"],
        call_type=call_record["call_type"],
        status="ringing",
        created_at=now,
    )


@router.get("/active", response_model=Optional[CallSessionResponse])
async def get_active_call_for_me(current_user: dict = Depends(get_current_user_required)):
    user_id = current_user["id"]
    # Check for calls where current user is recipient with ringing status
    call = await db.call_sessions.find_one({
        "recipient_id": user_id,
        "status": "ringing",
    })
    if not call:
        return None

    return CallSessionResponse(
        call_id=call["id"],
        caller_id=call["caller_id"],
        caller_name=call["caller_name"],
        caller_avatar=call["caller_avatar"],
        caller_college=call["caller_college"],
        recipient_id=call["recipient_id"],
        recipient_name=call["recipient_name"],
        recipient_avatar=call["recipient_avatar"],
        recipient_college=call["recipient_college"],
        call_type=call["call_type"],
        status=call["status"],
        created_at=call["created_at"],
    )


@router.get("/{call_id}", response_model=CallSessionResponse)
async def get_call_session(call_id: str, current_user: dict = Depends(get_current_user_required)):
    call = await db.call_sessions.find_one({"id": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    return CallSessionResponse(
        call_id=call["id"],
        caller_id=call["caller_id"],
        caller_name=call["caller_name"],
        caller_avatar=call["caller_avatar"],
        caller_college=call["caller_college"],
        recipient_id=call["recipient_id"],
        recipient_name=call["recipient_name"],
        recipient_avatar=call["recipient_avatar"],
        recipient_college=call["recipient_college"],
        call_type=call["call_type"],
        status=call["status"],
        created_at=call["created_at"],
    )


@router.post("/{call_id}/respond", response_model=CallSessionResponse)
async def respond_to_call(
    call_id: str,
    input_data: CallRespondRequest,
    current_user: dict = Depends(get_current_user_required),
):
    call = await db.call_sessions.find_one({"id": call_id, "recipient_id": current_user["id"]})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    new_status = "active" if input_data.action == "accept" else "rejected"
    await db.call_sessions.update_one({"id": call_id}, {"$set": {"status": new_status}})

    call["status"] = new_status
    return CallSessionResponse(
        call_id=call["id"],
        caller_id=call["caller_id"],
        caller_name=call["caller_name"],
        caller_avatar=call["caller_avatar"],
        caller_college=call["caller_college"],
        recipient_id=call["recipient_id"],
        recipient_name=call["recipient_name"],
        recipient_avatar=call["recipient_avatar"],
        recipient_college=call["recipient_college"],
        call_type=call["call_type"],
        status=new_status,
        created_at=call["created_at"],
    )


@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    await db.call_sessions.update_one({"id": call_id}, {"$set": {"status": "ended"}})
    CALL_SIGNAL_BUFFERS.pop(call_id, None)
    return {"message": "Call ended"}


@router.post("/signal/send")
async def send_call_signal(
    signal_data: CallSignalRequest,
    current_user: dict = Depends(get_current_user_required),
):
    call_id = signal_data.call_id
    if call_id not in CALL_SIGNAL_BUFFERS:
        CALL_SIGNAL_BUFFERS[call_id] = []

    CALL_SIGNAL_BUFFERS[call_id].append({
        "sender_id": current_user["id"],
        "signal_type": signal_data.signal_type,
        "payload": signal_data.payload,
        "timestamp": datetime.utcnow().isoformat(),
    })
    return {"status": "sent"}


@router.get("/signal/poll/{call_id}")
async def poll_call_signals(
    call_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    signals = CALL_SIGNAL_BUFFERS.get(call_id, [])
    other_signals = [s for s in signals if s["sender_id"] != current_user["id"]]
    return {"signals": other_signals}
