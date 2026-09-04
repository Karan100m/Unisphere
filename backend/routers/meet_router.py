"""Meet Someone router: random student matching, intent tags, responsive simulation & WebRTC signaling."""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import random

from lib.db import db
from lib.auth import get_current_user_required
from models.schemas import (
    MeetQueueJoin,
    MeetSessionResponse,
    MeetSignalRequest,
    MeetSignalResponse,
)

router = APIRouter(prefix="/meet", tags=["meet"])

# In-memory transient signaling exchange for active WebRTC sessions
ACTIVE_SIGNAL_QUEUES: Dict[str, List[Dict[str, Any]]] = {}

# Mock student partner bots with realistic personas for instant solo testing and rich discovery
MOCK_PARTNERS = [
    {
        "id": "partner-bot-maya",
        "name": "Maya Lin",
        "avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
        "college": "Stanford University",
        "degree_year": "B.S. Symbolic Systems • 3rd Year",
        "interests": ["Human-AI Interaction", "UI/UX Systems", "Hackathons", "Tech Startups"],
        "skills": ["Figma", "React", "PyTorch", "User Research"],
        "icebreakers": [
            "What's the coolest side project you're currently building?",
            "If you could get mentored by any tech founder, who would it be?",
            "What's your college's best-kept secret study spot?",
        ],
    },
    {
        "id": "partner-bot-aarav",
        "name": "Aarav Sharma",
        "avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
        "college": "Massachusetts Institute of Technology (MIT)",
        "degree_year": "B.S. EECS • 4th Year",
        "interests": ["Distributed Systems", "Cloud Architecture", "Robotics", "Open Source"],
        "skills": ["Rust", "Go", "Kubernetes", "C++"],
        "icebreakers": [
            "What got you into computer science / engineering in the first place?",
            "Are you planning to work in industry or pursue research after undergrad?",
            "What's the hardest debugging session you've ever had?",
        ],
    },
    {
        "id": "partner-bot-elena",
        "name": "Elena Rostova",
        "avatar": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
        "college": "University of Oxford",
        "degree_year": "B.A. PPE & Data Science • 2nd Year",
        "interests": ["AI Policy", "FinTech", "Economic Modeling", "Debate"],
        "skills": ["Python", "SQL", "Public Policy", "Econometrics"],
        "icebreakers": [
            "What's one tech regulation or policy debate you follow closely?",
            "Have you participated in any international hackathons or debates?",
            "What's a book or paper that changed how you think about tech?",
        ],
    },
    {
        "id": "partner-bot-david",
        "name": "David Chen",
        "avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
        "college": "UC Berkeley",
        "degree_year": "B.S. Bioengineering & CS • 3rd Year",
        "interests": ["Computational Biology", "HealthTech", "Startups", "Rock Climbing"],
        "skills": ["Next.js", "PyTorch", "Bioinformatics", "TypeScript"],
        "icebreakers": [
            "What inspired you to explore interdisciplinary fields?",
            "What's your favorite tech stack to build MVPs with?",
            "Any cool hackathon ideas you've been brainstorming recently?",
        ],
    },
]


@router.post("/queue/join", response_model=MeetSessionResponse)
async def join_matching_queue(
    input_data: MeetQueueJoin,
    current_user: dict = Depends(get_current_user_required),
):
    user_id = current_user["id"]
    session_id = f"meet-{uuid.uuid4().hex[:12]}"

    # Look for another real student in the queue (or match with a student from database)
    potential_peers = await db.users.find({
        "id": {"$ne": user_id},
        "is_suspended": False,
    }).to_list(20)

    # Filter by user preferences if specified
    candidates = []
    for p in potential_peers:
        if input_data.different_college and p.get("college") == current_user.get("college"):
            continue
        if input_data.same_field and p.get("branch") != current_user.get("branch"):
            continue
        if input_data.same_year and p.get("current_year") != current_user.get("current_year"):
            continue
        if input_data.target_skill and input_data.target_skill.lower() not in [s.lower() for s in p.get("skills", [])]:
            continue
        candidates.append(p)

    if not candidates:
        candidates = potential_peers

    partner_user = None
    is_bot = False
    if candidates:
        partner_user = random.choice(candidates)
        partner_info = {
            "id": partner_user["id"],
            "name": partner_user["full_name"],
            "avatar": partner_user.get("avatar_url", ""),
            "college": partner_user.get("college", "University"),
            "degree_year": f"{partner_user.get('degree', 'Student')} • {partner_user.get('current_year', 'Year')}",
            "interests": partner_user.get("interests", ["Tech", "Networking", "Projects"]),
            "skills": partner_user.get("skills", ["Python", "JavaScript"]),
            "is_bot": False,
        }
    else:
        # Fallback to simulation partner bot
        bot = random.choice(MOCK_PARTNERS)
        partner_info = {
            "id": bot["id"],
            "name": bot["name"],
            "avatar": bot["avatar"],
            "college": bot["college"],
            "degree_year": bot["degree_year"],
            "interests": bot["interests"],
            "skills": bot["skills"],
            "is_bot": True,
        }
        is_bot = True

    # Generate custom icebreaker topics based on intent
    intent_icebreakers = {
        "New Friends": [
            "What's your favorite hangout spot on campus?",
            "What hobby keeps you sane during exam weeks?",
            "What music/podcast are you hooked on right now?",
        ],
        "Project Partners": [
            "What project are you most excited to build this semester?",
            "What's your primary tech stack vs the stack you want to learn?",
            "How do you like to divide work when collaborating?",
        ],
        "Study Partners": [
            "What's the toughest course you're taking right now?",
            "Are you a morning library grinder or late-night crammer?",
            "Any favorite resources/tools for your major?",
        ],
        "Career Discussion": [
            "What dream internships or companies are on your radar?",
            "Have you started prepping for technical or behavioral interviews?",
            "What's one piece of advice an upperclassman gave you?",
        ],
        "Networking": [
            "What brings you to Unisphere today?",
            "What's your biggest goal before graduation?",
            "Are you involved in any campus clubs or student chapters?",
        ],
        "Hackathon Teammates": [
            "What upcoming hackathons are you planning to enter?",
            "What role do you usually play in a hackathon team (Frontend, Backend, AI, Pitch)?",
            "What's the best hackathon project you've seen or made?",
        ],
    }
    topics = intent_icebreakers.get(input_data.intent, intent_icebreakers["New Friends"])

    # Create session record
    session_record = {
        "id": session_id,
        "user1_id": user_id,
        "user2_id": partner_info["id"],
        "intent": input_data.intent,
        "mode": input_data.mode,
        "status": "matched",
        "is_bot": is_bot,
        "created_at": datetime.utcnow(),
    }
    await db.meet_sessions.insert_one(session_record)
    ACTIVE_SIGNAL_QUEUES[session_id] = []

    return MeetSessionResponse(
        session_id=session_id,
        status="matched",
        intent=input_data.intent,
        mode=input_data.mode,
        partner_id=partner_info["id"],
        partner_name=partner_info["name"],
        partner_avatar=partner_info["avatar"],
        partner_college=partner_info["college"],
        partner_degree_year=partner_info["degree_year"],
        partner_interests=partner_info["interests"],
        partner_skills=partner_info["skills"],
        is_bot=is_bot,
        icebreaker_topics=topics,
    )


@router.post("/signal/send")
async def send_meet_signal(
    signal_data: MeetSignalRequest,
    current_user: dict = Depends(get_current_user_required),
):
    session_id = signal_data.session_id
    if session_id not in ACTIVE_SIGNAL_QUEUES:
        ACTIVE_SIGNAL_QUEUES[session_id] = []

    entry = {
        "sender_id": current_user["id"],
        "signal_type": signal_data.signal_type,
        "payload": signal_data.payload,
        "timestamp": datetime.utcnow().isoformat(),
    }
    ACTIVE_SIGNAL_QUEUES[session_id].append(entry)

    # Keep signal buffer lean
    if len(ACTIVE_SIGNAL_QUEUES[session_id]) > 50:
        ACTIVE_SIGNAL_QUEUES[session_id] = ACTIVE_SIGNAL_QUEUES[session_id][-50:]

    return {"status": "sent"}


@router.get("/signal/poll/{session_id}", response_model=MeetSignalResponse)
async def poll_meet_signals(
    session_id: str,
    last_count: int = 0,
    current_user: dict = Depends(get_current_user_required),
):
    signals = ACTIVE_SIGNAL_QUEUES.get(session_id, [])
    # Filter for signals from the other party or system messages
    other_signals = [s for s in signals if s["sender_id"] != current_user["id"]]
    return MeetSignalResponse(signals=other_signals)


@router.post("/session/{session_id}/end")
async def end_meet_session(
    session_id: str,
    current_user: dict = Depends(get_current_user_required),
):
    await db.meet_sessions.update_one(
        {"id": session_id},
        {"$set": {"status": "ended"}},
    )
    ACTIVE_SIGNAL_QUEUES.pop(session_id, None)
    return {"message": "Session ended"}
