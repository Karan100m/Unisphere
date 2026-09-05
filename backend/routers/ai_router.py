"""AI-Powered Smart Features Router using EMERGENT_LLM_KEY."""

import os
import json
import logging
from fastapi import APIRouter, HTTPException, status, Depends
from lib.auth import get_current_user_required
from lib.db import db
from models.schemas import (
    BioEnhanceRequest,
    BioEnhanceResponse,
    ProjectMatchRequest,
    ProjectMatchResponse,
    IcebreakerRequest,
    IcebreakerResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])



@router.post("/enhance-bio", response_model=BioEnhanceResponse)
async def enhance_bio(
    input_data: BioEnhanceRequest,
    current_user: dict = Depends(get_current_user_required),
):
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    current_bio = input_data.current_bio or "Passionate student eager to learn and build things."
    skills_str = ", ".join(input_data.skills) if input_data.skills else "General Tech"
    interests_str = ", ".join(input_data.interests) if input_data.interests else "Startups, Networking"

    if EMERGENT_AVAILABLE and api_key and not api_key.startswith("sk-placeholder"):
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"bio-{current_user['id']}",
                system_message="You are an expert student career coach and branding specialist. Return exactly 3 distinct, compelling, concise elevator bio options (max 25 words each) formatted as a JSON array of strings: [\"option 1\", \"option 2\", \"option 3\"]. No markdown outside the json."
            ).with_model("openai", "gpt-5.4")

            prompt = f"Student major: {input_data.major}. Skills: {skills_str}. Interests: {interests_str}. Current draft: {current_bio}. Tone: {input_data.tone}."
            response_text = await chat.send_message(UserMessage(text=prompt))
            
            # Clean up response
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            suggestions = json.loads(cleaned.strip())
            if isinstance(suggestions, list) and len(suggestions) > 0:
                return BioEnhanceResponse(suggestions=suggestions[:3])
        except Exception as exc:
            logger.error("AI bio enhancement failed: %s", exc)

    # Fallback high quality suggestions
    fallback_templates = [
        f"🚀 {input_data.major} undergrad passionate about {interests_str.split(',')[0]}. Building impactful projects with {skills_str.split(',')[0]} and seeking ambitious collaborators.",
        f"💡 Curious builder exploring the intersection of {input_data.major} & modern software. Always open for hackathons, research discussions, and coffee chats.",
        f"⚡ Focused on shipping high-scale software using {skills_str}. Active student researcher & team player open for summer collaborations.",
    ]
    return BioEnhanceResponse(suggestions=fallback_templates)


@router.post("/match-project", response_model=ProjectMatchResponse)
async def calculate_project_match(
    input_data: ProjectMatchRequest,
    current_user: dict = Depends(get_current_user_required),
):
    project = await db.projects.find_one({"id": input_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user_skills = [s.lower() for s in current_user.get("skills", [])]
    project_tech = [t.lower() for t in project.get("technologies", [])]

    # Find matching role
    target_role_skills = []
    for r in project.get("looking_for_roles", []):
        if r.get("role_name", "").lower() == input_data.role_name.lower():
            target_role_skills = [s.lower() for s in r.get("skills_needed", [])]
            break

    req_skills = list(set(project_tech + target_role_skills))
    matched = [s for s in req_skills if any(us in s or s in us for us in user_skills)]
    missing = [s for s in req_skills if s not in matched]

    percentage = 95 if not req_skills else max(60, int((len(matched) / max(len(req_skills), 1)) * 100))
    if len(matched) == 0 and len(req_skills) > 0:
        percentage = 65

    matched_names = [m.capitalize() for m in matched] if matched else ["Eagerness to learn", "Fast adaptation"]
    missing_names = [m.capitalize() for m in missing] if missing else []

    suggested_pitch = (
        f"Hi {project.get('owner_name', 'Lead')}, I'm a {current_user.get('current_year', '2nd Year')} {current_user.get('degree', 'CS')} student at {current_user.get('college', 'University')}. "
        f"I'm really excited by '{project['title']}' and have hands-on experience with {', '.join(user_skills[:3]) if user_skills else 'software development'}. "
        f"I'd love to contribute as {input_data.role_name} and help take this project to the next milestone!"
    )

    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if EMERGENT_AVAILABLE and api_key and not api_key.startswith("sk-placeholder"):
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"proj-match-{current_user['id']}",
                system_message="You are a smart technical recruitment assistant for university students. Write a 2-sentence tailored, authentic pitch for a student applying to a project team. Keep it under 50 words, enthusiastic and professional."
            ).with_model("openai", "gpt-5.4")

            prompt = f"Applicant: {current_user['full_name']} ({current_user.get('degree')}, {current_user.get('college')}). Skills: {', '.join(user_skills)}. Applying for: {input_data.role_name} on Project: '{project['title']}' (Tech: {', '.join(project_tech)})."
            ai_pitch = await chat.send_message(UserMessage(text=prompt))
            if ai_pitch and len(ai_pitch.strip()) > 20:
                suggested_pitch = ai_pitch.strip()
        except Exception as exc:
            logger.error("AI project pitch generation failed: %s", exc)

    return ProjectMatchResponse(
        match_percentage=percentage,
        match_strengths=matched_names,
        missing_skills=missing_names[:3],
        suggested_pitch=suggested_pitch,
    )


@router.post("/icebreakers", response_model=IcebreakerResponse)
async def generate_icebreakers(
    input_data: IcebreakerRequest,
    current_user: dict = Depends(get_current_user_required),
):
    shared = list(set(input_data.my_interests).intersection(set(input_data.partner_interests)))
    if not shared:
        shared = ["Campus Life", "Tech Trends", "Weekend Side Projects"]

    questions = [
        f"What got you started in {shared[0]}?",
        f"What's your biggest takeaway from your university journey so far?",
        "If you had $10k and 1 month to build any student app, what would you launch?",
    ]

    return IcebreakerResponse(
        questions=questions,
        shared_topics=shared,
    )
