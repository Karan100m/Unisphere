"""Posts and social feed router: create, like, comment, bookmark, report."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

from lib.db import db
from lib.auth import get_current_user_required, get_current_user_optional
from models.schemas import (
    PostCreate,
    PostResponse,
    CommentCreate,
    CommentResponse,
    ReportCreate,
)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=List[PostResponse])
async def get_posts(
    category: Optional[str] = None,
    college: Optional[str] = None,
    author_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if college:
        query["author_college"] = college
    if author_id:
        query["author_id"] = author_id
    if search:
        query["$or"] = [
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search]}},
            {"author_name": {"$regex": search, "$options": "i"}},
        ]

    # Filter out blocked users if logged in
    if current_user:
        blocks = await db.blocks.find({
            "$or": [{"blocker_id": current_user["id"]}, {"blocked_user_id": current_user["id"]}]
        }).to_list(200)
        blocked_user_ids = [b["blocked_user_id"] if b["blocker_id"] == current_user["id"] else b["blocker_id"] for b in blocks]
        if blocked_user_ids:
            query["author_id"] = {"$nin": blocked_user_ids}

    posts_cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await posts_cursor.to_list(limit)

    # Decorate with liked/bookmarked status
    user_likes_set = set()
    user_bookmarks_set = set()
    if current_user:
        likes = await db.post_likes.find({"user_id": current_user["id"]}).to_list(1000)
        user_likes_set = {l["post_id"] for l in likes}
        bookmarks = await db.post_bookmarks.find({"user_id": current_user["id"]}).to_list(1000)
        user_bookmarks_set = {b["post_id"] for b in bookmarks}

    result = []
    for p in posts:
        p["is_liked_by_me"] = p["id"] in user_likes_set
        p["is_bookmarked_by_me"] = p["id"] in user_bookmarks_set
        result.append(PostResponse(**p))
    return result


@router.post("", response_model=PostResponse)
async def create_post(
    input_data: PostCreate,
    current_user: dict = Depends(get_current_user_required),
):
    post_id = str(uuid.uuid4())
    post_dict = {
        "id": post_id,
        "author_id": current_user["id"],
        "author_name": current_user["full_name"],
        "author_avatar": current_user.get("avatar_url", ""),
        "author_college": current_user.get("college", "University"),
        "author_degree_year": f"{current_user.get('degree', 'Student')} • {current_user.get('current_year', '1st Year')}",
        "content": input_data.content,
        "category": input_data.category,
        "tags": input_data.tags,
        "media_url": input_data.media_url,
        "media_type": input_data.media_type,
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "is_reported": False,
        "created_at": datetime.utcnow(),
    }
    await db.posts.insert_one(post_dict)
    post_dict["is_liked_by_me"] = False
    post_dict["is_bookmarked_by_me"] = False
    return PostResponse(**post_dict)


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own posts.")

    await db.posts.delete_one({"id": post_id})
    await db.post_likes.delete_many({"post_id": post_id})
    await db.post_comments.delete_many({"post_id": post_id})
    await db.post_bookmarks.delete_many({"post_id": post_id})
    return {"message": "Post deleted successfully"}


@router.post("/{post_id}/like")
async def toggle_like(
    post_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = await db.post_likes.find_one({"post_id": post_id, "user_id": current_user["id"]})
    if existing_like:
        await db.post_likes.delete_one({"post_id": post_id, "user_id": current_user["id"]})
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": max(0, post.get("likes_count", 1) - 1)}
    else:
        await db.post_likes.insert_one({
            "post_id": post_id,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
        })
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})

        # Notify post author if not self
        if post["author_id"] != current_user["id"]:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": post["author_id"],
                "actor_id": current_user["id"],
                "actor_name": current_user["full_name"],
                "actor_avatar": current_user.get("avatar_url", ""),
                "type": "post_like",
                "title": "Post Liked",
                "message": f"{current_user['full_name']} liked your post.",
                "link": f"/feed?post={post_id}",
                "is_read": False,
                "created_at": datetime.utcnow(),
            })

        return {"liked": True, "likes_count": post.get("likes_count", 0) + 1}


@router.post("/{post_id}/bookmark")
async def toggle_bookmark(
    post_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_bm = await db.post_bookmarks.find_one({"post_id": post_id, "user_id": current_user["id"]})
    if existing_bm:
        await db.post_bookmarks.delete_one({"post_id": post_id, "user_id": current_user["id"]})
        return {"bookmarked": False}
    else:
        await db.post_bookmarks.insert_one({
            "post_id": post_id,
            "user_id": current_user["id"],
            "created_at": datetime.utcnow(),
        })
        return {"bookmarked": True}


@router.get("/bookmarked", response_model=List[PostResponse])
async def get_bookmarked_posts(current_user: dict = Depends(get_current_user_required)):
    bookmarks = await db.post_bookmarks.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    post_ids = [b["post_id"] for b in bookmarks]
    posts = await db.posts.find({"id": {"$in": post_ids}}).to_list(100)

    likes = await db.post_likes.find({"user_id": current_user["id"]}).to_list(1000)
    liked_set = {l["post_id"] for l in likes}

    result = []
    for p in posts:
        p["is_liked_by_me"] = p["id"] in liked_set
        p["is_bookmarked_by_me"] = True
        result.append(PostResponse(**p))
    return result


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str):
    comments = await db.post_comments.find({"post_id": post_id}).sort("created_at", 1).to_list(200)
    return [CommentResponse(**c) for c in comments]


@router.post("/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    input_data: CommentCreate,
    current_user: dict = Depends(get_current_user_required),
):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment_id = str(uuid.uuid4())
    comment_dict = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": current_user["id"],
        "user_name": current_user["full_name"],
        "user_avatar": current_user.get("avatar_url", ""),
        "user_college": current_user.get("college", ""),
        "content": input_data.content,
        "created_at": datetime.utcnow(),
    }
    await db.post_comments.insert_one(comment_dict)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})

    # Notify author
    if post["author_id"] != current_user["id"]:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": post["author_id"],
            "actor_id": current_user["id"],
            "actor_name": current_user["full_name"],
            "actor_avatar": current_user.get("avatar_url", ""),
            "type": "post_comment",
            "title": "New Comment",
            "message": f"{current_user['full_name']} commented on your post: \"{input_data.content[:40]}...\"",
            "link": f"/feed?post={post_id}",
            "is_read": False,
            "created_at": datetime.utcnow(),
        })

    return CommentResponse(**comment_dict)
