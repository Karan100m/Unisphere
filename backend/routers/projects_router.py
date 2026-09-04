"""Project Collaboration & Team recruitment router."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required, get_current_user_optional
from models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectJoinRequestCreate,
    ProjectJoinRequestResponse,
    ProjectJoinReview,
    TeamMember,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    category: Optional[str] = None,
    technology: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    owner_id: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if technology:
        query["technologies"] = {"$in": [technology]}
    if status and status != "all":
        query["status"] = status
    if owner_id:
        query["owner_id"] = owner_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"technologies": {"$in": [search]}},
        ]

    projects = await db.projects.find(query).sort("created_at", -1).to_list(100)

    user_id = current_user["id"] if current_user else None
    user_applications = set()
    if user_id:
        reqs = await db.project_requests.find({"applicant_id": user_id}).to_list(200)
        user_applications = {r["project_id"] for r in reqs}

    result = []
    for p in projects:
        p["is_owner"] = p["owner_id"] == user_id if user_id else False
        p["has_applied"] = p["id"] in user_applications
        result.append(ProjectResponse(**p))
    return result


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    p = await db.projects.find_one({"id": project_id})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    user_id = current_user["id"] if current_user else None
    has_applied = False
    if user_id:
        req = await db.project_requests.find_one({"project_id": project_id, "applicant_id": user_id})
        has_applied = req is not None

    p["is_owner"] = p["owner_id"] == user_id if user_id else False
    p["has_applied"] = has_applied
    return ProjectResponse(**p)


@router.post("", response_model=ProjectResponse)
async def create_project(
    input_data: ProjectCreate,
    current_user: dict = Depends(get_current_user_required),
):
    project_id = str(uuid.uuid4())
    now = datetime.utcnow()

    owner_member = {
        "user_id": current_user["id"],
        "name": current_user["full_name"],
        "avatar": current_user.get("avatar_url", ""),
        "role": "Project Lead / Creator",
        "college": current_user.get("college", ""),
    }

    project_dict = {
        "id": project_id,
        "title": input_data.title,
        "description": input_data.description,
        "category": input_data.category,
        "technologies": input_data.technologies,
        "owner_id": current_user["id"],
        "owner_name": current_user["full_name"],
        "owner_avatar": current_user.get("avatar_url", ""),
        "owner_college": current_user.get("college", "University"),
        "team_members": [owner_member],
        "looking_for_roles": [r.model_dump() for r in input_data.looking_for_roles],
        "github_url": input_data.github_url,
        "demo_url": input_data.demo_url,
        "status": input_data.status,
        "created_at": now,
    }
    await db.projects.insert_one(project_dict)

    project_dict["is_owner"] = True
    project_dict["has_applied"] = False
    return ProjectResponse(**project_dict)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    input_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only project owner can edit this project.")

    update_dict = {k: v for k, v in input_data.model_dump().items() if v is not None}
    if "looking_for_roles" in update_dict and update_dict["looking_for_roles"]:
        update_dict["looking_for_roles"] = [r.model_dump() if hasattr(r, 'model_dump') else r for r in update_dict["looking_for_roles"]]

    await db.projects.update_one({"id": project_id}, {"$set": update_dict})
    updated = await db.projects.find_one({"id": project_id})
    updated["is_owner"] = True
    updated["has_applied"] = False
    return ProjectResponse(**updated)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.projects.delete_one({"id": project_id})
    await db.project_requests.delete_many({"project_id": project_id})
    return {"message": "Project deleted successfully"}


@router.post("/{project_id}/apply", response_model=ProjectJoinRequestResponse)
async def apply_to_project(
    project_id: str,
    input_data: ProjectJoinRequestCreate,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You already own this project.")

    existing = await db.project_requests.find_one({
        "project_id": project_id,
        "applicant_id": current_user["id"],
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to join this project.")

    req_id = str(uuid.uuid4())
    req_dict = {
        "id": req_id,
        "project_id": project_id,
        "project_title": project["title"],
        "applicant_id": current_user["id"],
        "applicant_name": current_user["full_name"],
        "applicant_avatar": current_user.get("avatar_url", ""),
        "applicant_college": current_user.get("college", ""),
        "role_applied": input_data.role_applied,
        "pitch": input_data.pitch,
        "skills": input_data.skills or current_user.get("skills", []),
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db.project_requests.insert_one(req_dict)

    # Notify project owner
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": project["owner_id"],
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "project_request",
        "title": "New Team Join Request",
        "message": f"{current_user['full_name']} applied for '{input_data.role_applied}' on '{project['title']}'.",
        "link": f"/projects?id={project_id}",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    return ProjectJoinRequestResponse(**req_dict)


@router.get("/{project_id}/requests", response_model=List[ProjectJoinRequestResponse])
async def get_project_requests(
    project_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    requests = await db.project_requests.find({"project_id": project_id}).sort("created_at", -1).to_list(100)
    return [ProjectJoinRequestResponse(**r) for r in requests]


@router.post("/requests/{request_id}/review")
async def review_project_request(
    request_id: str,
    input_data: ProjectJoinReview,
    current_user: dict = Depends(get_current_user_required),
):
    req = await db.project_requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Application request not found")

    project = await db.projects.find_one({"id": req["project_id"]})
    if not project or (project["owner_id"] != current_user["id"] and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.project_requests.update_one(
        {"id": request_id},
        {"$set": {"status": input_data.status}}
    )

    if input_data.status == "accepted":
        applicant = await db.users.find_one({"id": req["applicant_id"]})
        new_member = {
            "user_id": req["applicant_id"],
            "name": req["applicant_name"],
            "avatar": req["applicant_avatar"],
            "role": req["role_applied"],
            "college": applicant.get("college", "") if applicant else "",
        }
        await db.projects.update_one(
            {"id": req["project_id"]},
            {"$push": {"team_members": new_member}}
        )

        # Notify applicant
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": req["applicant_id"],
            "actor_id": current_user["id"],
            "actor_name": current_user["full_name"],
            "actor_avatar": current_user.get("avatar_url", ""),
            "type": "project_accepted",
            "title": "Application Accepted!",
            "message": f"Congratulations! You have been accepted to join '{project['title']}' as {req['role_applied']}.",
            "link": f"/projects?id={project['id']}",
            "is_read": False,
            "created_at": datetime.utcnow(),
        })

    return {"message": f"Application {input_data.status}"}


@router.post("/{project_id}/members/remove")
async def remove_team_member(
    project_id: str,
    member_user_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project["owner_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    if member_user_id == project["owner_id"]:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner.")

    await db.projects.update_one(
        {"id": project_id},
        {"$pull": {"team_members": {"user_id": member_user_id}}}
    )
    return {"message": "Team member removed"}
