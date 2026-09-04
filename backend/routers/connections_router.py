"""Connections router: connection requests, approvals, rejections, list my connections."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    ConnectionRequestCreate,
    ConnectionResponse,
    ConnectionStatusResponse,
    UserResponse,
)

router = APIRouter(prefix="/connections", tags=["connections"])


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.get("/status/{target_user_id}", response_model=ConnectionStatusResponse)
async def get_connection_status(
    target_user_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    if target_user_id == current_user["id"]:
        return ConnectionStatusResponse(status="connected")

    conn = await db.connections.find_one({
        "$or": [
            {"requester_id": current_user["id"], "recipient_id": target_user_id},
            {"requester_id": target_user_id, "recipient_id": current_user["id"]},
        ]
    })

    if not conn:
        return ConnectionStatusResponse(status="none")

    if conn["status"] == "accepted":
        return ConnectionStatusResponse(status="connected", connection_id=conn["id"])
    elif conn["status"] == "pending":
        if conn["requester_id"] == current_user["id"]:
            return ConnectionStatusResponse(status="pending_sent", connection_id=conn["id"])
        else:
            return ConnectionStatusResponse(status="pending_received", connection_id=conn["id"])
    else:
        return ConnectionStatusResponse(status="none")


@router.post("/request", response_model=ConnectionResponse)
async def send_connection_request(
    input_data: ConnectionRequestCreate,
    current_user: dict = Depends(get_current_user_required),
):
    if input_data.recipient_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot connect with yourself.")

    recipient = await db.users.find_one({"id": input_data.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Check privacy settings
    rec_privacy = recipient.get("privacy", {})
    if rec_privacy.get("who_can_connect") == "same_college" and recipient.get("college") != current_user.get("college"):
        raise HTTPException(status_code=403, detail="This student only accepts connections from their own college.")

    existing = await db.connections.find_one({
        "$or": [
            {"requester_id": current_user["id"], "recipient_id": input_data.recipient_id},
            {"requester_id": input_data.recipient_id, "recipient_id": current_user["id"]},
        ]
    })

    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail="You are already connected.")
        elif existing["status"] == "pending":
            raise HTTPException(status_code=400, detail="A connection request is already pending.")
        else:
            # Re-open rejected request
            conn_id = existing["id"]
            await db.connections.update_one(
                {"id": conn_id},
                {"$set": {"status": "pending", "requester_id": current_user["id"], "recipient_id": input_data.recipient_id, "note": input_data.note, "updated_at": datetime.utcnow()}}
            )
            updated = await db.connections.find_one({"id": conn_id})
            return ConnectionResponse(**updated, other_user=UserResponse(**sanitize_user(recipient)))

    conn_id = str(uuid.uuid4())
    conn_dict = {
        "id": conn_id,
        "requester_id": current_user["id"],
        "recipient_id": input_data.recipient_id,
        "status": "pending",
        "note": input_data.note,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.connections.insert_one(conn_dict)

    # Trigger notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": input_data.recipient_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "connection_request",
        "title": "New Connection Request",
        "message": f"{current_user['full_name']} sent you a connection request.",
        "link": f"/profile/{current_user['id']}",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    return ConnectionResponse(**conn_dict, other_user=UserResponse(**sanitize_user(recipient)))


@router.post("/{connection_id}/accept", response_model=ConnectionResponse)
async def accept_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    conn = await db.connections.find_one({"id": connection_id, "recipient_id": current_user["id"]})
    if not conn:
        raise HTTPException(status_code=404, detail="Pending connection request not found.")

    await db.connections.update_one(
        {"id": connection_id},
        {"$set": {"status": "accepted", "updated_at": datetime.utcnow()}},
    )

    # Increment connection counters
    await db.users.update_one({"id": conn["requester_id"]}, {"$inc": {"connections_count": 1}})
    await db.users.update_one({"id": conn["recipient_id"]}, {"$inc": {"connections_count": 1}})

    requester = await db.users.find_one({"id": conn["requester_id"]})

    # Notify requester
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": conn["requester_id"],
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "connection_accepted",
        "title": "Connection Accepted!",
        "message": f"{current_user['full_name']} accepted your connection request.",
        "link": f"/profile/{current_user['id']}",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    updated_conn = await db.connections.find_one({"id": connection_id})
    return ConnectionResponse(**updated_conn, other_user=UserResponse(**sanitize_user(requester)) if requester else None)


@router.post("/{connection_id}/reject")
async def reject_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    conn = await db.connections.find_one({"id": connection_id, "recipient_id": current_user["id"]})
    if not conn:
        raise HTTPException(status_code=404, detail="Pending connection request not found.")

    await db.connections.update_one(
        {"id": connection_id},
        {"$set": {"status": "rejected", "updated_at": datetime.utcnow()}},
    )
    return {"message": "Connection request rejected."}


@router.delete("/{connection_id}")
async def remove_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    conn = await db.connections.find_one({
        "id": connection_id,
        "$or": [{"requester_id": current_user["id"]}, {"recipient_id": current_user["id"]}],
    })
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found.")

    if conn["status"] == "accepted":
        await db.users.update_one({"id": conn["requester_id"]}, {"$inc": {"connections_count": -1}})
        await db.users.update_one({"id": conn["recipient_id"]}, {"$inc": {"connections_count": -1}})

    await db.connections.delete_one({"id": connection_id})
    return {"message": "Connection removed successfully."}


@router.get("/my", response_model=List[ConnectionResponse])
async def get_my_connections(
    status_filter: str = "accepted",  # accepted, pending_incoming, pending_outgoing, all
    current_user: dict = Depends(get_current_user_required),
):
    user_id = current_user["id"]
    query = {}
    if status_filter == "accepted":
        query = {
            "$or": [{"requester_id": user_id}, {"recipient_id": user_id}],
            "status": "accepted",
        }
    elif status_filter == "pending_incoming":
        query = {"recipient_id": user_id, "status": "pending"}
    elif status_filter == "pending_outgoing":
        query = {"requester_id": user_id, "status": "pending"}
    else:
        query = {"$or": [{"requester_id": user_id}, {"recipient_id": user_id}]}

    conns = await db.connections.find(query).sort("updated_at", -1).to_list(200)
    result = []
    for c in conns:
        other_id = c["recipient_id"] if c["requester_id"] == user_id else c["requester_id"]
        other_user = await db.users.find_one({"id": other_id})
        other_resp = UserResponse(**sanitize_user(other_user)) if other_user else None
        result.append(ConnectionResponse(**c, other_user=other_resp))
    return result
