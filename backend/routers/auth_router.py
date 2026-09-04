"""Authentication router: signup, login, logout, me, reset-password, verify-email."""

from fastapi import APIRouter, HTTPException, status, Response, Request, Depends
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_required,
    get_current_user_optional,
)
from models.schemas import (
    UserSignup,
    UserLogin,
    ResetPasswordRequest,
    UserResponse,
    AuthResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.post("/signup", response_model=AuthResponse)
async def signup(input_data: UserSignup, response: Response):
    existing = await db.users.find_one({"email": input_data.email.lower().strip()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in.",
        )

    user_id = str(uuid.uuid4())
    user_dict = input_data.model_dump()
    password = user_dict.pop("password")
    user_dict["email"] = input_data.email.lower().strip()
    user_dict["id"] = user_id
    user_dict["password_hash"] = hash_password(password)
    user_dict["role"] = "student"
    user_dict["reputation_score"] = 5.0
    user_dict["category_reputation"] = {
        "communication": 5.0,
        "teamwork": 5.0,
        "reliability": 5.0,
        "professionalism": 5.0,
        "technical": 5.0,
    }
    user_dict["endorsements_count"] = 0
    user_dict["connections_count"] = 0
    user_dict["is_suspended"] = False
    user_dict["is_verified"] = True
    user_dict["created_at"] = datetime.utcnow()
    user_dict["privacy"] = {
        "who_can_message": "everyone",
        "who_can_connect": "everyone",
        "who_can_call": "everyone",
        "is_profile_public": True,
        "show_email": False,
    }

    if not user_dict.get("avatar_url"):
        user_dict["avatar_url"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"

    await db.users.insert_one(user_dict)

    # Initialize default availability
    await db.availabilities.insert_one({
        "user_id": user_id,
        "topics": ["Project Collaboration", "Career Discussion", "Networking", "Hackathon Teammate Search"],
        "timezone": "UTC",
        "weekly_schedule": [
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
    })

    token = create_access_token({"sub": user_id, "email": user_dict["email"], "role": user_dict["role"]})
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Dev/preview environment
        max_age=30 * 24 * 3600,
    )

    return AuthResponse(
        user=UserResponse(**sanitize_user(user_dict)),
        token=token,
        message="Account created successfully!",
    )


@router.post("/login", response_model=AuthResponse)
async def login(input_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": input_data.email.lower().strip()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password.",
        )

    if not verify_password(input_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password.",
        )

    if user.get("is_suspended", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact platform administrators.",
        )

    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user.get("role", "student")})
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=30 * 24 * 3600,
    )

    return AuthResponse(
        user=UserResponse(**sanitize_user(user)),
        token=token,
        message="Login successful!",
    )


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user_required)):
    return UserResponse(**sanitize_user(current_user))


@router.post("/reset-password")
async def reset_password(input_data: ResetPasswordRequest):
    user = await db.users.find_one({"email": input_data.email.lower().strip()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address.",
        )
    new_hash = hash_password(input_data.new_password)
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.post("/verify-email")
async def verify_email(current_user: dict = Depends(get_current_user_required)):
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"is_verified": True}})
    return {"message": "Email verified successfully."}
