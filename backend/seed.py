"""Rich Multi-Campus Database Seed Script for Unisphere."""

import asyncio
from datetime import datetime, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from lib.db import db, ensure_indexes
from lib.auth import hash_password


async def seed():
    print("🌱 Starting Unisphere Database Seeding...")

    # Drop existing collections to ensure a clean state
    collections = [
        "users", "connections", "posts", "post_likes", "post_comments",
        "post_bookmarks", "stories", "conversations", "messages",
        "projects", "project_requests", "meetings", "availabilities",
        "colleges", "college_follows", "reputation_reviews", "notifications",
        "reports", "blocks", "meet_sessions", "call_sessions"
    ]
    for col in collections:
        await db[col].drop()

    await ensure_indexes()

    default_password_hash = hash_password("Student@123456")
    admin_password_hash = hash_password("Admin@123456")

    # ---------------- 1. SEED COLLEGES ----------------
    colleges_data = [
        {
            "id": "col-stanford",
            "name": "Stanford University",
            "short_name": "Stanford",
            "banner_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "logo_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "location": "Stanford, California, USA",
            "about": "World-renowned research university leading in technology, engineering, venture entrepreneurship, and human-centered design.",
            "student_count": 17200,
            "departments": ["Computer Science", "Symbolic Systems", "Product Design", "Bioengineering", "Management Science"],
            "followers_count": 3420,
            "events": [
                {
                    "title": "Stanford TreeHacks 2026",
                    "date": "2026-04-12",
                    "description": "The largest collegiate hackathon in California. Build AI agents, climate tech, and frontier software.",
                    "location": "Arrillaga Center for Sports and Recreation",
                    "type": "Hackathon",
                },
                {
                    "title": "Silicon Valley Founder Fireside",
                    "date": "2026-04-20",
                    "description": "Student entrepreneurs pitch to top-tier angel investors and partners.",
                    "location": "Huang Engineering Center",
                    "type": "Workshop",
                }
            ]
        },
        {
            "id": "col-mit",
            "name": "Massachusetts Institute of Technology",
            "short_name": "MIT",
            "banner_url": "https://images.unsplash.com/photo-1592930954854-7d00c87d0cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "logo_url": "https://images.unsplash.com/photo-1592930954854-7d00c87d0cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "location": "Cambridge, Massachusetts, USA",
            "about": "Pioneering technological breakthroughs, artificial intelligence, robotics, quantum computing, and distributed architectures.",
            "student_count": 11800,
            "departments": ["EECS", "Mechanical Engineering", "Media Lab", "Physics", "Aeronautics"],
            "followers_count": 4890,
            "events": [
                {
                    "title": "MIT HackMIT Spring Invitational",
                    "date": "2026-04-18",
                    "description": "36-hour sprint creating cutting-edge hardware hacks and distributed systems.",
                    "location": "Stata Center, Room 123",
                    "type": "Hackathon",
                },
                {
                    "title": "Quantum Computing Symposium",
                    "date": "2026-05-02",
                    "description": "Undergrad researchers presenting quantum algorithms and superconductor benchmarks.",
                    "location": "Kresge Auditorium",
                    "type": "Meetup",
                }
            ]
        },
        {
            "id": "col-lpu",
            "name": "Lovely Professional University",
            "short_name": "LPU",
            "banner_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "logo_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "location": "Punjab, India",
            "about": "India's largest single-campus university known for vibrant tech incubators, competitive hackathons, and high-energy tech communities.",
            "student_count": 35000,
            "departments": ["Computer Science & Engineering", "Information Technology", "Biotechnology", "Robotics & Automation"],
            "followers_count": 5600,
            "events": [
                {
                    "title": "LPU TechFest & National Hackathon",
                    "date": "2026-04-15",
                    "description": "Inter-college coding challenge with prize pool of ₹10,00,000.",
                    "location": "Shanti Devi Mittal Auditorium",
                    "type": "Hackathon",
                },
                {
                    "title": "AI & Web3 Bootcamp",
                    "date": "2026-04-28",
                    "description": "Hands-on building with FastAPI, PyTorch, and smart contracts.",
                    "location": "Innovation Studio, Block 34",
                    "type": "Workshop",
                }
            ]
        },
        {
            "id": "col-oxford",
            "name": "University of Oxford",
            "short_name": "Oxford",
            "banner_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "logo_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "location": "Oxford, Oxfordshire, UK",
            "about": "Historic collegiate university fostering rigorous analytical research, economics, governance, and interdisciplinary data sciences.",
            "student_count": 24000,
            "departments": ["Philosophy, Politics & Economics", "Computer Science", "Mathematical Institute", "Said Business School"],
            "followers_count": 4120,
            "events": [
                {
                    "title": "Oxford AI Policy & Governance Summit",
                    "date": "2026-05-10",
                    "description": "Student debate on global frontier AI safeguards and open weights.",
                    "location": "Oxford Union Chamber",
                    "type": "Meetup",
                }
            ]
        },
        {
            "id": "col-berkeley",
            "name": "UC Berkeley",
            "short_name": "Cal / Berkeley",
            "banner_url": "https://images.unsplash.com/photo-1622470190232-81df3782484b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "logo_url": "https://images.unsplash.com/photo-1622470190232-81df3782484b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "location": "Berkeley, California, USA",
            "about": "Renowned public research powerhouse at the forefront of open source, bioengineering, distributed data, and climate technologies.",
            "student_count": 32000,
            "departments": ["Electrical Engineering & CS", "Bioengineering", "Data Science", "Haas School of Business"],
            "followers_count": 3890,
            "events": [
                {
                    "title": "CalHacks Fellowship Demo Day",
                    "date": "2026-04-22",
                    "description": "Top student teams showcasing open source AI tooling and biotechnology apps.",
                    "location": "Pauley Ballroom",
                    "type": "Hackathon",
                }
            ]
        }
    ]
    await db.colleges.insert_many(colleges_data)

    # ---------------- 2. SEED USERS ----------------
    users_data = [
        {
            "id": "usr-karan",
            "email": "karan@unisphere.edu",
            "password_hash": default_password_hash,
            "full_name": "Karan Kumar",
            "college": "Lovely Professional University",
            "degree": "B.Tech",
            "branch": "Computer Science & Engineering",
            "current_year": "2nd Year",
            "grad_year": 2027,
            "city_country": "Punjab, India",
            "bio": "Interested in AI/ML, computer vision, gesture interfaces and high-growth student startups. Building AI Gesture Recognition.",
            "skills": ["Python", "C++", "Machine Learning", "OpenCV", "FastAPI", "React"],
            "interests": ["AI/ML", "Startups", "Hackathons", "Computer Vision", "Robotics"],
            "projects_summary": "Lead developer of AI Gesture Recognition System & Campus Peer Tutoring Network.",
            "achievements": ["Hackathon National Finalist 2025", "Dean's Honor List", "Open Source Contributor"],
            "avatar_url": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/karankumar-demo",
            "linkedin_url": "https://linkedin.com/in/karan-kumar-nexus",
            "portfolio_url": "https://karan-dev.unisphere.edu",
            "role": "student",
            "reputation_score": 4.9,
            "category_reputation": {
                "communication": 4.8,
                "teamwork": 5.0,
                "reliability": 4.9,
                "professionalism": 4.9,
                "technical": 5.0
            },
            "endorsements_count": 14,
            "connections_count": 86,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=60),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        },
        {
            "id": "usr-maya",
            "email": "maya@stanford.edu",
            "password_hash": default_password_hash,
            "full_name": "Maya Lin",
            "college": "Stanford University",
            "degree": "B.S.",
            "branch": "Symbolic Systems",
            "current_year": "3rd Year",
            "grad_year": 2026,
            "city_country": "Stanford, CA, USA",
            "bio": "Bridging Cognitive Science, Human-AI interaction, and delightful interactive design systems. TreeHacks Organizer.",
            "skills": ["Figma", "React", "TypeScript", "PyTorch", "UI/UX Systems", "User Research"],
            "interests": ["Human-AI Interaction", "Design Systems", "Venture Capital", "EdTech"],
            "projects_summary": "Created FlowState UI & AI Cognitive Canvas for visual thinking.",
            "achievements": ["Apple WWDC Swift Scholar", "TreeHacks Track Winner 2025", "Stanford Design Fellowship"],
            "avatar_url": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/mayalin-ux",
            "linkedin_url": "https://linkedin.com/in/maya-lin-stanford",
            "portfolio_url": "https://mayalin.design",
            "role": "student",
            "reputation_score": 5.0,
            "category_reputation": {
                "communication": 5.0,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 4.9,
                "technical": 4.9
            },
            "endorsements_count": 22,
            "connections_count": 142,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=90),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": False
            }
        },
        {
            "id": "usr-aarav",
            "email": "aarav@mit.edu",
            "password_hash": default_password_hash,
            "full_name": "Aarav Sharma",
            "college": "Massachusetts Institute of Technology",
            "degree": "B.S.",
            "branch": "EECS",
            "current_year": "4th Year",
            "grad_year": 2025,
            "city_country": "Cambridge, MA, USA",
            "bio": "Building high-performance distributed systems, async databases, and fault-tolerant consensus engines in Rust.",
            "skills": ["Rust", "Go", "C++", "Kubernetes", "Distributed Systems", "Kafka", "PostgreSQL"],
            "interests": ["Cloud Architecture", "Database Internals", "High Frequency Systems", "Open Source"],
            "projects_summary": "Author of Unisphere-Raft consensus library and microsecond memory-mapped queue.",
            "achievements": ["MIT Supercomputing Challenge Winner", "Incoming Distributed Systems SWE", "ACM ICPC Regional 1st"],
            "avatar_url": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1592930954854-7d00c87d0cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/aarav-mit",
            "linkedin_url": "https://linkedin.com/in/aarav-sharma-mit",
            "portfolio_url": "https://aarav.systems",
            "role": "student",
            "reputation_score": 4.9,
            "category_reputation": {
                "communication": 4.7,
                "teamwork": 4.9,
                "reliability": 5.0,
                "professionalism": 5.0,
                "technical": 5.0
            },
            "endorsements_count": 19,
            "connections_count": 115,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=120),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        },
        {
            "id": "usr-elena",
            "email": "elena@oxford.edu",
            "password_hash": default_password_hash,
            "full_name": "Elena Rostova",
            "college": "University of Oxford",
            "degree": "B.A.",
            "branch": "Philosophy, Politics & Economics",
            "current_year": "2nd Year",
            "grad_year": 2027,
            "city_country": "Oxford, UK",
            "bio": "Exploring algorithmic governance, FinTech quantitative modeling, and international technology policy.",
            "skills": ["Python", "SQL", "Econometrics", "R", "Public Policy", "Financial Modeling"],
            "interests": ["FinTech", "AI Governance", "Macroeconomics", "Debate & Policy"],
            "projects_summary": "Policy Brief on Algorithmic Transparency for the Oxford Technology Review.",
            "achievements": ["Oxford Union Debating Finalist", "President, Oxford Quantitative Finance Society"],
            "avatar_url": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/elena-oxford",
            "linkedin_url": "https://linkedin.com/in/elena-rostova-oxford",
            "portfolio_url": "https://elena-rostova.uk",
            "role": "student",
            "reputation_score": 4.85,
            "category_reputation": {
                "communication": 5.0,
                "teamwork": 4.8,
                "reliability": 4.9,
                "professionalism": 5.0,
                "technical": 4.6
            },
            "endorsements_count": 11,
            "connections_count": 73,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=80),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": False
            }
        },
        {
            "id": "usr-david",
            "email": "david@berkeley.edu",
            "password_hash": default_password_hash,
            "full_name": "David Chen",
            "college": "UC Berkeley",
            "degree": "B.S.",
            "branch": "Bioengineering & CS",
            "current_year": "3rd Year",
            "grad_year": 2026,
            "city_country": "Berkeley, CA, USA",
            "bio": "Applying deep learning to protein folding, genomics datasets, and drug discovery workflows. Co-founder of OpenMed Bio.",
            "skills": ["PyTorch", "Python", "Next.js", "Bioinformatics", "Docker", "Tailwind CSS"],
            "interests": ["Computational Biology", "HealthTech", "Startups", "Rock Climbing"],
            "projects_summary": "OpenMed: Open source genomic sequence alignment with GPU acceleration.",
            "achievements": ["CalHacks 1st Place Health Track", "Undergraduate Research Fellowship Grant"],
            "avatar_url": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1622470190232-81df3782484b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/davidchen-cal",
            "linkedin_url": "https://linkedin.com/in/david-chen-cal",
            "portfolio_url": "https://davidchen.bio",
            "role": "student",
            "reputation_score": 4.95,
            "category_reputation": {
                "communication": 4.9,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 4.9,
                "technical": 5.0
            },
            "endorsements_count": 16,
            "connections_count": 94,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=100),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        },
        {
            "id": "usr-zoe",
            "email": "zoe@stanford.edu",
            "password_hash": default_password_hash,
            "full_name": "Zoe Patel",
            "college": "Stanford University",
            "degree": "B.S.",
            "branch": "Product Design",
            "current_year": "2nd Year",
            "grad_year": 2027,
            "city_country": "Palo Alto, CA, USA",
            "bio": "3D interactive interfaces, spatial audio, and rapid mobile prototyping. Passionate about sustainability apps.",
            "skills": ["Figma", "Blender", "Flutter", "Three.js", "React Native", "CSS Motion"],
            "interests": ["3D Design", "CleanTech", "Mobile Apps", "Design Sprints"],
            "projects_summary": "EcoTrack: Personal carbon and campus sustainability tracker.",
            "achievements": ["Stanford Sustainability Challenge Finalist", "Red Dot Design Concept Award"],
            "avatar_url": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/zoepatel-design",
            "linkedin_url": "https://linkedin.com/in/zoe-patel-stanford",
            "portfolio_url": "https://zoepatel.io",
            "role": "student",
            "reputation_score": 4.88,
            "category_reputation": {
                "communication": 5.0,
                "teamwork": 4.9,
                "reliability": 4.8,
                "professionalism": 4.8,
                "technical": 4.9
            },
            "endorsements_count": 13,
            "connections_count": 68,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=70),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": False
            }
        },
        {
            "id": "usr-liam",
            "email": "liam@mit.edu",
            "password_hash": default_password_hash,
            "full_name": "Liam O'Connor",
            "college": "Massachusetts Institute of Technology",
            "degree": "B.S.",
            "branch": "Mechanical & Robotics",
            "current_year": "3rd Year",
            "grad_year": 2026,
            "city_country": "Boston, MA, USA",
            "bio": "Autonomous drone navigation, quadruped locomotion, ROS2 pipelines, and embedded microcontrollers.",
            "skills": ["ROS2", "C++", "Python", "Computer Vision", "SolidWorks", "Embedded Systems"],
            "interests": ["Robotics", "Autonomous Systems", "Drones", "Hardware Hacking"],
            "projects_summary": "Autonomous indoor quadrotor navigation with onboard SLAM.",
            "achievements": ["MIT Robotics Team Captain", "DARPA Student Sub-T Challenge Participant"],
            "avatar_url": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1592930954854-7d00c87d0cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/liam-robotics",
            "linkedin_url": "https://linkedin.com/in/liam-oconnor-mit",
            "portfolio_url": "https://liamoconnor.tech",
            "role": "student",
            "reputation_score": 4.92,
            "category_reputation": {
                "communication": 4.8,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 4.8,
                "technical": 5.0
            },
            "endorsements_count": 15,
            "connections_count": 82,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=85),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        },
        {
            "id": "usr-ananya",
            "email": "ananya@unisphere.edu",
            "password_hash": default_password_hash,
            "full_name": "Ananya Gupta",
            "college": "Lovely Professional University",
            "degree": "B.Tech",
            "branch": "Information Technology",
            "current_year": "3rd Year",
            "grad_year": 2026,
            "city_country": "Punjab, India",
            "bio": "Fullstack web developer passionate about GraphQL, real-time messaging architectures, and student dev communities.",
            "skills": ["React", "Node.js", "GraphQL", "Tailwind CSS", "MongoDB", "WebSockets"],
            "interests": ["Web Development", "Community Building", "Hackathons", "Tech Mentorship"],
            "projects_summary": "Built campus event ticketing portal used by 5,000+ students.",
            "achievements": ["Google Developer Student Club Lead", "Smart India Hackathon Finalist"],
            "avatar_url": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?crop=entropy&cs=srgb&fm=jpg&q=85",
            "github_url": "https://github.com/ananya-gupta",
            "linkedin_url": "https://linkedin.com/in/ananya-gupta-lpu",
            "portfolio_url": "https://ananyagupta.dev",
            "role": "student",
            "reputation_score": 4.91,
            "category_reputation": {
                "communication": 5.0,
                "teamwork": 5.0,
                "reliability": 4.9,
                "professionalism": 4.9,
                "technical": 4.8
            },
            "endorsements_count": 18,
            "connections_count": 98,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=95),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        },
        {
            "id": "usr-admin",
            "email": "admin@unisphere.edu",
            "password_hash": admin_password_hash,
            "full_name": "Unisphere Administrator",
            "college": "Unisphere Safety Board",
            "degree": "Staff",
            "branch": "Platform Governance",
            "current_year": "Staff",
            "grad_year": 2024,
            "city_country": "Global",
            "bio": "Official moderation and community safety administration account for Unisphere.",
            "skills": ["Platform Safety", "Community Moderation", "System Administration"],
            "interests": ["Community Health", "Trust & Safety"],
            "projects_summary": "Unisphere Student Safety Standards & Trust System.",
            "achievements": ["Trust & Safety Lead"],
            "avatar_url": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "banner_url": "",
            "github_url": "",
            "linkedin_url": "",
            "portfolio_url": "",
            "role": "admin",
            "reputation_score": 5.0,
            "category_reputation": {
                "communication": 5.0,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 5.0,
                "technical": 5.0
            },
            "endorsements_count": 50,
            "connections_count": 500,
            "is_suspended": False,
            "is_verified": True,
            "created_at": datetime.utcnow() - timedelta(days=200),
            "privacy": {
                "who_can_message": "everyone",
                "who_can_connect": "everyone",
                "who_can_call": "everyone",
                "is_profile_public": True,
                "show_email": True
            }
        }
    ]
    await db.users.insert_many(users_data)

    # ---------------- 3. SEED AVAILABILITY ----------------
    for user in users_data:
        await db.availabilities.insert_one({
            "user_id": user["id"],
            "topics": ["Project Collaboration", "Career Discussion", "Mentorship", "Networking", "Hackathon Pitching"],
            "timezone": "UTC",
            "weekly_schedule": [
                {
                    "day": day,
                    "active": True,
                    "slots": [
                        {"start_time": "14:00", "end_time": "14:30", "is_booked": False},
                        {"start_time": "15:00", "end_time": "15:30", "is_booked": False},
                        {"start_time": "16:00", "end_time": "16:30", "is_booked": False},
                        {"start_time": "17:00", "end_time": "17:30", "is_booked": False},
                    ]
                }
                for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            ]
        })

    # ---------------- 4. SEED CONNECTIONS ----------------
    connections_data = [
        {
            "id": "conn-1",
            "requester_id": "usr-karan",
            "recipient_id": "usr-maya",
            "status": "accepted",
            "note": "Loved your TreeHacks UI presentation! Let's connect on human-AI interfaces.",
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow() - timedelta(days=19),
        },
        {
            "id": "conn-2",
            "requester_id": "usr-karan",
            "recipient_id": "usr-aarav",
            "status": "accepted",
            "note": "Hey Aarav, working on distributed models and loved your Rust projects.",
            "created_at": datetime.utcnow() - timedelta(days=15),
            "updated_at": datetime.utcnow() - timedelta(days=14),
        },
        {
            "id": "conn-3",
            "requester_id": "usr-david",
            "recipient_id": "usr-karan",
            "status": "accepted",
            "note": "Hey Karan, saw your AI gesture project. We should discuss computer vision in biotech.",
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow() - timedelta(days=9),
        },
        {
            "id": "conn-4",
            "requester_id": "usr-ananya",
            "recipient_id": "usr-karan",
            "status": "accepted",
            "note": "Hey from LPU IT dept! Collab on the upcoming techfest?",
            "created_at": datetime.utcnow() - timedelta(days=5),
            "updated_at": datetime.utcnow() - timedelta(days=4),
        },
        {
            "id": "conn-5",
            "requester_id": "usr-elena",
            "recipient_id": "usr-karan",
            "status": "pending",
            "note": "Interested in student tech initiatives across India & UK.",
            "created_at": datetime.utcnow() - timedelta(hours=12),
            "updated_at": datetime.utcnow() - timedelta(hours=12),
        },
        {
            "id": "conn-6",
            "requester_id": "usr-zoe",
            "recipient_id": "usr-karan",
            "status": "pending",
            "note": "Looking for ML partner for interactive 3D spatial app.",
            "created_at": datetime.utcnow() - timedelta(hours=6),
            "updated_at": datetime.utcnow() - timedelta(hours=6),
        }
    ]
    await db.connections.insert_many(connections_data)

    # ---------------- 5. SEED FEED POSTS & COMMENTS ----------------
    posts_data = [
        {
            "id": "post-1",
            "author_id": "usr-karan",
            "author_name": "Karan Kumar",
            "author_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "author_college": "Lovely Professional University",
            "author_degree_year": "B.Tech CSE • 2nd Year",
            "content": "🎉 Just deployed v2.0 of our AI Gesture Recognition System! We achieved 60fps real-time finger tracking in the browser using OpenCV & WebAssembly. Looking for a frontend designer from any campus to help polish the dashboard UI. Drop a comment if interested in collaborating!",
            "category": "project",
            "tags": ["AI/ML", "ComputerVision", "OpenCV", "OpenSource", "Collab"],
            "media_url": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "likes_count": 28,
            "comments_count": 4,
            "shares_count": 6,
            "is_reported": False,
            "created_at": datetime.utcnow() - timedelta(hours=4),
        },
        {
            "id": "post-2",
            "author_id": "usr-maya",
            "author_name": "Maya Lin",
            "author_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "author_college": "Stanford University",
            "author_degree_year": "B.S. Symbolic Systems • 3rd Year",
            "content": "✨ Reflection from organizing TreeHacks: The best student projects aren't the ones with the most complex models, but the ones where designers, engineers, and domain researchers connect early. That's why cross-campus discovery matters so much. What's the best interdisciplinary team you've ever worked with?",
            "category": "achievement",
            "tags": ["Stanford", "TreeHacks", "ProductDesign", "Networking"],
            "media_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "likes_count": 42,
            "comments_count": 5,
            "shares_count": 11,
            "is_reported": False,
            "created_at": datetime.utcnow() - timedelta(hours=10),
        },
        {
            "id": "post-3",
            "author_id": "usr-aarav",
            "author_name": "Aarav Sharma",
            "author_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "author_college": "Massachusetts Institute of Technology",
            "author_degree_year": "B.S. EECS • 4th Year",
            "content": "🦀 Rust tip for undergrads building backend systems: Zero-cost abstractions and fearless concurrency make distributed systems so much easier to reason about during hackathons. Open-sourced our Raft benchmark engine today on GitHub. Feel free to star or contribute!",
            "category": "general",
            "tags": ["Rust", "DistributedSystems", "MIT", "Backend"],
            "media_url": "https://images.unsplash.com/photo-1592930954854-7d00c87d0cf4?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "likes_count": 35,
            "comments_count": 3,
            "shares_count": 8,
            "is_reported": False,
            "created_at": datetime.utcnow() - timedelta(days=1),
        },
        {
            "id": "post-4",
            "author_id": "usr-david",
            "author_name": "David Chen",
            "author_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "author_college": "UC Berkeley",
            "author_degree_year": "B.S. Bioengineering & CS • 3rd Year",
            "content": "🧬 OpenMed update: We just benchmarked our GPU genomic alignment algorithm against BLAST — 4.2x speedup on standard chromosome 21 sequences! Recruiting 1 ML Engineer and 1 Data Visualization developer for our summer open source sprint.",
            "category": "project",
            "tags": ["Biotech", "PyTorch", "OpenSource", "CalHacks", "Recruiting"],
            "media_url": "https://images.unsplash.com/photo-1622470190232-81df3782484b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "likes_count": 51,
            "comments_count": 6,
            "shares_count": 14,
            "is_reported": False,
            "created_at": datetime.utcnow() - timedelta(days=1, hours=8),
        },
        {
            "id": "post-5",
            "author_id": "usr-elena",
            "author_name": "Elena Rostova",
            "author_avatar": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
            "author_college": "University of Oxford",
            "author_degree_year": "B.A. PPE & Data Science • 2nd Year",
            "content": "📊 Quick question for students across engineering & policy: How is your university handling student AI usage in exams vs collaborative coursework? We're drafting a student-led whitepaper for Oxford Union and would love data from other campuses.",
            "category": "question",
            "tags": ["AIPolicy", "Oxford", "UniversityLife", "Research"],
            "media_url": "",
            "media_type": "none",
            "likes_count": 19,
            "comments_count": 8,
            "shares_count": 3,
            "is_reported": False,
            "created_at": datetime.utcnow() - timedelta(days=2),
        }
    ]
    await db.posts.insert_many(posts_data)

    # Comments for post-1
    comments_data = [
        {
            "id": "com-1",
            "post_id": "post-1",
            "user_id": "usr-maya",
            "user_name": "Maya Lin",
            "user_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "Stanford University",
            "content": "This is super neat Karan! I'd love to help craft the interaction guidelines for the gesture controls.",
            "created_at": datetime.utcnow() - timedelta(hours=3, minutes=30),
        },
        {
            "id": "com-2",
            "post_id": "post-1",
            "user_id": "usr-ananya",
            "user_name": "Ananya Gupta",
            "user_avatar": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "Lovely Professional University",
            "content": "Incredible work! We should test this out with our robotics and web teams on campus.",
            "created_at": datetime.utcnow() - timedelta(hours=2),
        },
        {
            "id": "com-3",
            "post_id": "post-1",
            "user_id": "usr-david",
            "user_name": "David Chen",
            "user_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "UC Berkeley",
            "content": "Booked a slot on your meeting calendar to chat about WebAssembly optimization!",
            "created_at": datetime.utcnow() - timedelta(hours=1),
        }
    ]
    await db.post_comments.insert_many(comments_data)

    # Initial likes
    likes_data = [
        {"post_id": "post-1", "user_id": "usr-maya", "created_at": datetime.utcnow()},
        {"post_id": "post-1", "user_id": "usr-david", "created_at": datetime.utcnow()},
        {"post_id": "post-1", "user_id": "usr-ananya", "created_at": datetime.utcnow()},
        {"post_id": "post-2", "user_id": "usr-karan", "created_at": datetime.utcnow()},
        {"post_id": "post-3", "user_id": "usr-karan", "created_at": datetime.utcnow()},
    ]
    await db.post_likes.insert_many(likes_data)

    # ---------------- 6. SEED 24-HOUR STORIES ----------------
    now = datetime.utcnow()
    stories_data = [
        {
            "id": "story-1",
            "user_id": "usr-maya",
            "user_name": "Maya Lin",
            "user_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "Stanford University",
            "media_url": "https://images.unsplash.com/photo-1583373834259-46cc92173cb7?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "caption": "Sunset hacking session at Stanford Huang Center! 🌅✨",
            "text_background_color": "#6366F1",
            "views": ["usr-karan", "usr-aarav", "usr-david"],
            "reactions": [
                {"user_id": "usr-karan", "user_name": "Karan Kumar", "emoji": "🔥", "created_at": now - timedelta(hours=2)},
                {"user_id": "usr-aarav", "user_name": "Aarav Sharma", "emoji": "👏", "created_at": now - timedelta(hours=1)},
            ],
            "created_at": now - timedelta(hours=5),
            "expires_at": now + timedelta(hours=19),
        },
        {
            "id": "story-2",
            "user_id": "usr-karan",
            "user_name": "Karan Kumar",
            "user_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "Lovely Professional University",
            "media_url": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "caption": "Testing OpenCV gesture tracker with 60 FPS performance! 🚀",
            "text_background_color": "#0F1623",
            "views": ["usr-maya", "usr-ananya"],
            "reactions": [
                {"user_id": "usr-maya", "user_name": "Maya Lin", "emoji": "💡", "created_at": now - timedelta(hours=1)}
            ],
            "created_at": now - timedelta(hours=3),
            "expires_at": now + timedelta(hours=21),
        },
        {
            "id": "story-3",
            "user_id": "usr-aarav",
            "user_name": "Aarav Sharma",
            "user_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "Massachusetts Institute of Technology",
            "media_url": "",
            "media_type": "text",
            "caption": "Just benchmarked Raft with 100k msg/sec throughput in Rust! Zero panics 🦀⚡",
            "text_background_color": "#4F46E5",
            "views": ["usr-karan"],
            "reactions": [
                {"user_id": "usr-karan", "user_name": "Karan Kumar", "emoji": "🚀", "created_at": now - timedelta(minutes=45)}
            ],
            "created_at": now - timedelta(hours=2),
            "expires_at": now + timedelta(hours=22),
        },
        {
            "id": "story-4",
            "user_id": "usr-david",
            "user_name": "David Chen",
            "user_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "user_college": "UC Berkeley",
            "media_url": "https://images.unsplash.com/photo-1622470190232-81df3782484b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "media_type": "image",
            "caption": "CalHacks demo day prep! Who else is building health tech? 🔬",
            "text_background_color": "#10B981",
            "views": [],
            "reactions": [],
            "created_at": now - timedelta(hours=1),
            "expires_at": now + timedelta(hours=23),
        }
    ]
    await db.stories.insert_many(stories_data)

    # ---------------- 7. SEED PROJECTS ----------------
    projects_data = [
        {
            "id": "proj-1",
            "title": "AI Gesture Recognition System",
            "description": "Real-time hand and body gesture interpretation system using OpenCV and PyTorch. Allows contactless controls for computer displays and smart presentation software without proprietary hardware.",
            "category": "AI/ML",
            "technologies": ["Python", "OpenCV", "PyTorch", "FastAPI", "React", "WebAssembly"],
            "owner_id": "usr-karan",
            "owner_name": "Karan Kumar",
            "owner_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "owner_college": "Lovely Professional University",
            "team_members": [
                {
                    "user_id": "usr-karan",
                    "name": "Karan Kumar",
                    "avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "role": "Project Lead & ML Architect",
                    "college": "LPU"
                }
            ],
            "looking_for_roles": [
                {
                    "role_name": "Frontend / UX Developer",
                    "skills_needed": ["React", "TypeScript", "Tailwind CSS", "Figma"],
                    "count": 1
                },
                {
                    "role_name": "Embedded & WebAssembly Engineer",
                    "skills_needed": ["C++", "WebAssembly", "WASM", "OpenCV"],
                    "count": 1
                }
            ],
            "github_url": "https://github.com/karankumar-demo/ai-gesture-system",
            "demo_url": "https://gesture.unisphere.edu",
            "status": "recruiting",
            "created_at": datetime.utcnow() - timedelta(days=12),
        },
        {
            "id": "proj-2",
            "title": "OpenMed Genomic Analyzer",
            "description": "GPU-accelerated open source genomic sequence alignment and protein structure prediction engine built for university researchers and bioinformatics student labs.",
            "category": "Biotech",
            "technologies": ["PyTorch", "Python", "CUDA", "Next.js", "Docker", "Tailwind CSS"],
            "owner_id": "usr-david",
            "owner_name": "David Chen",
            "owner_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "owner_college": "UC Berkeley",
            "team_members": [
                {
                    "user_id": "usr-david",
                    "name": "David Chen",
                    "avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "role": "Bioengineering Lead",
                    "college": "UC Berkeley"
                }
            ],
            "looking_for_roles": [
                {
                    "role_name": "PyTorch / ML Engineer",
                    "skills_needed": ["PyTorch", "Python", "Bioinformatics", "GPU"],
                    "count": 1
                },
                {
                    "role_name": "Fullstack Data Viz Developer",
                    "skills_needed": ["React", "Three.js", "D3.js", "TypeScript"],
                    "count": 1
                }
            ],
            "github_url": "https://github.com/davidchen-cal/openmed-bio",
            "demo_url": "https://openmed.bio",
            "status": "recruiting",
            "created_at": datetime.utcnow() - timedelta(days=18),
        },
        {
            "id": "proj-3",
            "title": "EcoTrack: Campus Sustainability Network",
            "description": "Interactive mobile application that gamifies university carbon footprint reduction, food waste auditing, and inter-dormitory sustainability competitions with real rewards.",
            "category": "Design",
            "technologies": ["Flutter", "Figma", "Node.js", "PostgreSQL", "Firebase"],
            "owner_id": "usr-zoe",
            "owner_name": "Zoe Patel",
            "owner_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "owner_college": "Stanford University",
            "team_members": [
                {
                    "user_id": "usr-zoe",
                    "name": "Zoe Patel",
                    "avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "role": "Lead Product Designer",
                    "college": "Stanford"
                }
            ],
            "looking_for_roles": [
                {
                    "role_name": "Mobile App Developer",
                    "skills_needed": ["Flutter", "Dart", "Firebase", "State Management"],
                    "count": 1
                }
            ],
            "github_url": "https://github.com/zoepatel-design/ecotrack-campus",
            "demo_url": "https://ecotrack.io",
            "status": "recruiting",
            "created_at": datetime.utcnow() - timedelta(days=10),
        },
        {
            "id": "proj-4",
            "title": "Unisphere-Raft Distributed Consensus Library",
            "description": "Ultra high-throughput consensus implementation written in pure modern Rust with automated cluster partition simulations and formal TLA+ specifications.",
            "category": "Web Dev",
            "technologies": ["Rust", "Go", "Distributed Systems", "gRPC", "Kubernetes"],
            "owner_id": "usr-aarav",
            "owner_name": "Aarav Sharma",
            "owner_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "owner_college": "Massachusetts Institute of Technology",
            "team_members": [
                {
                    "user_id": "usr-aarav",
                    "name": "Aarav Sharma",
                    "avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
                    "role": "Systems Lead",
                    "college": "MIT"
                }
            ],
            "looking_for_roles": [
                {
                    "role_name": "Performance Benchmark Engineer",
                    "skills_needed": ["Rust", "Linux Perf", "eBPF", "Docker"],
                    "count": 1
                }
            ],
            "github_url": "https://github.com/aarav-mit/unisphere-raft",
            "demo_url": "https://unisphere-raft.systems",
            "status": "in_progress",
            "created_at": datetime.utcnow() - timedelta(days=25),
        }
    ]
    await db.projects.insert_many(projects_data)

    # ---------------- 8. SEED PROJECT JOIN REQUESTS ----------------
    project_requests_data = [
        {
            "id": "preq-1",
            "project_id": "proj-1",
            "project_title": "AI Gesture Recognition System",
            "applicant_id": "usr-maya",
            "applicant_name": "Maya Lin",
            "applicant_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "applicant_college": "Stanford University",
            "role_applied": "Frontend / UX Developer",
            "pitch": "I'd love to craft an intuitive Figma design system and build fluid glassmorphism HUD overlays in React for the gesture interface!",
            "skills": ["Figma", "React", "TypeScript", "Tailwind CSS"],
            "status": "pending",
            "created_at": datetime.utcnow() - timedelta(days=2),
        },
        {
            "id": "preq-2",
            "project_id": "proj-2",
            "project_title": "OpenMed Genomic Analyzer",
            "applicant_id": "usr-karan",
            "applicant_name": "Karan Kumar",
            "applicant_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "applicant_college": "Lovely Professional University",
            "role_applied": "PyTorch / ML Engineer",
            "pitch": "Experienced with PyTorch model acceleration, CUDA profiling, and FastAPI backends. Excited to work on genomic alignments!",
            "skills": ["PyTorch", "Python", "FastAPI", "OpenCV"],
            "status": "accepted",
            "created_at": datetime.utcnow() - timedelta(days=5),
        }
    ]
    await db.project_requests.insert_many(project_requests_data)

    # ---------------- 9. SEED MEETINGS ----------------
    meetings_data = [
        {
            "id": "meet-1",
            "host_id": "usr-karan",
            "host_name": "Karan Kumar",
            "host_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "host_college": "Lovely Professional University",
            "guest_id": "usr-maya",
            "guest_name": "Maya Lin",
            "guest_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "guest_college": "Stanford University",
            "title": "AI Gesture UX & Integration Discussion",
            "description": "Walkthrough of gesture bounding box telemetry and user feedback state animations.",
            "topic": "Project Collaboration",
            "meeting_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "start_time": "15:00",
            "end_time": "15:30",
            "meeting_link": "https://meet.unisphere.edu/room/gest-ux-2026",
            "status": "upcoming",
            "created_at": datetime.utcnow() - timedelta(days=1),
        },
        {
            "id": "meet-2",
            "host_id": "usr-david",
            "host_name": "David Chen",
            "host_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "host_college": "UC Berkeley",
            "guest_id": "usr-karan",
            "guest_name": "Karan Kumar",
            "guest_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "guest_college": "Lovely Professional University",
            "title": "OpenMed ML Sprint Kickoff",
            "description": "Aligning on dataset preprocessing pipeline and GPU worker provisioning.",
            "topic": "Project Collaboration",
            "meeting_date": (datetime.utcnow() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "start_time": "16:00",
            "end_time": "16:30",
            "meeting_link": "https://meet.unisphere.edu/room/openmed-sprint-1",
            "status": "upcoming",
            "created_at": datetime.utcnow() - timedelta(hours=14),
        }
    ]
    await db.meetings.insert_many(meetings_data)

    # ---------------- 10. SEED REPUTATION REVIEWS / ENDORSEMENTS ----------------
    reviews_data = [
        {
            "id": "rev-1",
            "reviewer_id": "usr-maya",
            "reviewer_name": "Maya Lin",
            "reviewer_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "reviewer_college": "Stanford University",
            "target_user_id": "usr-karan",
            "interaction_type": "project_collab",
            "scores": {
                "communication": 5.0,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 4.8,
                "technical": 5.0,
            },
            "average_score": 4.96,
            "comment": "Karan is an exceptional technical builder. His computer vision pipeline was extremely clean, and he communicates ideas with crystal clarity across timezones.",
            "created_at": datetime.utcnow() - timedelta(days=15),
        },
        {
            "id": "rev-2",
            "reviewer_id": "usr-aarav",
            "reviewer_name": "Aarav Sharma",
            "reviewer_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "reviewer_college": "Massachusetts Institute of Technology",
            "target_user_id": "usr-karan",
            "interaction_type": "study_session",
            "scores": {
                "communication": 4.8,
                "teamwork": 5.0,
                "reliability": 4.9,
                "professionalism": 5.0,
                "technical": 5.0,
            },
            "average_score": 4.94,
            "comment": "Super reliable and technically proficient. Deep understanding of async backend architectures and ML deployment.",
            "created_at": datetime.utcnow() - timedelta(days=8),
        },
        {
            "id": "rev-3",
            "reviewer_id": "usr-karan",
            "reviewer_name": "Karan Kumar",
            "reviewer_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "reviewer_college": "Lovely Professional University",
            "target_user_id": "usr-maya",
            "interaction_type": "project_collab",
            "scores": {
                "communication": 5.0,
                "teamwork": 5.0,
                "reliability": 5.0,
                "professionalism": 5.0,
                "technical": 5.0,
            },
            "average_score": 5.0,
            "comment": "Maya is a visionary product designer with deep empathy for user flows. Working with her elevated our entire interface design.",
            "created_at": datetime.utcnow() - timedelta(days=6),
        }
    ]
    await db.reputation_reviews.insert_many(reviews_data)

    # ---------------- 11. SEED CONVERSATIONS & MESSAGES ----------------
    conv_1_id = "conv-karan-maya"
    await db.conversations.insert_one({
        "id": conv_1_id,
        "participants": ["usr-karan", "usr-maya"],
        "last_message": "Awesome! Looking forward to our call tomorrow on the gesture UI.",
        "last_message_at": datetime.utcnow() - timedelta(minutes=25),
        "unread_counts": {"usr-karan": 0, "usr-maya": 0},
        "created_at": datetime.utcnow() - timedelta(days=10),
    })

    messages_data = [
        {
            "id": "msg-1",
            "conversation_id": conv_1_id,
            "sender_id": "usr-maya",
            "sender_name": "Maya Lin",
            "sender_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "recipient_id": "usr-karan",
            "content": "Hey Karan! Saw your OpenCV demo on the feed. Are you free to discuss UI overlays?",
            "media_url": "",
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(hours=2),
        },
        {
            "id": "msg-2",
            "conversation_id": conv_1_id,
            "sender_id": "usr-karan",
            "sender_name": "Karan Kumar",
            "sender_avatar": "https://images.unsplash.com/photo-1664843917218-71f7b6bb3afc?crop=entropy&cs=srgb&fm=jpg&q=85",
            "recipient_id": "usr-maya",
            "content": "Hey Maya! Absolutely, I'd love your thoughts on making the gesture tracking feedback look more futuristic and responsive.",
            "media_url": "",
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(hours=1, minutes=30),
        },
        {
            "id": "msg-3",
            "conversation_id": conv_1_id,
            "sender_id": "usr-maya",
            "sender_name": "Maya Lin",
            "sender_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "recipient_id": "usr-karan",
            "content": "Awesome! Looking forward to our call tomorrow on the gesture UI.",
            "media_url": "",
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(minutes=25),
        }
    ]
    await db.messages.insert_many(messages_data)

    # ---------------- 12. SEED NOTIFICATIONS ----------------
    notifs_data = [
        {
            "id": "notif-1",
            "user_id": "usr-karan",
            "actor_id": "usr-maya",
            "actor_name": "Maya Lin",
            "actor_avatar": "https://images.unsplash.com/photo-1725473823311-122c1c86966b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "type": "project_request",
            "title": "New Project Join Request",
            "message": "Maya Lin applied for 'Frontend / UX Developer' on AI Gesture Recognition System.",
            "link": "/projects?id=proj-1",
            "is_read": False,
            "created_at": datetime.utcnow() - timedelta(hours=2),
        },
        {
            "id": "notif-2",
            "user_id": "usr-karan",
            "actor_id": "usr-elena",
            "actor_name": "Elena Rostova",
            "actor_avatar": "https://images.unsplash.com/photo-1760351561007-526f5353cc76?crop=entropy&cs=srgb&fm=jpg&q=85",
            "type": "connection_request",
            "title": "New Connection Request",
            "message": "Elena Rostova from Oxford University sent you a connection request.",
            "link": "/profile/usr-elena",
            "is_read": False,
            "created_at": datetime.utcnow() - timedelta(hours=12),
        },
        {
            "id": "notif-3",
            "user_id": "usr-karan",
            "actor_id": "usr-david",
            "actor_name": "David Chen",
            "actor_avatar": "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&q=85",
            "type": "project_accepted",
            "title": "Application Accepted!",
            "message": "Congratulations! You were accepted into 'OpenMed Genomic Analyzer' as PyTorch / ML Engineer.",
            "link": "/projects?id=proj-2",
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(days=1),
        }
    ]
    await db.notifications.insert_many(notifs_data)

    # ---------------- 13. SEED REPORTS FOR ADMIN MODERATION ----------------
    reports_data = [
        {
            "id": "rep-1",
            "reporter_id": "usr-aarav",
            "reporter_name": "Aarav Sharma",
            "target_type": "post",
            "target_id": "post-5",
            "target_name": "Post: Quick question for students across...",
            "reason": "Suspected duplicate posting across channels",
            "details": "User posted the survey link in multiple forums without authorization.",
            "status": "pending",
            "action_notes": "",
            "created_at": datetime.utcnow() - timedelta(days=1),
        }
    ]
    await db.reports.insert_many(reports_data)

    print("✅ Unisphere Database Seeding Completed Successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
