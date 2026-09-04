export interface PrivacySettings {
  who_can_message: string;
  who_can_connect: string;
  who_can_call: string;
  is_profile_public: boolean;
  show_email: boolean;
}

export interface ReputationCategory {
  communication: number;
  teamwork: number;
  reliability: number;
  professionalism: number;
  technical: number;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  college: string;
  degree: string;
  branch: string;
  current_year: string;
  grad_year: number;
  city_country: string;
  bio: string;
  skills: string[];
  interests: string[];
  projects_summary: string;
  achievements: string[];
  avatar_url: string;
  banner_url: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  role: 'student' | 'admin';
  reputation_score: number;
  category_reputation: ReputationCategory;
  endorsements_count: number;
  connections_count: number;
  is_suspended: boolean;
  is_verified: boolean;
  created_at: string;
  privacy: PrivacySettings;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  message: string;
}

export interface UserSignupInput {
  email: string;
  password: string;
  full_name: string;
  college: string;
  degree: string;
  branch: string;
  current_year: string;
  grad_year: number;
  city_country: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  projects_summary?: string;
  achievements?: string[];
  avatar_url?: string;
  banner_url?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
}

export interface UserUpdateInput {
  full_name?: string;
  college?: string;
  degree?: string;
  branch?: string;
  current_year?: string;
  grad_year?: number;
  city_country?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  projects_summary?: string;
  achievements?: string[];
  avatar_url?: string;
  banner_url?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  privacy?: PrivacySettings;
}

export interface ConnectionResponse {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  note: string;
  created_at: string;
  updated_at: string;
  other_user?: UserResponse;
}

export interface ConnectionStatusResponse {
  status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  connection_id?: string;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_college: string;
  content: string;
  created_at: string;
}

export interface PostResponse {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_college: string;
  author_degree_year: string;
  content: string;
  category: string;
  tags: string[];
  media_url: string;
  media_type: 'image' | 'video' | 'none';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked_by_me: boolean;
  is_bookmarked_by_me: boolean;
  is_reported: boolean;
  created_at: string;
}

export interface StoryReaction {
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface StoryResponse {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_college: string;
  media_url: string;
  media_type: 'image' | 'video' | 'text';
  caption: string;
  text_background_color: string;
  views_count: number;
  viewed_by_me: boolean;
  reactions: StoryReaction[];
  created_at: string;
  expires_at: string;
}

export interface UserStoriesGroup {
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_college: string;
  stories: StoryResponse[];
  has_unseen: boolean;
}

export interface MeetSessionResponse {
  session_id: string;
  status: 'matched' | 'waiting' | 'ended';
  intent: string;
  mode: 'video' | 'chat';
  partner_id: string;
  partner_name: string;
  partner_avatar: string;
  partner_college: string;
  partner_degree_year: string;
  partner_interests: string[];
  partner_skills: string[];
  is_bot: boolean;
  icebreaker_topics: string[];
}

export interface CallSessionResponse {
  call_id: string;
  caller_id: string;
  caller_name: string;
  caller_avatar: string;
  caller_college: string;
  recipient_id: string;
  recipient_name: string;
  recipient_avatar: string;
  recipient_college: string;
  call_type: 'video' | 'audio';
  status: 'ringing' | 'active' | 'rejected' | 'ended' | 'missed';
  created_at: string;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  recipient_id: string;
  content: string;
  media_url: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  participants: string[];
  other_user: UserResponse;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface LookingForRole {
  role_name: string;
  skills_needed: string[];
  count: number;
}

export interface TeamMember {
  user_id: string;
  name: string;
  avatar: string;
  role: string;
  college: string;
}

export interface ProjectResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  owner_id: string;
  owner_name: string;
  owner_avatar: string;
  owner_college: string;
  team_members: TeamMember[];
  looking_for_roles: LookingForRole[];
  github_url: string;
  demo_url: string;
  status: 'recruiting' | 'in_progress' | 'completed';
  created_at: string;
  is_owner: boolean;
  has_applied: boolean;
}

export interface ProjectJoinRequestResponse {
  id: string;
  project_id: string;
  project_title: string;
  applicant_id: string;
  applicant_name: string;
  applicant_avatar: string;
  applicant_college: string;
  role_applied: string;
  pitch: string;
  skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface AvailabilityDay {
  day: string;
  active: boolean;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  user_id: string;
  topics: string[];
  timezone: string;
  weekly_schedule: AvailabilityDay[];
}

export interface MeetingResponse {
  id: string;
  host_id: string;
  host_name: string;
  host_avatar: string;
  host_college: string;
  guest_id: string;
  guest_name: string;
  guest_avatar: string;
  guest_college: string;
  title: string;
  description: string;
  topic: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

export interface CampusEvent {
  title: string;
  date: string;
  description: string;
  location: string;
  type: string;
}

export interface CollegeResponse {
  id: string;
  name: string;
  short_name: string;
  banner_url: string;
  logo_url: string;
  location: string;
  about: string;
  student_count: number;
  departments: string[];
  followers_count: number;
  is_following: boolean;
  events: CampusEvent[];
}

export interface EndorsementReviewItem {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  reviewer_college: string;
  interaction_type: string;
  scores: ReputationCategory;
  average_score: number;
  comment: string;
  created_at: string;
}

export interface ReputationResponse {
  target_user_id: string;
  overall_score: number;
  category_scores: ReputationCategory;
  total_reviews: number;
  reviews: EndorsementReviewItem[];
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar: string;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface ReportResponse {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: string;
  target_id: string;
  target_name: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  action_notes: string;
  created_at: string;
}

export interface BlockedUserResponse {
  blocked_user_id: string;
  full_name: string;
  avatar_url: string;
  college: string;
  created_at: string;
}

export interface AdminStatsResponse {
  total_users: number;
  active_users: number;
  new_registrations_this_week: number;
  total_posts: number;
  total_messages: number;
  total_video_calls: number;
  total_projects: number;
  pending_reports: number;
  suspended_accounts: number;
  category_distribution: Record<string, number>;
  activity_timeline: Array<{ day: string; active_users: number; calls: number; posts: number }>;
}

export interface BioEnhanceResponse {
  suggestions: string[];
}

export interface ProjectMatchResponse {
  match_percentage: number;
  match_strengths: string[];
  missing_skills: string[];
  suggested_pitch: string;
}

export interface IcebreakerResponse {
  questions: string[];
  shared_topics: string[];
}

export interface SearchResultResponse {
  students: UserResponse[];
  colleges: CollegeResponse[];
  projects: ProjectResponse[];
  posts: PostResponse[];
}
