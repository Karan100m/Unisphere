"""Users router: profile viewing, updating, and privacy settings."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from lib.db import db
from lib.auth import get_current_user_required, get_current_user_optional
from models.schemas import UserResponse, UserUpdate, PrivacySettings

router = APIRouter(prefix="/users", tags=["users"])


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.get("/{id}", response_model=UserResponse)
async def get_user_profile(id: str, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user = await db.users.find_one({"id": id})
    if not user:
        raise HTTPException(status_code=404, detail="Student profile not found")

    user_clean = sanitize_user(user)

    # Privacy checks
    if current_user and current_user["id"] != id:
        # Check if blocked
        is_blocked = await db.blocks.find_one({
            "$or": [
                {"blocker_id": current_user["id"], "blocked_user_id": id},
                {"blocker_id": id, "blocked_user_id": current_user["id"]},
            ]
        })
        if is_blocked:
            raise HTTPException(status_code=403, detail="Profile unavailable due to privacy restrictions.")

        privacy = user_clean.get("privacy", {})
        if not privacy.get("show_email", False):
            user_clean["email"] = "Hidden for privacy"

    return UserResponse(**user_clean)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    input_data: UserUpdate,
    current_user: dict = Depends(get_current_user_required),
):
    update_dict = {k: v for k, v in input_data.model_dump().items() if v is not None}
    if not update_dict:
        return UserResponse(**sanitize_user(current_user))

    # If updating privacy dict
    if "privacy" in update_dict and isinstance(update_dict["privacy"], dict):
        current_privacy = current_user.get("privacy", {})
        current_privacy.update(update_dict["privacy"])
        update_dict["privacy"] = current_privacy

    await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return UserResponse(**sanitize_user(updated_user))


@router.put("/me/privacy", response_model=PrivacySettings)
async def update_privacy(
    privacy: PrivacySettings,
    current_user: dict = Depends(get_current_user_required),
):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"privacy": privacy.model_dump()}},
    )
    return privacy
