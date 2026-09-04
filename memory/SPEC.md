# Unisphere - Living Specification (SPEC.md)

## 1. Product Overview
Unisphere is a student-centric platform combining **LinkedIn-style professional networking**, **Instagram-style social feeds & 24h stories**, **Discord-style chat**, **OmeTV-style spontaneous video discovery ("Meet Someone")**, and **Calendly-style meeting scheduling** for undergraduate students.

## 2. Core Modules & Functionality
- **Authentication & Profiles**: Sign up, Login, Multi-step student attributes (College, Degree, Major, Current Year, Grad Year, City, Skills, Interests), Profile edit with AI Bio Enhancer, Privacy Controls.
- **Social Feed**: Post creation (Text, Images, Project announcements, Questions), Category filters, Real-time Like toggle, Comments drawer, Share, Bookmark, and Report actions.
- **24-Hour Stories**: Top ribbon carousel with avatar aura gradients, full-screen story viewer with progress bars, emoji reactions, and direct message replies.
- **Student Discovery**: Multi-filter search by College, Degree, Major, Year, Skills, Interests, and City with reputation tags.
- **"Meet Someone" (Spontaneous Video & Chat Matching)**: Interest intent chips, Skip/Next, Video/Chat mode, WebRTC peer signaling exchange, and responsive interactive simulation bots for instant solo testing.
- **1-on-1 Video Calling**: WebRTC peer-to-peer calling with mic/camera toggles, screen-sharing, connection state indicators, in-call overlay text chat, and incoming call ringing popup.
- **Real-Time Chat & Messaging**: Split-view messaging hub, unread counter badges, instant message history, and typing indicators.
- **Project Collaboration Hub**: Browse student projects, view required roles & skill sets, submit join requests with AI-assisted customized pitch letters, and owner applicant review management.
- **Meeting Scheduler**: Calendly-style weekly availability configuration, time slot selector, meeting booking flow, and meeting status tracking (Upcoming, Completed, Cancelled).
- **College Communities**: Community hubs for Stanford, MIT, Oxford, LPU, UC Berkeley with follower counts, student rosters, and upcoming campus events.
- **Reputation & Peer Endorsement**: Multi-dimensional rating system (Communication, Teamwork, Reliability, Professionalism, Technical Contribution) with anti-spam safeguards and testimonials.
- **Safety, Moderation & Admin Dashboard**: Reporting engine, user blocking/unblocking, Admin metrics cards, platform analytics charts, moderation queue, user suspension/unsuspension, and post deletion.
- **Global Search**: Instant multi-entity search spanning Students, Colleges, Projects, and Feed Posts.
- **AI-Assisted Features**: Bio Enhancer, Project Match Calculator & Tailored Pitch Generator, and "Meet Someone" Icebreaker Generator via `emergentintegrations` (with Universal Key).

## 3. Data Entities
- `users`: User profiles, student details, hashed passwords, reputation stats, privacy settings.
- `connections`: Connection graph between students (pending, accepted, rejected).
- `posts`, `post_likes`, `post_comments`, `post_bookmarks`: Social feed items.
- `stories`: 24h stories with auto-expiration tracking and reactions.
- `conversations`, `messages`: Real-time chat messages and unread counts.
- `projects`, `project_requests`: Collaborative projects, roles, and applications.
- `availabilities`, `meetings`: Bookable time slots and scheduled meetings.
- `colleges`, `college_follows`: Campus hubs and student members.
- `reputation_reviews`: Peer endorsement ratings and reviews.
- `notifications`: Notifications feed.
- `reports`, `blocks`: Safety moderation and user blocking records.
- `meet_sessions`, `call_sessions`: Video signaling and session coordination.

## 4. Test Accounts & Personas
- **Karan Kumar** (`karan@unisphere.edu` / `Student@123456`): LPU B.Tech CSE 2nd Year, AI/ML builder.
- **Maya Lin** (`maya@stanford.edu` / `Student@123456`): Stanford Symbolic Systems 3rd Year, UI/UX & Human-AI interaction.
- **Aarav Sharma** (`aarav@mit.edu` / `Student@123456`): MIT EECS 4th Year, Distributed Systems in Rust.
- **Elena Rostova** (`elena@oxford.edu` / `Student@123456`): Oxford PPE 2nd Year, FinTech & AI Policy.
- **David Chen** (`david@berkeley.edu` / `Student@123456`): UC Berkeley Bioengineering & CS 3rd Year, OpenMed lead.
- **Unisphere Admin** (`admin@unisphere.edu` / `Admin@123456`): Platform administrator.

## 5. Brand & Design System (Unisphere)
- **Identity**: "Unisphere" — social-first creator & student community. Wordmark is `Uni` (white) + `sphere` (amber-400); logo mark is a violet→amber gradient tile with a `U`.
- **Palette**: Vibrant Violet primary (`#8B5CF6` dark / `#7C3AED` light) with Sunset Amber accent (`#FBBF24`) and a pink midtone (`#F472B6`) for gradients. Dark surfaces are a deep aubergine (`#0B0713` bg, `#16101F` cards) rather than neutral slate, so amber reads as sunset rather than warning.
- **Typography**: `Outfit Variable` for headings (display/creator feel), `Plus Jakarta Sans Variable` for body, `JetBrains Mono Variable` for timers, slot times and tech tags. All loaded via @fontsource packages in `index.css`.
- **Signature effects**: `.sunset-text` (violet→pink→amber gradient text), `.electric-glow` (violet core + amber rim shadow), `.avatar-story-aura` (conic violet/pink/amber story ring), `.aurora-blob` (drifting background orbs), `.pulse-ring` (matching/ringing pulse).
- Toasts are anchored **bottom-right** so they never overlap the notification bell or user menu in the top bar.
