"""Global Search and Student Discovery Router."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional

from lib.db import db
from lib.auth import get_current_user_optional
from models.schemas import (
    SearchResultResponse,
    UserResponse,
    CollegeResponse,
    ProjectResponse,
    PostResponse,
)

router = APIRouter(prefix="/search", tags=["search"])


def sanitize_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    if "id" not in u and "_id" in u:
        u["id"] = str(u["_id"])
    return u


@router.get("/global", response_model=SearchResultResponse)
async def global_search(
    q: str = Query("", min_length=0),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    if not q or not q.strip():
        # Return popular students and colleges
        featured_students = await db.users.find({"is_suspended": False}).limit(6).to_list(6)
        colleges = await db.colleges.find({}).limit(4).to_list(4)
        projects = await db.projects.find({}).limit(4).to_list(4)
        posts = await db.posts.find({}).limit(4).to_list(4)

        return SearchResultResponse(
            students=[UserResponse(**sanitize_user(s)) for s in featured_students],
            colleges=[CollegeResponse(**c) for c in colleges],
            projects=[ProjectResponse(**p) for p in projects],
            posts=[PostResponse(**p) for p in posts],
        )

    regex = {"$regex": q.strip(), "$options": "i"}
    array_regex = {"$elemMatch": {"$regex": q.strip(), "$options": "i"}}

    # Search Students
    students_docs = await db.users.find({
        "is_suspended": False,
        "$or": [
            {"full_name": regex},
            {"college": regex},
            {"degree": regex},
            {"branch": regex},
            {"skills": array_regex},
            {"interests": array_regex},
        ]
    }).limit(10).to_list(10)

    # Search Colleges
    colleges_docs = await db.colleges.find({
        "$or": [
            {"name": regex},
            {"short_name": regex},
            {"location": regex},
        ]
    }).limit(6).to_list(6)

    # Search Projects
    projects_docs = await db.projects.find({
        "$or": [
            {"title": regex},
            {"description": regex},
            {"technologies": array_regex},
            {"category": regex},
        ]
    }).limit(6).to_list(6)

    # Search Posts
    posts_docs = await db.posts.find({
        "$or": [
            {"content": regex},
            {"tags": array_regex},
            {"author_name": regex},
        ]
    }).limit(6).to_list(6)

    return SearchResultResponse(
        students=[UserResponse(**sanitize_user(s)) for s in students_docs],
        colleges=[CollegeResponse(**c) for c in colleges_docs],
        projects=[ProjectResponse(**p) for p in projects_docs],
        posts=[PostResponse(**p) for p in posts_docs],
    )


@router.get("/students", response_model=List[UserResponse])
async def discover_students(
    search: Optional[str] = None,
    college: Optional[str] = None,
    degree: Optional[str] = None,
    branch: Optional[str] = None,
    year: Optional[str] = None,
    skill: Optional[str] = None,
    interest: Optional[str] = None,
    location: Optional[str] = None,
    sort_by: Optional[str] = "reputation",  # reputation, connections, newest
    limit: int = 50,
    skip: int = 0,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    query = {"is_suspended": False}

    if search and search.strip():
        regex = {"$regex": search.strip(), "$options": "i"}
        array_regex = {"$elemMatch": {"$regex": search.strip(), "$options": "i"}}
        query["$or"] = [
            {"full_name": regex},
            {"college": regex},
            {"branch": regex},
            {"bio": regex},
            {"skills": array_regex},
            {"interests": array_regex},
        ]

    if college and college != "all":
        query["college"] = {"$regex": college, "$options": "i"}
    if degree and degree != "all":
        query["degree"] = {"$regex": degree, "$options": "i"}
    if branch and branch != "all":
        query["branch"] = {"$regex": branch, "$options": "i"}
    if year and year != "all":
        query["current_year"] = {"$regex": year, "$options": "i"}
    if skill and skill != "all":
        query["skills"] = {"$in": [skill]}
    if interest and interest != "all":
        query["interests"] = {"$in": [interest]}
    if location and location != "all":
        query["city_country"] = {"$regex": location, "$options": "i"}

    # Exclude current user and blocked users
    if current_user:
        user_id = current_user["id"]
        blocks = await db.blocks.find({
            "$or": [{"blocker_id": user_id}, {"blocked_user_id": user_id}]
        }).to_list(200)
        excluded_ids = [user_id] + [b["blocked_user_id"] if b["blocker_id"] == user_id else b["blocker_id"] for b in blocks]
        query["id"] = {"$nin": excluded_ids}

    # Sorting
    sort_spec = ("reputation_score", -1)
    if sort_by == "connections":
        sort_spec = ("connections_count", -1)
    elif sort_by == "newest":
        sort_spec = ("created_at", -1)

    students = await db.users.find(query).sort([sort_spec]).skip(skip).limit(limit).to_list(limit)
    return [UserResponse(**sanitize_user(s)) for s in students]
