"""Pydantic models and schemas for Nexus Campus."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid


# ----------------- USER & AUTH SCHEMAS -----------------

class PrivacySettings(BaseModel):
    who_can_message: str = "everyone"  # everyone, connections, none
    who_can_connect: str = "everyone"  # everyone, same_college
    who_can_call: str = "everyone"     # everyone, connections
    is_profile_public: bool = True
    show_email: bool = False


class ReputationCategory(BaseModel):
    communication: float = 5.0
    teamwork: float = 5.0
    reliability: float = 5.0
    professionalism: float = 5.0
    technical: float = 5.0


class UserBase(BaseModel):
    email: str
    full_name: str
    college: str
    degree: str
    branch: str
    current_year: str  # e.g., "2nd Year"
    grad_year: int     # e.g., 2026
    city_country: str
    bio: str = ""
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    projects_summary: str = ""
    achievements: List[str] = Field(default_factory=list)
    avatar_url: str = ""
    banner_url: str = ""
    github_url: str = ""
    linkedin_url: str = ""
    portfolio_url: str = ""


class UserSignup(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    current_year: Optional[str] = None
    grad_year: Optional[int] = None
    city_country: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    projects_summary: Optional[str] = None
    achievements: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    privacy: Optional[PrivacySettings] = None


class UserResponse(UserBase):
    id: str
    role: str = "student"  # student, admin
    reputation_score: float = 5.0
    category_reputation: ReputationCategory = Field(default_factory=ReputationCategory)
    endorsements_count: int = 0
    connections_count: int = 0
    is_suspended: bool = False
    is_verified: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    privacy: PrivacySettings = Field(default_factory=PrivacySettings)


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str = "Success"


# ----------------- CONNECTION SCHEMAS -----------------

class ConnectionRequestCreate(BaseModel):
    recipient_id: str
    note: str = ""


class ConnectionResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    recipient_id: str
    status: str  # pending, accepted, rejected
    note: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    other_user: Optional[UserResponse] = None


class ConnectionStatusResponse(BaseModel):
    status: str  # none, pending_sent, pending_received, connected
    connection_id: Optional[str] = None


# ----------------- POST & FEED SCHEMAS -----------------

class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    user_name: str
    user_avatar: str
    user_college: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PostCreate(BaseModel):
    content: str
    category: str = "general"  # general, project, achievement, event, hackathon, internship, question
    tags: List[str] = Field(default_factory=list)
    media_url: str = ""
    media_type: str = "none"  # image, video, none


class PostResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_name: str
    author_avatar: str
    author_college: str
    author_degree_year: str
    content: str
    category: str = "general"
    tags: List[str] = Field(default_factory=list)
    media_url: str = ""
    media_type: str = "none"
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_liked_by_me: bool = False
    is_bookmarked_by_me: bool = False
    is_reported: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ----------------- STORY SCHEMAS -----------------

class StoryReaction(BaseModel):
    user_id: str
    user_name: str
    emoji: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StoryCreate(BaseModel):
    media_url: str = ""
    media_type: str = "image"  # image, video, text
    caption: str = ""
    text_background_color: str = "#6366F1"


class StoryResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_avatar: str
    user_college: str
    media_url: str = ""
    media_type: str = "image"
    caption: str = ""
    text_background_color: str = "#6366F1"
    views_count: int = 0
    viewed_by_me: bool = False
    reactions: List[StoryReaction] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime


class UserStoriesGroup(BaseModel):
    user_id: str
    user_name: str
    user_avatar: str
    user_college: str
    stories: List[StoryResponse]
    has_unseen: bool = True


class StoryReactionRequest(BaseModel):
    emoji: str


class StoryReplyRequest(BaseModel):
    message: str


# ----------------- MEET SOMEONE & WEBRTC SCHEMAS -----------------

class MeetQueueJoin(BaseModel):
    intent: str = "New Friends"  # New Friends, Project Partners, Study Partners, Career Discussion, Networking, Hackathon Teammates
    mode: str = "video"  # video, chat
    same_field: bool = False
    different_college: bool = False
    same_year: bool = False
    target_skill: str = ""


class MeetSessionResponse(BaseModel):
    session_id: str
    status: str  # matched, waiting, ended
    intent: str
    mode: str
    partner_id: str
    partner_name: str
    partner_avatar: str
    partner_college: str
    partner_degree_year: str
    partner_interests: List[str]
    partner_skills: List[str]
    is_bot: bool = False
    icebreaker_topics: List[str] = Field(default_factory=list)


class MeetSignalRequest(BaseModel):
    session_id: str
    signal_type: str  # offer, answer, ice-candidate, chat, skip, end
    payload: Dict[str, Any]


class MeetSignalResponse(BaseModel):
    signals: List[Dict[str, Any]] = Field(default_factory=list)


# ----------------- DIRECT 1-1 CALL SCHEMAS -----------------

class CallInitiateRequest(BaseModel):
    recipient_id: str
    call_type: str = "video"  # video, audio


class CallRespondRequest(BaseModel):
    action: str  # accept, reject, busy


class CallSessionResponse(BaseModel):
    call_id: str
    caller_id: str
    caller_name: str
    caller_avatar: str
    caller_college: str
    recipient_id: str
    recipient_name: str
    recipient_avatar: str
    recipient_college: str
    call_type: str
    status: str  # ringing, active, rejected, ended, missed
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CallSignalRequest(BaseModel):
    call_id: str
    signal_type: str  # offer, answer, ice-candidate, chat, end
    payload: Dict[str, Any]


# ----------------- REAL-TIME CHAT SCHEMAS -----------------

class MessageCreate(BaseModel):
    content: str
    media_url: str = ""


class MessageResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_avatar: str
    recipient_id: str
    content: str
    media_url: str = ""
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConversationResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]
    other_user: UserResponse
    last_message: str = ""
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    unread_count: int = 0


class TypingNotification(BaseModel):
    is_typing: bool


# ----------------- PROJECT COLLABORATION SCHEMAS -----------------

class LookingForRole(BaseModel):
    role_name: str
    skills_needed: List[str] = Field(default_factory=list)
    count: int = 1


class TeamMember(BaseModel):
    user_id: str
    name: str
    avatar: str
    role: str
    college: str = ""


class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str = "AI/ML"  # AI/ML, Web Dev, Mobile, Robotics, Blockchain, FinTech, Design, Research, Biotech
    technologies: List[str] = Field(default_factory=list)
    looking_for_roles: List[LookingForRole] = Field(default_factory=list)
    github_url: str = ""
    demo_url: str = ""
    status: str = "recruiting"  # recruiting, in_progress, completed


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    technologies: Optional[List[str]] = None
    looking_for_roles: Optional[List[LookingForRole]] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    technologies: List[str]
    owner_id: str
    owner_name: str
    owner_avatar: str
    owner_college: str
    team_members: List[TeamMember] = Field(default_factory=list)
    looking_for_roles: List[LookingForRole] = Field(default_factory=list)
    github_url: str = ""
    demo_url: str = ""
    status: str = "recruiting"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_owner: bool = False
    has_applied: bool = False


class ProjectJoinRequestCreate(BaseModel):
    role_applied: str
    pitch: str
    skills: List[str] = Field(default_factory=list)


class ProjectJoinRequestResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    project_title: str
    applicant_id: str
    applicant_name: str
    applicant_avatar: str
    applicant_college: str
    role_applied: str
    pitch: str
    skills: List[str]
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectJoinReview(BaseModel):
    status: str  # accepted, rejected


# ----------------- MEETING SCHEDULING SCHEMAS -----------------

class TimeSlot(BaseModel):
    start_time: str  # e.g., "14:00"
    end_time: str    # e.g., "14:30"
    is_booked: bool = False


class AvailabilityDay(BaseModel):
    day: str  # Monday, Tuesday, etc.
    active: bool = True
    slots: List[TimeSlot] = Field(default_factory=list)


class AvailabilitySet(BaseModel):
    topics: List[str] = Field(default_factory=list)
    timezone: str = "UTC"
    weekly_schedule: List[AvailabilityDay] = Field(default_factory=list)


class AvailabilityResponse(BaseModel):
    user_id: str
    topics: List[str]
    timezone: str
    weekly_schedule: List[AvailabilityDay]


class MeetingBookRequest(BaseModel):
    host_id: str
    title: str
    description: str = ""
    topic: str
    meeting_date: str  # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM


class MeetingResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host_id: str
    host_name: str
    host_avatar: str
    host_college: str
    guest_id: str
    guest_name: str
    guest_avatar: str
    guest_college: str
    title: str
    description: str = ""
    topic: str
    meeting_date: str
    start_time: str
    end_time: str
    meeting_link: str = ""
    status: str = "upcoming"  # upcoming, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ----------------- COLLEGE COMMUNITY SCHEMAS -----------------

class CampusEvent(BaseModel):
    title: str
    date: str
    description: str
    location: str
    type: str  # Hackathon, Workshop, Meetup, Career Fair


class CollegeResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    short_name: str
    banner_url: str
    logo_url: str
    location: str
    about: str
    student_count: int = 0
    departments: List[str] = Field(default_factory=list)
    followers_count: int = 0
    is_following: bool = False
    events: List[CampusEvent] = Field(default_factory=list)


class CollegeCreate(BaseModel):
    name: str
    short_name: str
    banner_url: str = ""
    logo_url: str = ""
    location: str
    about: str
    departments: List[str] = Field(default_factory=list)


# ----------------- REPUTATION & ENDORSEMENT SCHEMAS -----------------

class EndorsementCreate(BaseModel):
    target_user_id: str
    interaction_type: str = "project_collab"  # project_collab, meeting, study_session, networking
    communication: int = Field(ge=1, le=5)
    teamwork: int = Field(ge=1, le=5)
    reliability: int = Field(ge=1, le=5)
    professionalism: int = Field(ge=1, le=5)
    technical: int = Field(ge=1, le=5)
    comment: str


class EndorsementReviewItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reviewer_id: str
    reviewer_name: str
    reviewer_avatar: str
    reviewer_college: str
    interaction_type: str
    scores: ReputationCategory
    average_score: float
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReputationResponse(BaseModel):
    target_user_id: str
    overall_score: float
    category_scores: ReputationCategory
    total_reviews: int
    reviews: List[EndorsementReviewItem] = Field(default_factory=list)


# ----------------- NOTIFICATION SCHEMAS -----------------

class NotificationResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    actor_id: str
    actor_name: str
    actor_avatar: str
    type: str  # connection_request, connection_accepted, message, incoming_call, post_like, post_comment, story_reply, project_request, project_accepted, meeting_booked, meeting_cancelled, reputation_endorsed
    title: str
    message: str
    link: str = ""
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ----------------- SAFETY & ADMIN SCHEMAS -----------------

class ReportCreate(BaseModel):
    target_type: str  # user, post, comment, story, message
    target_id: str
    reason: str
    details: str = ""


class ReportResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_id: str
    reporter_name: str
    target_type: str
    target_id: str
    target_name: str = ""
    reason: str
    details: str = ""
    status: str = "pending"  # pending, reviewed, dismissed, action_taken
    action_notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BlockRequest(BaseModel):
    blocked_user_id: str


class BlockedUserResponse(BaseModel):
    blocked_user_id: str
    full_name: str
    avatar_url: str
    college: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    new_registrations_this_week: int
    total_posts: int
    total_messages: int
    total_video_calls: int
    total_projects: int
    pending_reports: int
    suspended_accounts: int
    category_distribution: Dict[str, int] = Field(default_factory=dict)
    activity_timeline: List[Dict[str, Any]] = Field(default_factory=list)


class UserModerationAction(BaseModel):
    action: str  # suspend, unsuspend, warn, change_role
    reason: str = ""


# ----------------- AI SMART FEATURES SCHEMAS -----------------

class BioEnhanceRequest(BaseModel):
    current_bio: str
    major: str
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    tone: str = "professional"  # professional, ambitious, creative


class BioEnhanceResponse(BaseModel):
    suggestions: List[str]


class ProjectMatchRequest(BaseModel):
    project_id: str
    role_name: str


class ProjectMatchResponse(BaseModel):
    match_percentage: int
    match_strengths: List[str]
    missing_skills: List[str]
    suggested_pitch: str


class IcebreakerRequest(BaseModel):
    partner_interests: List[str]
    my_interests: List[str]
    intent: str


class IcebreakerResponse(BaseModel):
    questions: List[str]
    shared_topics: List[str]


# ----------------- GLOBAL SEARCH SCHEMAS -----------------

class SearchResultResponse(BaseModel):
    students: List[UserResponse] = Field(default_factory=list)
    colleges: List[CollegeResponse] = Field(default_factory=list)
    projects: List[ProjectResponse] = Field(default_factory=list)
    posts: List[PostResponse] = Field(default_factory=list)
