"""Reputation & Peer Endorsement rating router."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    EndorsementCreate,
    ReputationResponse,
    EndorsementReviewItem,
    ReputationCategory,
)

router = APIRouter(prefix="/reputation", tags=["reputation"])


@router.post("/endorse", response_model=ReputationResponse)
async def endorse_student(
    input_data: EndorsementCreate,
    current_user: dict = Depends(get_current_user_required),
):
    if input_data.target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot endorse yourself.")

    target = await db.users.find_one({"id": input_data.target_user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Check for existing endorsement from this user to prevent spamming
    existing = await db.reputation_reviews.find_one({
        "reviewer_id": current_user["id"],
        "target_user_id": input_data.target_user_id,
    })

    review_id = existing["id"] if existing else str(uuid.uuid4())
    scores_obj = {
        "communication": float(input_data.communication),
        "teamwork": float(input_data.teamwork),
        "reliability": float(input_data.reliability),
        "professionalism": float(input_data.professionalism),
        "technical": float(input_data.technical),
    }
    avg_score = round(sum(scores_obj.values()) / 5.0, 2)

    review_doc = {
        "id": review_id,
        "reviewer_id": current_user["id"],
        "reviewer_name": current_user["full_name"],
        "reviewer_avatar": current_user.get("avatar_url", ""),
        "reviewer_college": current_user.get("college", ""),
        "target_user_id": input_data.target_user_id,
        "interaction_type": input_data.interaction_type,
        "scores": scores_obj,
        "average_score": avg_score,
        "comment": input_data.comment,
        "created_at": datetime.utcnow(),
    }

    if existing:
        await db.reputation_reviews.update_one({"id": review_id}, {"$set": review_doc})
    else:
        await db.reputation_reviews.insert_one(review_doc)

    # Recalculate target user's aggregated reputation
    all_reviews = await db.reputation_reviews.find({"target_user_id": input_data.target_user_id}).to_list(500)
    n = len(all_reviews)
    if n > 0:
        cat_agg = {
            "communication": round(sum(r["scores"]["communication"] for r in all_reviews) / n, 2),
            "teamwork": round(sum(r["scores"]["teamwork"] for r in all_reviews) / n, 2),
            "reliability": round(sum(r["scores"]["reliability"] for r in all_reviews) / n, 2),
            "professionalism": round(sum(r["scores"]["professionalism"] for r in all_reviews) / n, 2),
            "technical": round(sum(r["scores"]["technical"] for r in all_reviews) / n, 2),
        }
        overall = round(sum(cat_agg.values()) / 5.0, 2)
        await db.users.update_one(
            {"id": input_data.target_user_id},
            {
                "$set": {
                    "reputation_score": overall,
                    "category_reputation": cat_agg,
                    "endorsements_count": n,
                }
            }
        )

    # Notify target student
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": input_data.target_user_id,
        "actor_id": current_user["id"],
        "actor_name": current_user["full_name"],
        "actor_avatar": current_user.get("avatar_url", ""),
        "type": "reputation_endorsed",
        "title": "New Peer Endorsement",
        "message": f"{current_user['full_name']} endorsed your skills and left feedback!",
        "link": f"/profile/{input_data.target_user_id}",
        "is_read": False,
        "created_at": datetime.utcnow(),
    })

    return await get_user_reputation(input_data.target_user_id)


@router.get("/user/{user_id}", response_model=ReputationResponse)
async def get_user_reputation(user_id: str):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="Student not found")

    reviews = await db.reputation_reviews.find({"target_user_id": user_id}).sort("created_at", -1).to_list(100)
    review_items = []
    for r in reviews:
        review_items.append(EndorsementReviewItem(
            id=r["id"],
            reviewer_id=r["reviewer_id"],
            reviewer_name=r["reviewer_name"],
            reviewer_avatar=r["reviewer_avatar"],
            reviewer_college=r["reviewer_college"],
            interaction_type=r.get("interaction_type", "project_collab"),
            scores=ReputationCategory(**r["scores"]),
            average_score=r["average_score"],
            comment=r["comment"],
            created_at=r["created_at"],
        ))

    cat_rep = target.get("category_reputation", {
        "communication": 5.0,
        "teamwork": 5.0,
        "reliability": 5.0,
        "professionalism": 5.0,
        "technical": 5.0,
    })

    return ReputationResponse(
        target_user_id=user_id,
        overall_score=target.get("reputation_score", 5.0),
        category_scores=ReputationCategory(**cat_rep),
        total_reviews=len(reviews),
        reviews=review_items,
    )
