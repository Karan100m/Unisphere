"""College Communities router: college directory, roster, events, follow toggle."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required, get_current_user_optional
from models.schemas import CollegeResponse, CollegeCreate, UserResponse

router = APIRouter(prefix="/colleges", tags=["colleges"])


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.get("", response_model=List[CollegeResponse])
async def get_colleges(
    search: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"short_name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]

    colleges = await db.colleges.find(query).to_list(100)

    # Check follower status
    following_ids = set()
    if current_user:
        follows = await db.college_follows.find({"user_id": current_user["id"]}).to_list(200)
        following_ids = {f["college_id"] for f in follows}

    result = []
    for c in colleges:
        # Dynamic student count
        count = await db.users.count_documents({"college": c["name"]})
        c["student_count"] = max(c.get("student_count", 0), count)
        c["is_following"] = c["id"] in following_ids
        result.append(CollegeResponse(**c))
    return result


@router.get("/{college_id}", response_model=CollegeResponse)
async def get_college_detail(
    college_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    college = await db.colleges.find_one({"id": college_id})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    count = await db.users.count_documents({"college": college["name"]})
    college["student_count"] = max(college.get("student_count", 0), count)

    is_following = False
    if current_user:
        follow = await db.college_follows.find_one({"user_id": current_user["id"], "college_id": college_id})
        is_following = follow is not None

    college["is_following"] = is_following
    return CollegeResponse(**college)


@router.get("/{college_id}/students", response_model=List[UserResponse])
async def get_college_students(college_id: str):
    college = await db.colleges.find_one({"id": college_id})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    students = await db.users.find({"college": college["name"], "is_suspended": False}).limit(50).to_list(50)
    return [UserResponse(**sanitize_user(s)) for s in students]


@router.post("/{college_id}/follow")
async def toggle_follow_college(
    college_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    college = await db.colleges.find_one({"id": college_id})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")

    existing = await db.college_follows.find_one({"user_id": current_user["id"], "college_id": college_id})
    if existing:
        await db.college_follows.delete_one({"user_id": current_user["id"], "college_id": college_id})
        await db.colleges.update_one({"id": college_id}, {"$inc": {"followers_count": -1}})
        return {"is_following": False}
    else:
        await db.college_follows.insert_one({
            "user_id": current_user["id"],
            "college_id": college_id,
            "created_at": datetime.utcnow(),
        })
        await db.colleges.update_one({"id": college_id}, {"$inc": {"followers_count": 1}})
        return {"is_following": True}
