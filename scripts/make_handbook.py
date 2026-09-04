"""Generates the Unisphere Full-Stack Teaching Handbook PDF."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Preformatted, KeepTogether, Table, TableStyle,
                                PageBreak)
from reportlab.lib.enums import TA_LEFT

VIOLET = colors.HexColor("#7C3AED")
AMBER = colors.HexColor("#B45309")
PINK = colors.HexColor("#BE185D")
INK = colors.HexColor("#171126")
MUTED = colors.HexColor("#5B5470")
CODEBG = colors.HexColor("#F4F1FA")
RULE = colors.HexColor("#E3DEF0")

S = {
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=21, leading=25,
                         textColor=VIOLET, spaceBefore=6, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14.5, leading=18,
                         textColor=INK, spaceBefore=13, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                         textColor=PINK, spaceBefore=10, spaceAfter=4),
    "p": ParagraphStyle("p", fontName="Helvetica", fontSize=10, leading=15.2,
                        textColor=INK, spaceAfter=6, alignment=TA_LEFT),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=10, leading=14.6,
                        textColor=INK, leftIndent=12, bulletIndent=3, spaceAfter=3.5),
    "note": ParagraphStyle("note", fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
                           textColor=AMBER, spaceAfter=7, leftIndent=8),
    "code": ParagraphStyle("code", fontName="Courier", fontSize=8.3, leading=11.4,
                           textColor=colors.HexColor("#123020"), backColor=CODEBG,
                           borderPadding=7, spaceBefore=4, spaceAfter=9,
                           borderWidth=0.6, borderColor=RULE),
    "dia": ParagraphStyle("dia", fontName="Courier-Bold", fontSize=8.6, leading=12,
                          textColor=VIOLET, backColor=colors.HexColor("#FAF7FF"),
                          borderPadding=8, spaceBefore=4, spaceAfter=9,
                          borderWidth=0.6, borderColor=RULE),
    "cap": ParagraphStyle("cap", fontName="Helvetica-Bold", fontSize=8.6, leading=11,
                          textColor=MUTED, spaceAfter=2),
    "cover_t": ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=34, leading=39,
                              textColor=VIOLET, spaceAfter=12),
    "cover_s": ParagraphStyle("cs", fontName="Helvetica", fontSize=13, leading=19,
                              textColor=INK, spaceAfter=8),
}

story = []
A = story.append


def h1(t): A(Paragraph(t, S["h1"]))
def h2(t): A(Paragraph(t, S["h2"]))
def h3(t): A(Paragraph(t, S["h3"]))
def p(t): A(Paragraph(t, S["p"]))
def note(t): A(Paragraph(t, S["note"]))
def bl(items):
    for i in items:
        A(Paragraph("\u2022&nbsp;&nbsp;" + i, S["b"]))
    A(Spacer(1, 4))
def code(t, cap=None):
    if cap:
        A(Paragraph(cap, S["cap"]))
    A(Preformatted(t.strip("\n"), S["code"]))
def dia(t, cap=None):
    if cap:
        A(Paragraph(cap, S["cap"]))
    A(Preformatted(t.strip("\n"), S["dia"]))
def table(rows, widths):
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VIOLET),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF8FE")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ]))
    A(t)
    A(Spacer(1, 9))


def tech(name, what, why, problem, without, where, files):
    h3(name)
    bl([
        "<b>What is it?</b> " + what,
        "<b>Why do we need it?</b> " + why,
        "<b>What problem does it solve?</b> " + problem,
        "<b>Without it?</b> " + without,
        "<b>Where in Unisphere?</b> " + where,
        "<b>Files to open:</b> <font name='Courier'>" + files + "</font>",
    ])


# ============================================================ COVER
A(Spacer(1, 42 * mm))
A(Paragraph("Unisphere", S["cover_t"]))
A(Paragraph("A Full-Stack Teaching Handbook", S["cover_t"]))
A(Spacer(1, 6 * mm))
A(Paragraph("Learning real web development by studying one real application "
            "&mdash; the one already running in your workspace.", S["cover_s"]))
A(Paragraph("Written for a complete beginner. Nothing is assumed. Every technology is "
            "explained before it is used, and every explanation points at a real file "
            "in your repository.", S["cover_s"]))
A(Spacer(1, 8 * mm))
dia("""
PART 1  What this application does
PART 2  The technology stack, explained from zero
PART 3  High-level architecture
PART 4  Project folder / file map
PART 5  Database architecture
PART 6  How frontend, backend and database talk
PART 7  Your learning roadmap (LEVEL 0 - 12)
PART 8  Lesson 1: how the web actually works

APPENDIX A  API reference table
APPENDIX B  Nine real user actions, traced end to end
APPENDIX C  Commands, logins and debugging cheat sheet
""")
A(PageBreak())

# ============================================================ HOW TO USE
h1("Before we begin: how to use this handbook")
p("This handbook is not documentation. It is a course. It follows three rules.")
h3("Rule 1 &mdash; Nothing is assumed")
p("Every technology gets five questions answered before you see any code that uses it: "
  "what is it, why do we need it, what problem does it solve, what would happen without it, "
  "and where does this project use it. If a word appears that you have not met, it is defined "
  "on the spot.")
h3("Rule 2 &mdash; Architecture before files")
p("Beginners usually start by opening a random file and get lost, because a single file makes "
  "no sense on its own. So we start from the outside: what the whole system looks like, how a "
  "click travels through it, and only then what individual files contain.")
h3("Rule 3 &mdash; Every concept is anchored in your real code")
p("There are no invented examples of \"a typical app\". Every snippet in this handbook was copied "
  "out of your repository. Filenames and line contents are real. If a snippet is shortened, it says so.")
h2("A note on honesty about difficulty")
p("Some parts of this project are genuinely hard &mdash; WebRTC video calling is a topic that "
  "professional engineers find difficult. This handbook will never tell you \"don't worry about "
  "this\". Instead it tells you: <i>you do not need to master this today, and here is exactly "
  "what it does.</i> Each major area is labelled:")
bl([
    "<b>MUST UNDERSTAND NOW</b> &mdash; core concepts; everything else is built on them.",
    "<b>SHOULD UNDERSTAND SOON</b> &mdash; important, but it can wait a few weeks.",
    "<b>CAN TREAT AS A LIBRARY</b> &mdash; complex machinery you can use correctly long before "
    "you could write it from scratch. Professionals do this every day.",
])
A(PageBreak())

# ============================================================ PART 1
h1("PART 1 &mdash; What this application does")
p("Unisphere is a web application for undergraduate university students. In one sentence: "
  "<b>it is LinkedIn for undergraduates, with the spontaneous video discovery of OmeTV.</b>")
p("It exists because a student's real network is accidentally tiny &mdash; it is whoever happens "
  "to sit in their classroom. Unisphere's tagline is the product thesis: <i>\"Your Campus Is "
  "Bigger Than Your Campus.\"</i>")
h2("The eighteen things a user can actually do")
table([
    ["Area", "What the user does", "Where in the app"],
    ["Authentication", "Sign up with student details, log in, log out, stay logged in", "/signup, /login"],
    ["Profile", "Degree, branch, year, skills, interests, links, reputation, connections", "/profile/:id"],
    ["Home feed", "Post text/image/video, like, comment, share, bookmark, report, delete own", "/feed"],
    ["Stories", "24-hour photo/video/text stories, viewer, reactions, replies", "/feed (top ribbon)"],
    ["Dashboard", "Personalised greeting, recommendations, upcoming meetings, requests", "/dashboard"],
    ["Discover", "Filter students by college, degree, branch, year, city, skills, interests", "/discover"],
    ["Meet Someone", "Pick intents, join a queue, get matched with a live student", "/meet"],
    ["Video calling", "Real WebRTC 1-to-1 call: camera, mic, screen share, in-call chat", "/calls/:callId"],
    ["Messaging", "Conversation list, unread badges, thread history, send messages", "/messages"],
    ["Projects", "Create projects, list required roles, request to join, review applicants", "/projects"],
    ["Meetings", "Publish weekly availability, book a slot, track meeting status", "/meetings"],
    ["Communities", "College hubs with rosters, events, follower counts", "/communities"],
    ["Connections", "Send / accept / reject / remove connection requests", "/connections"],
    ["Notifications", "Likes, comments, requests, bookings, calls, matches", "/notifications"],
    ["Reputation", "Five-dimension peer endorsement with anti-abuse rules", "/profile/:id"],
    ["Safety", "Report any entity, block users, privacy toggles", "everywhere + /settings"],
    ["Admin", "Metrics, moderation queue, suspend users, delete posts", "/admin"],
    ["Search", "One search box across students, colleges, projects and posts", "/search"],
], [78 * mm, 0, 0])
p("Scale of the codebase: <b>17 backend routers, 18 frontend pages, 22 database collections, "
  "roughly 10,400 lines of code.</b> That is a small-to-medium real product, not a toy.")
A(PageBreak())

# ============================================================ PART 2
h1("PART 2 &mdash; The technology stack, explained from zero")
p("Before the list, one idea that makes the whole list make sense.")
h2("The single most important idea in web development")
p("A web application is always <b>two programs talking to each other over the internet</b>.")
dia("""
  PROGRAM 1: the FRONTEND                 PROGRAM 2: the BACKEND
  runs INSIDE the user's browser          runs on a SERVER you control
  (Chrome on a phone or laptop)           (a computer in a data centre)

  It can:  draw the screen                It can:  read/write the database
           react to clicks                         check passwords
           send requests                           enforce the rules
  It CANNOT be trusted                    It IS the source of truth
""")
p("Why can't the frontend be trusted? Because it runs on the <i>user's</i> machine. Anyone can "
  "open the browser's developer tools and change it. So the frontend is only ever a <b>display "
  "and input layer</b>. Every decision that matters &mdash; is this password correct, may this "
  "person delete this post &mdash; must be made by the backend.")
note("Remember this sentence: the frontend asks, the backend decides. Almost every security bug "
     "in beginner projects is a violation of it.")

h2("2.1 The languages")
tech("HTML", "The language that describes the <i>structure</i> of a page: headings, buttons, images, inputs.",
     "A browser cannot show anything without structure to render.",
     "It separates content and meaning from appearance.",
     "You would have no page at all.",
     "You will barely see raw HTML here, because React generates it. The one real HTML file is the shell the browser loads first.",
     "frontend/index.html")
tech("CSS", "The language that describes <i>appearance</i>: colour, size, spacing, layout, animation.",
     "Unstyled HTML is black text on white, unusable on a phone.",
     "It lets one structure look different on desktop and mobile, and lets you restyle without touching logic.",
     "Your app would look like a 1995 document.",
     "All theme colours, fonts and the signature glow/aura effects live in one stylesheet as CSS variables.",
     "frontend/src/index.css")
tech("JavaScript", "The only programming language browsers can run. It makes pages <i>do</i> things: respond to clicks, fetch data, update the screen.",
     "HTML and CSS are static descriptions. Nothing is interactive without JS.",
     "It turns a document into an application.",
     "Every button in Unisphere would be decoration.",
     "Indirectly everywhere &mdash; because TypeScript (next) compiles down to JavaScript, and that is what actually runs in the browser.",
     "every .tsx / .ts file, after compilation")
tech("TypeScript", "JavaScript plus a type system. You declare what shape your data has, and a compiler checks you never break your own promise. Types vanish at runtime; they exist only to catch your mistakes while you write.",
     "JavaScript will happily let you write post.titel and fail silently at 2 a.m. in production.",
     "It converts a whole class of runtime crashes into errors on your screen while typing.",
     "Renaming one field in the backend would break five pages, and you would find out from a user, not a compiler.",
     "The entire frontend. Every response shape from the backend has a matching TypeScript interface.",
     "frontend/src/lib/types.ts (435 lines of these shapes)")
tech("Python", "A general-purpose programming language, very readable, dominant in backend and data work.",
     "The backend needs a language too, and it does not have to be JavaScript.",
     "It gives fast development with a huge ecosystem of libraries.",
     "No backend.",
     "The entire server side.",
     "everything under backend/")
note("Your brief suggested a Node.js backend. This project uses Python + FastAPI instead, because "
     "that is the stack the workspace is built on. Every concept you learn here &mdash; routes, "
     "middleware, models, JWT &mdash; transfers to Node/Express almost one-to-one. The ideas are "
     "the skill; the language is a detail.")

h2("2.2 The frontend libraries")
tech("React", "A JavaScript library for building user interfaces out of <b>components</b> &mdash; small reusable pieces that each own a bit of screen. You describe what the screen should look like for a given set of data; React works out how to update the real page.",
     "Updating a page by hand (\"find this element, change this text, insert this row\") becomes unmanageable past a few screens.",
     "It removes manual DOM manipulation and gives you reusable, composable UI.",
     "You would write thousands of lines of fragile \"find element, change it\" code.",
     "All 18 pages and every component.",
     "frontend/src/pages/*.tsx, frontend/src/components/*.tsx")
tech("Vite", "The build tool and development server. It serves your code to the browser instantly while you develop, and bundles it into optimised files for production.",
     "Browsers cannot read .tsx files or import npm packages directly.",
     "Instant startup, hot reload (save a file, the screen updates without losing state), and an optimised production build.",
     "You would refresh manually and ship huge slow bundles.",
     "It runs your frontend on port 3000, and forwards every /api request to the backend &mdash; the trick that lets frontend code use plain relative URLs.",
     "frontend/vite.config.ts")
tech("Tailwind CSS", "A styling system where you compose small utility classes directly in your markup (p-4 = padding, flex = flex layout, text-violet-400 = colour) instead of writing separate CSS rules.",
     "In big projects, hand-written CSS files grow into a tangle nobody dares delete from.",
     "Styles live next to the markup they affect, so deleting a component deletes its styles too. Dead CSS becomes impossible.",
     "You would maintain thousands of lines of CSS with names like .card-inner-2.",
     "Every component's className attribute.",
     "any .tsx file; theme tokens in frontend/src/index.css")
tech("shadcn/ui", "A collection of ready-made, accessible React components (button, dialog, dropdown, input, badge...) that are <b>copied into your project</b> rather than installed as a black box.",
     "Building a keyboard-accessible dropdown or modal correctly is genuinely hard and takes days.",
     "Professional, accessible building blocks you can still open and edit, because the code is yours.",
     "You would ship inaccessible custom widgets, or spend weeks rebuilding solved problems.",
     "Buttons, dialogs, dropdown menus, inputs, badges throughout the UI.",
     "frontend/src/components/ui/")
tech("TanStack Query", "A data-fetching library. You tell it \"this screen needs the posts\" and it handles caching, loading flags, errors, retries, de-duplication and refetching.",
     "Every screen otherwise re-implements loading spinners, error states and cache invalidation, slightly differently, forever.",
     "It removes the most repetitive and bug-prone code in any frontend: server state management.",
     "You would fetch inside useEffect, double-fetch on every render, and show stale data after saving.",
     "Every read (useQuery) and every write (useMutation) in the app.",
     "frontend/src/lib/queryClient.ts and every page")
tech("React Router", "Turns URLs into screens inside a single-page app, so /feed and /profile/123 render different components without a full page reload.",
     "A single-page app has one HTML file; without a router every URL would show the same thing.",
     "Real, shareable, bookmarkable URLs plus instant navigation.",
     "One screen, no back button, no links you can share.",
     "The route table for all 18 pages.",
     "frontend/src/App.tsx")
tech("sonner", "A toast-notification library &mdash; the small messages that slide in saying \"Post created\".",
     "Users need confirmation that an action worked, without a blocking alert box.",
     "Non-intrusive feedback.",
     "Users click a button, nothing visible happens, and they click it four more times.",
     "Success/error feedback across the app, anchored bottom-right so it never covers the notification bell.",
     "frontend/src/App.tsx (the Toaster), toast() calls in components")

h2("2.3 The backend libraries")
tech("FastAPI", "A Python web framework: it turns Python functions into HTTP endpoints (URLs the frontend can call), validates incoming data, and generates interactive API documentation automatically.",
     "Raw HTTP handling is tedious and easy to get wrong.",
     "You write a normal Python function, declare the data shape, and get validation, error responses and docs for free.",
     "You would hand-parse requests and hand-write validation for all 100+ endpoints.",
     "Every endpoint in the app.",
     "backend/server.py, backend/routers/*.py")
tech("Uvicorn", "The web server process that actually listens on a network port and runs your FastAPI app.",
     "A framework is just code; something has to hold the socket open and accept connections.",
     "It handles the network layer, and in development it restarts automatically when you save a file.",
     "Your API would never be reachable.",
     "Runs your backend on port 8001, supervised so it restarts if it crashes.",
     "managed by supervisor, program name 'backend'")
tech("Pydantic v2", "A data-validation library. You declare a class describing the fields and types you expect; Pydantic enforces it and rejects anything else with a clear error.",
     "Data arriving from the internet is <i>never</i> trustworthy &mdash; it may be missing fields, wrong types, or hostile.",
     "Validation at the boundary. Bad data is rejected before it can reach your logic or database.",
     "You would write if not isinstance(...) checks by hand, forget some, and store corrupt records.",
     "Every request body and response shape.",
     "backend/models/schemas.py")
tech("MongoDB", "A database: the program that stores your data permanently on disk. MongoDB is a <i>document</i> database &mdash; it stores JSON-like documents inside named collections, instead of fixed rows in tables.",
     "Program memory disappears the moment the process restarts. Users expect their posts to still be there tomorrow.",
     "Durable storage plus fast querying by index.",
     "Every post, message and account would vanish on restart.",
     "All 22 collections of application data.",
     "backend/lib/db.py")
tech("Motor", "The asynchronous MongoDB driver for Python &mdash; the library your code uses to send queries to MongoDB without blocking the server while it waits.",
     "A database query takes milliseconds, and during those milliseconds a blocking server can serve nobody else.",
     "It lets one server handle many simultaneous users while queries are in flight.",
     "Your API would serve requests strictly one at a time and crawl under load.",
     "Every database call: await db.posts.find_one(...).",
     "backend/lib/db.py exports the shared db handle")
tech("passlib + bcrypt", "A password-hashing library. Hashing turns a password into a fixed-length scramble that cannot be reversed. bcrypt is deliberately slow, which makes guessing attacks expensive.",
     "You must be able to check a password without ever being able to read it.",
     "If your database leaks, attackers still do not have your users' passwords.",
     "A single database leak would expose every user's real password &mdash; and, because people reuse passwords, their email and bank logins too.",
     "Signup hashes; login verifies.",
     "backend/lib/auth.py")
tech("PyJWT", "Creates and verifies JSON Web Tokens: a small signed string that says \"this is user X\" and cannot be tampered with without breaking the signature.",
     "HTTP is stateless &mdash; the server forgets you between requests. Something must prove who you are on each one.",
     "Stateless authentication: no session table, no server memory of logins.",
     "Users would have to send their password with every single request.",
     "Issued at signup/login, verified on every protected request.",
     "backend/lib/auth.py")
tech("python-dotenv", "Loads configuration from a .env file into the program's environment variables.",
     "Secrets (database URL, JWT secret, API keys) must never be written into source code that gets committed or shipped to browsers.",
     "It separates configuration from code, so the same code runs in development and production with different settings.",
     "Your secrets would be in your Git history forever, readable by anyone with repo access.",
     "MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET.",
     "backend/.env, read via os.environ")

h2("2.4 The browser platform features")
tech("WebRTC", "A set of capabilities built into every modern browser that lets two browsers send audio and video <b>directly to each other</b>, without the media passing through your server.",
     "Video is enormous. Relaying every call through your server would cost a fortune and add lag.",
     "Real-time peer-to-peer audio/video with low latency.",
     "You would need a paid media server, or your \"video call\" would be a fake screen.",
     "Real 1-to-1 calls and the Meet Someone matches.",
     "frontend/src/lib/useWebRTC.ts, backend/routers/calls_router.py, meet_router.py")
tech("localStorage", "A small key-value store inside the browser that survives page reloads and browser restarts.",
     "Without it, refreshing the page would log the user out, because JavaScript memory is wiped.",
     "Session persistence on the client.",
     "You would log in again after every refresh.",
     "The login token is stored under the key unisphere_auth_token.",
     "frontend/src/lib/session.ts, api.ts, auth-context.tsx")
tech("HTTP polling (used here instead of WebSockets)", "Polling means the frontend repeatedly asks \"anything new?\" on a timer. WebSockets instead keep one connection permanently open so the server can push instantly.",
     "Chat and call signalling need to feel live.",
     "Polling achieves near-real-time with plain HTTP and no extra infrastructure.",
     "Nothing &mdash; but it costs more requests than WebSockets, and updates arrive up to one interval late.",
     "Chat refresh, notification refresh, and WebRTC signalling exchange every 2.5 seconds.",
     "frontend/src/lib/useWebRTC.ts line ~179: setInterval(poll, 2500)")
note("This is a deliberate, declared trade-off, not an oversight. Polling is simpler and adequate at "
     "this scale; WebSockets are the documented upgrade path, and because all traffic already flows "
     "through one fetch layer, swapping them in later touches few files. Part 7 LEVEL 9 covers this.")
A(PageBreak())

# ============================================================ PART 3
h1("PART 3 &mdash; High-level architecture")
h2("The simple version")
dia("""
        USER
          |   clicks, types
          v
     +---------------------------------------------+
     |  BROWSER  (frontend)                        |
     |  React + TypeScript + Tailwind, port 3000   |
     +---------------------------------------------+
          |   HTTP request to /api/...
          v
     +---------------------------------------------+
     |  API LAYER  (FastAPI, port 8001)            |
     |  api_router, prefix /api                    |
     +---------------------------------------------+
          |   Python function call
          v
     +---------------------------------------------+
     |  BACKEND LOGIC  (17 routers + lib/)         |
     |  auth check -> permission check -> rules    |
     +---------------------------------------------+
          |   Motor query
          v
     +---------------------------------------------+
     |  DATABASE  (MongoDB, 22 collections)        |
     +---------------------------------------------+
""")
h2("The real version, with the actual pieces of your project")
dia("""
  BROWSER
  +--------------------------------------------------------------+
  | main.tsx      QueryClientProvider + BrowserRouter (wiring)   |
  | App.tsx       AuthProvider + 18 routes + Toaster             |
  | AppShell.tsx  sidebar (desktop) / bottom bar (mobile)        |
  | pages/*.tsx   one file per screen                            |
  | components/   PostCard, StoryRibbon, Avatar, ReportDialog    |
  |                                                              |
  | lib/auth-context.tsx  who am I? (React context)              |
  | lib/api.ts            THE ONLY PLACE fetch() is called       |
  | lib/types.ts          TS mirrors of backend models           |
  | lib/useWebRTC.ts      camera, peer connection, signalling    |
  +--------------------------------------------------------------+
        |  relative URL: /api/posts
        v
  VITE DEV SERVER (port 3000) -- proxy: /api  ->  localhost:8001
        |
        v
  FASTAPI (port 8001)
  +--------------------------------------------------------------+
  | server.py    api_router(prefix='/api') + 17 sub-routers      |
  |              app.include_router(api_router)  <- LAST LINE    |
  |                                                              |
  | lib/auth.py  hash / verify / JWT / get_current_user_*        |
  | lib/db.py    Motor client + index plan + ensure_indexes()    |
  | lib/dates.py server-anchored 'today'                         |
  | models/schemas.py  every Pydantic model                      |
  | routers/     auth users connections posts stories meet calls |
  |              messages projects meetings colleges reputation  |
  |              notifications safety admin search ai            |
  +--------------------------------------------------------------+
        |  await db.<collection>...
        v
  MONGODB (in-pod, 22 collections, indexed at startup)

  SIDE CHANNEL (media does NOT touch the server):
  Browser A  <===== audio/video, peer-to-peer (WebRTC) =====>  Browser B
             the server only relays offer / answer / ICE
""")
h2("How one click travels: the Like button, for real")
p("This is the single most useful diagram in the handbook. Every trace in Appendix B has this shape.")
dia("""
 1  User taps the heart on a post
      |
 2  PostCard.tsx: onClick={() => likeMutation.mutate()}
      |
 3  useMutation calls apiPost(`/posts/${post.id}/like`)
      |
 4  lib/api.ts attaches Authorization: Bearer <token>, calls fetch()
      |
 5  Vite proxy forwards /api/posts/<id>/like  ->  :8001
      |
 6  FastAPI matches @router.post('/{post_id}/like') in posts_router.py
      |
 7  Depends(get_current_user_required) decodes the JWT, loads the user,
    rejects suspended accounts, raises 401 if anything is wrong
      |
 8  Handler reads the post          -> 404 if it does not exist
      |
 9  Handler checks post_likes for (post_id, user_id)
      |         already liked?                    not liked yet?
      |         delete the like                   insert the like
      |         $inc likes_count by -1            $inc likes_count by +1
      |                                           insert a notification
      |                                           for the post's author
      |
10  Returns {"liked": true, "likes_count": 8}
      |
11  onSuccess -> queryClient.invalidateQueries({queryKey:['posts']})
      |
12  TanStack Query refetches /api/posts, React re-renders
      |
13  The heart is filled and the count reads 8
""")
p("Notice three things a beginner would not guess:")
bl([
    "<b>The like is a separate document, not a field on the post.</b> post_likes holds one "
    "document per (post, user) pair, with a unique index &mdash; that is what makes double-liking "
    "impossible at the database level, not just in the UI.",
    "<b>likes_count is a duplicated counter.</b> The true answer is \"count the documents in "
    "post_likes\", but counting on every read is slow, so the count is stored on the post and "
    "adjusted with $inc. This is called <i>denormalisation</i>: trading a little duplication for a "
    "lot of speed.",
    "<b>The frontend does not calculate the new count.</b> It throws its cache away and asks the "
    "server again. The server stays the one source of truth, so two devices can never disagree.",
])
note("Step 11 is where most beginner apps break. They update local state by hand, the server "
     "disagrees, and the UI shows a number that does not exist. Invalidate, don't guess.")
A(PageBreak())

# ============================================================ PART 4
h1("PART 4 &mdash; Project folder and file map")
p("This is the real tree in your workspace. Nothing here is invented.")
dia("""
/app
+-- backend/                      the server (Python)
|   +-- server.py                 entry point: builds the app, mounts 17 routers
|   +-- seed.py                   fills the DB with demo students and content
|   +-- requirements.txt          pinned Python dependencies
|   +-- .env                      SECRETS: MONGO_URL, DB_NAME, JWT_SECRET (never committed)
|   +-- lib/
|   |   +-- db.py                 Mongo client + the index plan + ensure_indexes()
|   |   +-- auth.py               hashing, JWT, get_current_user_* dependencies
|   |   +-- dates.py              server-side 'today' helper
|   +-- models/
|   |   +-- schemas.py            EVERY Pydantic model (request + response shapes)
|   +-- routers/                  one file per feature area
|       +-- auth_router.py          signup, login, logout, me, reset-password
|       +-- users_router.py         profiles, edit, discovery filters
|       +-- connections_router.py   request / accept / reject / remove
|       +-- posts_router.py         feed CRUD, like, comment, bookmark, report
|       +-- stories_router.py       24h stories, views, reactions
|       +-- messages_router.py      conversations + messages
|       +-- projects_router.py      projects + join requests
|       +-- meetings_router.py      availability + bookings
|       +-- meet_router.py          Meet Someone queue + matching + signalling
|       +-- calls_router.py         1-to-1 call sessions + signalling
|       +-- colleges_router.py      community hubs, follows, events
|       +-- reputation_router.py    5-dimension endorsements
|       +-- notifications_router.py notification feed
|       +-- safety_router.py        reports + blocks + privacy
|       +-- admin_router.py         metrics + moderation actions
|       +-- search_router.py        global multi-entity search
|       +-- ai_router.py            AI bio / pitch / icebreaker helpers
|
+-- frontend/                     the browser app (TypeScript)
|   +-- index.html                the single HTML file the browser loads
|   +-- vite.config.ts            dev server + the /api -> :8001 proxy
|   +-- package.json              JS dependencies and scripts (yarn typecheck)
|   +-- public/                   files served as-is (the two decks live here)
|   +-- src/
|       +-- main.tsx              mounts React; QueryClientProvider + BrowserRouter
|       +-- App.tsx               route table for all 18 pages + Toaster
|       +-- index.css             THEME: colour tokens, fonts, signature effects
|       +-- pages/                one file per screen (18)
|       |   +-- Landing.tsx Login.tsx Signup.tsx Dashboard.tsx Feed.tsx
|       |   +-- Discover.tsx Profile.tsx Messages.tsx MeetSomeone.tsx
|       |   +-- CallRoom.tsx Projects.tsx Meetings.tsx Communities.tsx
|       |   +-- Connections.tsx Notifications.tsx Search.tsx Settings.tsx Admin.tsx
|       +-- components/
|       |   +-- AppShell.tsx      nav shell: sidebar on desktop, bottom bar on mobile
|       |   +-- PostCard.tsx      one post + like/comment/share/bookmark/report
|       |   +-- StoryRibbon.tsx   the stories carousel and viewer
|       |   +-- Avatar.tsx        profile picture with story aura
|       |   +-- ReportDialog.tsx  the reusable report modal
|       |   +-- States.tsx        shared loading / error / empty states
|       |   +-- ui/               shadcn/ui primitives (button, dialog, input, ...)
|       +-- lib/
|           +-- api.ts            the typed fetch layer (the only fetch in the app)
|           +-- types.ts          TypeScript mirrors of the Pydantic models
|           +-- auth-context.tsx  logged-in user, login/signup/logout
|           +-- session.ts        the localStorage token key
|           +-- queryClient.ts    TanStack Query configuration
|           +-- useWebRTC.ts      camera, peer connection, signalling, controls
|           +-- helpers.ts        timeAgo(), getErrorMessage(), small utilities
|           +-- utils.ts          cn() class-name merge helper for Tailwind
|
+-- memory/
|   +-- SPEC.md                   the living specification of the product
|   +-- test_credentials.md       working demo logins
+-- scripts/                      the generators for your two learning documents
""")
h2("Why the folders are shaped like this")
h3("One router file per feature area")
p("A single 3,000-line server.py is unreadable and impossible to work on with other people. "
  "Seventeen files of roughly 250 lines each means a bug in search physically cannot break "
  "messaging, and two developers can work in parallel without colliding.")
h3("lib/ on both sides means \"shared machinery\"")
p("Anything used by more than one feature lives in lib/. The database handle, authentication, "
  "the fetch layer, the types. If you find yourself copying a function into a second file, it "
  "belongs in lib/.")
h3("pages/ vs components/")
p("A <b>page</b> is a whole screen with a URL. A <b>component</b> is a reusable piece used by "
  "pages. PostCard is a component because Feed, Profile, Dashboard and Search all render posts; "
  "writing it four times would guarantee four different behaviours.")
h3("models/schemas.py mirrors lib/types.ts")
p("These two files are the contract between the two programs. Part 6 explains why keeping them "
  "in sync is a daily discipline rather than something a tool does for you.")
A(PageBreak())

# ============================================================ PART 5
h1("PART 5 &mdash; Database architecture")
h2("First, what a database actually is")
p("A database is a separate program whose only job is to store data safely and find it again "
  "quickly. Your backend talks to it over a connection, the same way your frontend talks to your "
  "backend. It keeps data on disk, so a restart loses nothing.")
h2("Tables and rows vs collections and documents")
p("Traditional (relational, SQL) databases like PostgreSQL store <b>tables</b>. A table has fixed "
  "<b>columns</b> and each record is a <b>row</b>:")
dia("""
  TABLE users
  +--------------------------------------+-------------------+---------+
  | id                                   | email             | college |
  +--------------------------------------+-------------------+---------+
  | 8f2c...                              | karan@...         | LPU     |   <- a ROW
  +--------------------------------------+-------------------+---------+
      ^ COLUMN                               ^ COLUMN           ^ COLUMN
""")
p("MongoDB stores <b>collections</b> of <b>documents</b>. A document is a JSON-like object, and "
  "documents in one collection do not have to be identical:")
code("""
// one document in the "users" collection
{
  "id": "8f2c...",
  "email": "karan@unisphere.edu",
  "password_hash": "$2b$12$....",
  "full_name": "Karan Kumar",
  "college": "Lovely Professional University",
  "degree": "B.Tech CSE",
  "current_year": "2nd Year",
  "skills": ["Python", "C++", "Machine Learning", "OpenCV"],
  "role": "student",
  "reputation_score": 5.0,
  "connections_count": 12,
  "privacy": { "who_can_message": "everyone", "show_email": false }
}
""", "A real document shape from your users collection (values shortened)")
p("Two things to notice. A field can hold a <b>list</b> (skills) or a whole <b>nested object</b> "
  "(privacy) &mdash; a relational table cannot do that without extra tables. And "
  "<b>password_hash</b> is stored, never the password.")
h2("Keys: how records point at each other")
bl([
    "<b>Primary key</b> &mdash; the field that uniquely identifies a record. Here it is <font "
    "name='Courier'>id</font>, a UUID string like <font name='Courier'>8f2c9a1e-...</font>.",
    "<b>Foreign key</b> &mdash; a field holding another record's primary key, to express a "
    "relationship. <font name='Courier'>post.author_id</font> holds a user's id.",
    "<b>Why UUID strings and not MongoDB's built-in _id?</b> Mongo's ObjectId is a special binary "
    "type that is not JSON-serialisable, so it leaks into API responses as a crash. Every "
    "collection here therefore carries its own string <font name='Courier'>id</font>, with a "
    "unique index on it.",
])
h2("The three kinds of relationship")
dia("""
  ONE-TO-ONE      one user has exactly one availability record
                  users.id  <---->  availabilities.user_id   (unique index)

  ONE-TO-MANY     one user writes many posts
                  users.id  <----<  posts.author_id

  MANY-TO-MANY    many users like many posts
                  users.id  >----  post_likes  ----<  posts.id
                                   (a JOIN collection: one doc per pair)
""")
p("Many-to-many always needs a third collection in the middle, called a join (or junction) "
  "collection. That is exactly what post_likes, post_bookmarks, connections, project_requests, "
  "college_follows and blocks are.")
h3("Why likes are not just an array inside the post")
p("The tempting beginner design is <font name='Courier'>post.liked_by = [userId, userId, ...]</font>. "
  "It breaks in three ways: the document grows without limit (Mongo caps a document at 16MB), "
  "two simultaneous likes can overwrite each other, and \"which posts did I like?\" requires "
  "scanning every post. A join collection with a unique index on (post_id, user_id) fixes all three.")
h2("Your 22 collections")
table([
    ["Collection", "Holds", "Key relationships"],
    ["users", "accounts, student details, hashed password, reputation, privacy", "primary entity"],
    ["connections", "one doc per connection request", "requester_id + recipient_id -> users"],
    ["posts", "feed items with denormalised author info", "author_id -> users"],
    ["post_likes", "one doc per (post, user) like", "join: posts x users, unique"],
    ["post_comments", "comments on posts", "post_id -> posts, author -> users"],
    ["post_bookmarks", "saved posts", "join: posts x users, unique"],
    ["stories", "24h stories with expires_at, views, reactions", "author -> users"],
    ["conversations", "a chat between two users + unread counts", "participants[] -> users"],
    ["messages", "the individual messages", "conversation_id -> conversations"],
    ["projects", "collaboration projects, tech, roles, links", "owner_id -> users"],
    ["project_requests", "join requests with a status", "project_id + applicant_id"],
    ["availabilities", "one weekly schedule per user", "user_id -> users, unique"],
    ["meetings", "a concrete booking of one slot", "host_id + guest_id -> users"],
    ["colleges", "community hubs", "name unique"],
    ["college_follows", "which student follows which college", "join"],
    ["reputation_reviews", "5-dimension endorsements", "(reviewer_id, target_user_id) unique"],
    ["notifications", "per-user notification feed", "user_id + actor_id -> users"],
    ["reports", "moderation reports for any target type", "target_type + target_id"],
    ["blocks", "who blocked whom", "(blocker_id, blocked_user_id) unique"],
    ["meet_sessions", "Meet Someone queue + match + signalling", "the two matched users"],
    ["call_sessions", "1-to-1 call state + offer/answer/ICE", "caller_id + recipient_id"],
    ["post_shares / misc", "supporting records", "-"],
], [40 * mm, 72 * mm, 0])
h2("Indexes: the single biggest performance idea in databases")
p("Without an index, finding a record means reading <i>every</i> document in the collection. With "
  "1,000 posts that is invisible; with 1,000,000 it is a timeout. An index is a sorted lookup "
  "structure, exactly like the index at the back of a textbook: instead of reading the whole book "
  "to find \"photosynthesis\", you look it up and jump straight to page 412.")
p("Your project declares every index in one place and applies them automatically when the server "
  "boots, so a fresh database is always correctly indexed:")
code("""
# backend/lib/db.py  (excerpt)
INDEXES: dict[str, list[IndexModel]] = {
    "users": [
        IndexModel([("id", ASCENDING)],    name="user_id_unique",    unique=True),
        IndexModel([("email", ASCENDING)], name="user_email_unique", unique=True),
        IndexModel([("college", ASCENDING)], name="user_college"),
    ],
    "post_likes": [
        IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)],
                   name="like_unique", unique=True),
    ],
    ...
}

async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            await db[collection].create_indexes([model])
""")
code("""
# backend/server.py -- run once at startup, not per request
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    yield
    client.close()
""")
h3("unique=True is a constraint, and constraints are protection")
p("A <b>constraint</b> is a rule the database itself enforces. <font name='Courier'>unique=True</font> "
  "on (post_id, user_id) means the database will physically refuse a second like from the same "
  "user on the same post &mdash; even if your Python code has a bug, even if two requests arrive "
  "in the same millisecond. Application checks can be raced; database constraints cannot.")
note("Honest critique, as promised: this project uses MongoDB, while your brief asked for "
     "PostgreSQL. The schema was still designed relationally &mdash; separate collections, join "
     "collections, foreign-key-style ids, unique constraints &mdash; which is why it stays clean. "
     "The real trade-off is that MongoDB cannot enforce a foreign key: if a user is deleted, the "
     "code must clean up their posts, and nothing stops an orphaned author_id. PostgreSQL would "
     "enforce that for you. This is a genuine design difference, not a bug, and it is worth "
     "understanding before you choose a database for your next project.")
A(PageBreak())

# ============================================================ PART 6
h1("PART 6 &mdash; How frontend, backend and database communicate")
h2("Step 1: the frontend always uses relative URLs")
p("Frontend code never writes <font name='Courier'>http://localhost:8001</font>. It writes "
  "<font name='Courier'>/api/posts</font>. In development, Vite forwards anything starting with "
  "/api to the backend on port 8001. In production, one server serves both. Because the code says "
  "\"/api\", it works unchanged in both places.")
dia("""
  DEVELOPMENT                              PRODUCTION
  browser -> :3000 (Vite)                  browser -> one origin
                |  proxy /api                          |
                v                                      v
             :8001 (FastAPI)                        FastAPI
  frontend code is IDENTICAL in both cases
""")
h2("Step 2: every request goes through one function")
p("There is exactly one <font name='Courier'>fetch()</font> call in the whole frontend, inside "
  "<font name='Courier'>lib/api.ts</font>. Everything else uses the five helpers it exports.")
code("""
// frontend/src/lib/api.ts  (abridged, real code)
const BASE = "/api";

export class ApiError extends Error {
  status: number; body: unknown;
  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError"; this.status = status; this.body = body;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem("unisphere_auth_token");
  const headers: Record<string, string> = {};
  if (body != null) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method, headers, credentials: "include",
    body: body == null ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {                                  // fetch does NOT throw on 404/500
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }
  if (res.status === 204) return undefined as T;  // 204 = success, no content
  return (await res.json()) as T;
}

export const apiGet    = <T>(p: string) => request<T>("GET", p);
export const apiPost   = <T>(p: string, b?: unknown) => request<T>("POST", p, b);
export const apiPut    = <T>(p: string, b?: unknown) => request<T>("PUT", p, b);
export const apiPatch  = <T>(p: string, b?: unknown) => request<T>("PATCH", p, b);
export const apiDelete = <T>(p: string) => request<T>("DELETE", p);
""")
h3("The five jobs this one function does for the whole app")
bl([
    "Prefixes /api so no call site can forget it.",
    "Attaches the login token automatically &mdash; no page has to remember authentication.",
    "Sets the JSON content type only when there is a body.",
    "Converts any non-2xx response into a thrown ApiError carrying .status and .body, so the UI "
    "can react differently to 403 (not allowed) and 422 (invalid input).",
    "Handles 204 No Content, which has no JSON body at all &mdash; parsing it would crash.",
])
note("Critical beginner trap: fetch() only rejects on network failure. A 404 or a 500 resolves "
     "normally, so code without an res.ok check happily continues with an error page as its data. "
     "Solving it once, here, is why no page in this app has that bug.")
h2("Step 3: the contract &mdash; Pydantic model on one side, TypeScript interface on the other")
p("There is no magic bridge between Python and TypeScript. Python declares the response shape; "
  "TypeScript declares what it believes it will receive. Nothing checks that the two agree. So "
  "the rule in this project is: <b>change one, change the other in the same edit.</b>")
code("""
# backend/models/schemas.py
class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_college: str
    content: str
    category: str = "general"
    tags: List[str] = Field(default_factory=list)
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    is_bookmarked_by_me: bool = False
    created_at: datetime
""")
code("""
// frontend/src/lib/types.ts  -- the mirror, field for field
export interface PostResponse {
  id: string;
  author_id: string;
  author_name: string;
  author_college: string;
  content: string;
  category: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  is_bookmarked_by_me: boolean;
  created_at: string;      // JSON has no Date type -> arrives as a string
}
""")
p("Note <font name='Courier'>created_at</font>: Python has a datetime, JSON does not. Over the "
  "wire it becomes a string, so the TypeScript type is <font name='Courier'>string</font>, and "
  "<font name='Courier'>helpers.ts</font> turns it into \"3 hours ago\" for display. Typing it as "
  "Date would be a lie the compiler would believe.")
h3("The safety net")
code("""
cd /app/frontend && yarn typecheck
""", "The only command that detects drift between those two files")
p("Vite <i>transpiles</i> TypeScript &mdash; it strips the types and runs the JavaScript &mdash; "
  "but it never checks them. So a mismatch is invisible in the browser until a value renders as "
  "undefined. yarn typecheck is the gate.")
h2("Step 4: TanStack Query owns reads and writes")
code("""
// reading: PostCard's comment list
const { data: comments, isLoading } = useQuery({
  queryKey: ["comments", post.id],
  queryFn: () => apiGet<CommentResponse[]>(`/posts/${post.id}/comments`),
});

// writing: the like button
const likeMutation = useMutation({
  mutationFn: () => apiPost<{ liked: boolean; likes_count: number }>(
    `/posts/${post.id}/like`),
  onSuccess: invalidate,
});

const invalidate = () => {
  void queryClient.invalidateQueries({ queryKey: ["posts"] });
  void queryClient.invalidateQueries({ queryKey: ["bookmarked-posts"] });
};
""", "Real code from frontend/src/components/PostCard.tsx")
bl([
    "<b>queryKey</b> is the cache address. Two components asking for [\"posts\"] share one request "
    "and one cached result &mdash; not two network calls.",
    "<b>queryFn</b> is how to fetch it. Note it calls apiGet, never fetch.",
    "<b>useMutation</b> is for anything that changes data. It gives you isPending and error for free.",
    "<b>invalidateQueries</b> marks cached data stale, so Query refetches and every component "
    "showing posts updates itself. You never manually tell the feed to refresh.",
])
h2("Step 5: the backend decides, then the database stores")
code("""
# backend/routers/posts_router.py -- the whole authorisation idea in 8 lines
@router.delete("/{post_id}")
async def delete_post(post_id: str,
                      current_user: dict = Depends(get_current_user_required)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own posts.")

    await db.posts.delete_one({"id": post_id})
    await db.post_likes.delete_many({"post_id": post_id})       # clean up children
    await db.post_comments.delete_many({"post_id": post_id})
    await db.post_bookmarks.delete_many({"post_id": post_id})
    return {"message": "Post deleted successfully"}
""")
p("Read that carefully, because it contains four separate professional habits:")
bl([
    "<b>Authentication</b> (who are you?) is handled by Depends(get_current_user_required) before "
    "the function body even runs.",
    "<b>Authorisation</b> (may you do this?) is a separate, explicit check on ownership. Being "
    "logged in is not permission.",
    "<b>Correct status codes</b>: 404 for missing, 403 for forbidden, so the frontend can respond "
    "meaningfully.",
    "<b>Manual cascade</b>: because MongoDB has no foreign keys, the code deletes the post's likes, "
    "comments and bookmarks itself. Forget this and you accumulate orphaned rows forever &mdash; "
    "exactly the trade-off flagged at the end of Part 5.",
])
A(PageBreak())

# ============================================================ PART 7
h1("PART 7 &mdash; Your learning roadmap")
p("This roadmap contains only what <b>this</b> project actually needs, plus the prerequisites you "
  "need before each step. No Next.js, no GraphQL, no Kubernetes &mdash; none of them appear in "
  "your code, so learning them now would be noise.")
p("Realistic pace, studying seriously a few hours a day: <b>LEVEL 0-4 in about a month, "
  "LEVEL 5-8 in a second month, LEVEL 9-12 after that.</b> Do not rush. Each level's exercise "
  "matters more than the reading.")

lv = [
    ("LEVEL 0", "How the web works", "MUST UNDERSTAND NOW",
     ["Client and server; what a request and a response are",
      "URLs, HTTP methods, status codes (200, 401, 403, 404, 422, 500)",
      "What the browser does with HTML, CSS and JavaScript"],
     "Nothing to open yet &mdash; Part 8 of this handbook is this level.",
     "Open your app, press F12, use the Network tab, click Like, and read the request that appears."),
    ("LEVEL 1", "HTML and CSS fundamentals", "MUST UNDERSTAND NOW",
     ["Elements, attributes, nesting, forms and inputs",
      "The box model: margin, border, padding, content",
      "Flexbox basics; what 'responsive' means and how a breakpoint works"],
     "frontend/index.html, frontend/src/index.css",
     "Change the page title and meta description in index.html; change one colour token in index.css and watch the whole app re-theme."),
    ("LEVEL 2", "JavaScript fundamentals", "MUST UNDERSTAND NOW",
     ["Variables, functions, arrays, objects, if/else, loops",
      "Array methods: map, filter, find, reduce",
      "async / await and Promises &mdash; essential, because every API call uses them",
      "JSON: what it is and why it is how programs exchange data"],
     "frontend/src/lib/helpers.ts is the gentlest real file in the project.",
     "Read timeAgo() in helpers.ts and explain out loud what every line does."),
    ("LEVEL 3", "TypeScript basics", "MUST UNDERSTAND NOW",
     ["Typing variables and function parameters",
      "interface and type; optional fields with ?; union types like 'image' | 'video'",
      "Generics, just enough to read apiGet<PostResponse[]>(...)"],
     "frontend/src/lib/types.ts",
     "Add a field to a TS interface that the backend does not send, use it in a component, and watch yarn typecheck stay silent &mdash; then see it be undefined in the browser. That lesson sticks."),
    ("LEVEL 4", "React fundamentals", "MUST UNDERSTAND NOW",
     ["Components and props; JSX",
      "useState; why you never mutate state directly",
      "Events, forms and controlled inputs",
      "Conditional rendering and rendering lists with a key",
      "useEffect and cleanup &mdash; and why you should not fetch in it here",
      "Custom hooks and React context"],
     "components/PostCard.tsx (props, state, events), lib/auth-context.tsx (context), pages/Feed.tsx",
     "Add a 'Copy link' button to PostCard that copies the post URL and shows a toast."),
    ("LEVEL 5", "Frontend architecture", "SHOULD UNDERSTAND SOON",
     ["Routing and protected routes",
      "Server state vs UI state, and why TanStack Query exists",
      "queryKey design and invalidation",
      "Loading, error and empty states as first-class UI",
      "Code splitting with lazy() and Suspense"],
     "App.tsx, lib/queryClient.ts, components/States.tsx, components/AppShell.tsx",
     "Add a /bookmarks page: new route, lazy import, useQuery on ['bookmarked-posts'], and a real empty state."),
    ("LEVEL 6", "Backend fundamentals", "MUST UNDERSTAND NOW",
     ["What a server process is; ports; localhost",
      "Routes, handlers, path parameters and query parameters",
      "Request body vs query string; JSON in and out",
      "Validation with Pydantic; error responses and status codes",
      "Dependency injection &mdash; what Depends(...) really does"],
     "server.py, routers/posts_router.py, models/schemas.py",
     "Add GET /api/posts/stats returning total posts and posts per category. Register it on the posts router, not on app."),
    ("LEVEL 7", "Databases", "MUST UNDERSTAND NOW",
     ["Collections, documents, primary keys, foreign keys",
      "One-to-one, one-to-many, many-to-many and join collections",
      "Queries, filters, sorting, skip/limit pagination",
      "Indexes and unique constraints; denormalised counters",
      "Enough SQL to understand what a relational database would do differently"],
     "lib/db.py (the index plan), any router's queries, seed.py",
     "Add an index for a filter you use, then add a query that uses it. Then explain why post_likes is a separate collection."),
    ("LEVEL 8", "Authentication and authorisation", "MUST UNDERSTAND NOW",
     ["Hashing vs encryption; why bcrypt is deliberately slow",
      "What a JWT contains and what it does not protect",
      "Bearer tokens vs cookies; httponly; localStorage trade-offs",
      "Authentication vs authorisation; ownership checks",
      "Protected routes on the frontend are UX, not security"],
     "lib/auth.py, routers/auth_router.py, lib/auth-context.tsx, App.tsx (Protected)",
     "Add a rule that only connected users may message each other &mdash; enforced in the backend, then reflected in the UI."),
    ("LEVEL 9", "Real-time features", "SHOULD UNDERSTAND SOON",
     ["Why request/response is a poor fit for chat",
      "Polling vs long polling vs WebSockets; the trade-offs",
      "Events, connection lifecycle, presence, typing indicators",
      "Notifications as stored records plus a live signal"],
     "routers/messages_router.py, pages/Messages.tsx, the polling in lib/useWebRTC.ts",
     "Measure it: how long after Maya sends a message does Karan see it? Then write down what a WebSocket would change."),
    ("LEVEL 10", "Video calling with WebRTC", "CAN TREAT AS A LIBRARY (for now)",
     ["getUserMedia: asking for camera and microphone permission",
      "What a peer connection is, and why media avoids your server",
      "SDP, offer and answer &mdash; the two sides describing their capabilities",
      "ICE candidates, STUN and TURN &mdash; finding a route through NAT",
      "Signalling: your server's only job in a call",
      "Track control: mute, camera off, screen share, and full teardown"],
     "lib/useWebRTC.ts, pages/CallRoom.tsx, routers/calls_router.py, routers/meet_router.py",
     "Do not rebuild this yet. Instead: add a call timer, and make sure ending a call turns the camera light off. Cleanup is the real lesson."),
    ("LEVEL 11", "Security", "MUST UNDERSTAND NOW (alongside LEVEL 8)",
     ["Never trust the client; validate everything server-side",
      "Injection attacks; why never to build queries from raw user strings",
      "XSS and why React escaping protects you by default",
      "CSRF, and how Bearer tokens change the picture",
      "Rate limiting, file-upload validation, secrets in environment variables",
      "Privacy as a feature: blocking, reporting, visibility controls"],
     "lib/auth.py, routers/safety_router.py, routers/admin_router.py, backend/.env",
     "Try to break your own app: call a protected endpoint with no token, then with another user's post id. Both must be refused."),
    ("LEVEL 12", "Git, workflow and deployment", "SHOULD UNDERSTAND SOON",
     ["Repository, commit, branch, merge, pull request; .gitignore",
      "Environment variables and dev vs production configuration",
      "What a production build is and why it differs from dev",
      "Deployment shapes: one host for both, or split frontend/backend",
      "Logs and monitoring &mdash; how you find out something broke"],
     "backend/.env, frontend/vite.config.ts, backend/requirements.txt, frontend/package.json",
     "Write the deployment plan for this app in your own words, including which external services production needs (TURN, email, file storage)."),
]
for name, title, tag, topics, files, ex in lv:
    block = [Paragraph(name + " &mdash; " + title, S["h2"]),
             Paragraph("Priority: <b>" + tag + "</b>", S["note"])]
    for t in topics:
        block.append(Paragraph("\u2022&nbsp;&nbsp;" + t, S["b"]))
    block.append(Paragraph("<b>Files in your project:</b> <font name='Courier' size='8.6'>"
                           + files + "</font>", S["p"]))
    block.append(Paragraph("<b>Exercise:</b> " + ex, S["p"]))
    A(KeepTogether(block))
h2("How to classify anything you meet in this codebase")
table([
    ["Label", "Meaning", "In this project"],
    ["MUST UNDERSTAND NOW", "Everything else stands on it", "HTTP, React basics, routes, Pydantic, queries, auth, ownership checks"],
    ["SHOULD UNDERSTAND SOON", "Important, can wait weeks", "TanStack Query internals, real-time design, Git workflow, deployment"],
    ["CAN TREAT AS A LIBRARY", "Use correctly now, build later", "WebRTC internals, shadcn/ui primitives, bcrypt, JWT signing, Motor"],
], [42 * mm, 48 * mm, 0])
p("Using something correctly long before you could implement it is not cheating &mdash; it is how "
  "every professional works. Nobody writes their own bcrypt.")
A(PageBreak())

# ============================================================ PART 8
h1("PART 8 &mdash; Lesson 1: how the web actually works")
p("One lesson at a time. This is LEVEL 0. Do not skip it because it sounds basic: almost every "
  "confusing thing later (\"why is my token undefined?\", \"why is it 401?\") is a gap in this "
  "lesson.")

h2("1. Concept")
p("The web runs on one exchange, repeated forever: a <b>client</b> sends a <b>request</b>, a "
  "<b>server</b> sends back a <b>response</b>. That is it. Every page load, every login, every "
  "like is one of these.")
dia("""
   CLIENT (browser)                              SERVER
        |                                          |
        |  REQUEST                                 |
        |  POST /api/posts/abc123/like             |
        |  Authorization: Bearer eyJhbGci...       |
        |----------------------------------------->|
        |                                          |  work: check token,
        |                                          |  read DB, write DB
        |  RESPONSE                                |
        |  200 OK                                  |
        |  {"liked": true, "likes_count": 8}       |
        |<-----------------------------------------|
        v                                          v
""")
p("A request has four parts worth knowing:")
bl([
    "<b>Method</b> &mdash; the verb. GET = read, POST = create/do, PUT/PATCH = update, DELETE = remove.",
    "<b>URL</b> &mdash; the address, e.g. /api/posts/abc123/like.",
    "<b>Headers</b> &mdash; metadata. This is where your login token travels.",
    "<b>Body</b> &mdash; the data you are sending (only for POST/PUT/PATCH). Usually JSON.",
])
p("A response has three:")
bl([
    "<b>Status code</b> &mdash; a number saying what happened. 200 OK. 401 not logged in. "
    "403 logged in but not allowed. 404 not found. 422 your data was invalid. 500 the server broke.",
    "<b>Headers</b> &mdash; metadata about the response.",
    "<b>Body</b> &mdash; the data, usually JSON.",
])
h3("The one thing that surprises everybody")
p("<b>HTTP is stateless.</b> The server does not remember you between requests. Your second "
  "request arrives as a total stranger. That single fact is the entire reason tokens, cookies and "
  "sessions exist &mdash; they are how each request re-proves who you are. Keep this in mind and "
  "authentication will feel obvious later instead of magical.")

h2("2. Why does this exist?")
p("The web had to work between machines that know nothing about each other, run different "
  "software, and may disconnect at any moment. Statelessness is what makes that survivable: any "
  "server can answer any request, so a service can run on a thousand machines behind one address, "
  "and one crashing loses nothing but the request in flight.")

h2("3. A tiny example (nothing to do with this project)")
p("Ordering coffee.")
dia("""
  YOU (client)                                 BARISTA (server)
  "One flat white, oat milk"   -- request -->
                                               makes it
  cup                          <-- response --

  Next morning you return. The barista does not remember you.
  You state your order again -> STATELESS.
  Give you a loyalty card, and each visit you present the card
  -> that card is a TOKEN. That is exactly what a JWT is.
""")

h2("4. How this project uses it")
p("Every single feature of Unisphere is this exchange. Let us look at one real request, in three "
  "layers: what the frontend sends, what the backend does, what comes back.")
code("""
POST /api/posts/abc123/like
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(no body)

--- server does its work ---

200 OK
{"liked": true, "likes_count": 8}
""", "The complete exchange behind one tap of the heart button")

h2("5. Code walkthrough")
h3("The browser side &mdash; components/PostCard.tsx")
code("""
const likeMutation = useMutation({
  mutationFn: () => apiPost<{ liked: boolean; likes_count: number }>(
    `/posts/${post.id}/like`),
  onSuccess: invalidate,
});

<button
  data-testid={`post-like-btn-${post.id}`}
  onClick={() => likeMutation.mutate()}
>
  <Heart ... />
  <span data-testid={`post-like-count-${post.id}`}>{post.likes_count}</span>
</button>
""")
bl([
    "<font name='Courier'>onClick</font> is a browser event: the user tapped, so run this function.",
    "<font name='Courier'>likeMutation.mutate()</font> starts the request. Nothing about URLs, "
    "tokens or JSON appears here &mdash; the button's job is to say what happened, not how to talk "
    "to a server.",
    "<font name='Courier'>apiPost&lt;{liked, likes_count}&gt;</font> declares the response shape, "
    "so TypeScript will catch you if you read a field the backend never sends.",
    "<font name='Courier'>{post.likes_count}</font> renders the number from data. When the data "
    "changes, React redraws it. You never write \"set the text of that span to 8\".",
    "<font name='Courier'>data-testid</font> is a stable hook for automated tests, so tests do not "
    "break when the styling changes.",
])
h3("The transport &mdash; lib/api.ts")
code("""
const token = localStorage.getItem("unisphere_auth_token");
if (token) headers["Authorization"] = `Bearer ${token}`;

const res = await fetch(`${BASE}${path}`, { method, headers, credentials: "include", ... });
if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
return (await res.json()) as T;
""")
p("This is where the abstract \"headers\" from the diagram become real. The token was saved at "
  "login; every request re-presents it. This is the loyalty card from the coffee example.")
h3("The server side &mdash; routers/posts_router.py")
code("""
@router.post("/{post_id}/like")
async def toggle_like(post_id: str,
                      current_user: dict = Depends(get_current_user_required)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = await db.post_likes.find_one(
        {"post_id": post_id, "user_id": current_user["id"]})

    if existing_like:                                   # already liked -> unlike
        await db.post_likes.delete_one(
            {"post_id": post_id, "user_id": current_user["id"]})
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False, "likes_count": max(0, post.get("likes_count", 1) - 1)}

    await db.post_likes.insert_one({                    # not liked -> like
        "post_id": post_id, "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
    })
    await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})

    if post["author_id"] != current_user["id"]:         # tell the author
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": post["author_id"],
            "actor_id": current_user["id"], "type": "post_like",
            "message": f"{current_user['full_name']} liked your post.",
            "link": f"/feed?post={post_id}", "is_read": False,
            "created_at": datetime.utcnow(),
        })

    return {"liked": True, "likes_count": post.get("likes_count", 0) + 1}
""", "The real handler, unabridged")
p("Line by line, the parts that matter:")
bl([
    "<font name='Courier'>@router.post(\"/{post_id}/like\")</font> &mdash; a decorator that says "
    "\"when a POST arrives at this URL, run this function\". The <font name='Courier'>{post_id}</font> "
    "in braces is a <b>path parameter</b>: whatever appears there is handed to the function as an argument.",
    "<font name='Courier'>Depends(get_current_user_required)</font> &mdash; FastAPI runs that "
    "function first. It reads the token, verifies the signature, loads the user, refuses suspended "
    "accounts, and raises 401 if anything fails. If it raises, your handler never runs at all. This "
    "is <b>middleware-style authentication</b>, expressed as a dependency.",
    "<font name='Courier'>await</font> on every database call &mdash; the server hands control back "
    "to other users while the database is working, instead of freezing.",
    "<font name='Courier'>find_one</font> then <font name='Courier'>404</font> &mdash; never assume "
    "the record exists. Ids come from the internet; the internet lies.",
    "<font name='Courier'>{\"$inc\": {\"likes_count\": 1}}</font> &mdash; \"increase this field by "
    "one\", performed <i>inside</i> the database. Reading 7, adding 1 and writing 8 in Python would "
    "lose a like if two people clicked at the same moment. $inc cannot.",
    "The notification is written only when the liker is not the author &mdash; a small product "
    "detail that separates a real app from a demo.",
    "<font name='Courier'>toggle</font>, not \"add\" &mdash; one endpoint handles like and unlike, "
    "because the truth lives in the database, not in what the button thinks its state is.",
])

h2("6. What happens internally, step by step")
dia("""
 1  tap                        browser fires a click event
 2  onClick                    React runs likeMutation.mutate()
 3  useMutation                sets isPending, calls mutationFn
 4  apiPost                    builds URL + Authorization header
 5  fetch                      the actual network request leaves the browser
 6  Vite proxy (dev)           /api/... forwarded to port 8001
 7  uvicorn                    accepts the connection, hands it to FastAPI
 8  FastAPI router             matches POST /api/posts/{post_id}/like
 9  Depends(...)               JWT decoded -> user loaded -> or 401 and STOP
10  handler                    post exists? -> or 404 and STOP
11  handler                    already liked? -> branch
12  MongoDB                    write post_likes  +  $inc likes_count
13  MongoDB                    write notification for the author
14  FastAPI                    serialises the return value to JSON, 200
15  fetch resolves             api.ts checks res.ok, parses JSON
16  onSuccess                  invalidateQueries(['posts'])
17  TanStack Query             refetches GET /api/posts (repeat 4-15 for a GET)
18  React                      re-renders PostCard with new data
19  user sees                  filled heart, count 8
""")
p("Nineteen steps for one tap. This is why architecture matters: each step is small, replaceable "
  "and testable on its own. And it is why <b>reading the Network tab</b> is the most valuable "
  "debugging habit you can build &mdash; it shows you steps 5 to 15 directly.")

h2("7. Common beginner mistakes")
bl([
    "<b>Thinking the frontend \"has\" the data.</b> It has a cached copy. The database is the truth.",
    "<b>Assuming fetch throws on errors.</b> It does not. A 500 resolves normally; you must check "
    "res.ok. This is why the whole app funnels through api.ts.",
    "<b>Confusing 401 and 403.</b> 401 = I do not know who you are. 403 = I know exactly who you "
    "are, and you may not do this. Different fixes entirely.",
    "<b>Believing hidden buttons are security.</b> Hiding the admin link is UX. Someone can still "
    "call your API directly with curl. Security lives on the server, always.",
    "<b>Updating the count in the browser instead of refetching.</b> Works until two devices, or "
    "one failed request, make your number a fiction.",
    "<b>Reading a count as truth without knowing it is denormalised.</b> likes_count is a cached "
    "number kept in step by $inc; post_likes is the real record.",
])

h2("8. Mini task (do this before Lesson 2)")
bl([
    "Open the app, log in as <font name='Courier'>karan@unisphere.edu / Student@123456</font>.",
    "Press F12, open the <b>Network</b> tab, filter to Fetch/XHR.",
    "Click the like button on a post. Find the request that appears.",
    "Write down, from what you see: the method, the full URL, the status code, the response body, "
    "and the value of the Authorization header.",
    "Now click like again (unlike) and compare the response body. Explain why it differs.",
    "Reload the page and count how many requests fire before the feed appears. Name what each one "
    "is fetching.",
])
p("If you can do this, you can debug. Most \"my app is broken\" questions are answered by the "
  "Network tab in thirty seconds.")

h2("9. Check your understanding")
p("Answer these in your own words. Do not look them up &mdash; I want your mental model, mistakes "
  "included, so I can correct the model rather than the sentence.")
bl([
    "1. In one sentence each: what is a client, what is a server, and which one can be trusted?",
    "2. What does it mean that HTTP is stateless, and what does this project do about it?",
    "3. Explain the difference between 401 and 403 using a Unisphere example.",
    "4. Why does the like handler use <font name='Courier'>$inc</font> instead of reading "
    "likes_count, adding one, and writing it back?",
    "5. After liking a post, why does the frontend refetch the posts instead of just adding one to "
    "the number on screen?",
])
p("Send me your answers and we will do <b>Lesson 2: HTML, CSS and how one file re-themes your "
  "entire app</b>. We do not move on until Lesson 1 is solid.")
A(PageBreak())

# ============================================================ APPENDIX A
h1("APPENDIX A &mdash; API reference")
p("Every endpoint lives under <font name='Courier'>/api</font>, registered on "
  "<font name='Courier'>api_router</font> in server.py. This is a representative map, not an "
  "exhaustive list of all 100+ routes &mdash; open any router file to see the rest.")
table([
    ["Method", "Endpoint", "Purpose", "Auth"],
    ["GET", "/api/", "health check + version", "no"],
    ["POST", "/api/auth/signup", "create an account, return user + token", "no"],
    ["POST", "/api/auth/login", "verify password, return user + token", "no"],
    ["POST", "/api/auth/logout", "clear the session cookie", "yes"],
    ["GET", "/api/auth/me", "who am I? used to restore a session on reload", "yes"],
    ["GET", "/api/users", "discovery with filters (college, degree, year, skills...)", "yes"],
    ["GET", "/api/users/{id}", "one public profile", "optional"],
    ["PUT", "/api/users/me", "edit my own profile", "yes"],
    ["GET", "/api/posts", "feed, filtered + paginated, blocked users removed", "optional"],
    ["POST", "/api/posts", "create a post", "yes"],
    ["DELETE", "/api/posts/{id}", "delete own post (or admin)", "yes"],
    ["POST", "/api/posts/{id}/like", "toggle like + notify author", "yes"],
    ["POST", "/api/posts/{id}/comments", "add a comment", "yes"],
    ["GET", "/api/posts/{id}/comments", "list comments", "optional"],
    ["POST", "/api/posts/{id}/bookmark", "toggle bookmark", "yes"],
    ["GET", "/api/stories", "active (non-expired) stories", "yes"],
    ["POST", "/api/stories", "publish a 24h story", "yes"],
    ["POST", "/api/connections/request", "send a connection request", "yes"],
    ["POST", "/api/connections/{id}/accept", "accept a request", "yes"],
    ["GET", "/api/messages/conversations", "inbox list with unread counts", "yes"],
    ["POST", "/api/messages/send", "send a message", "yes"],
    ["GET", "/api/projects", "browse projects", "yes"],
    ["POST", "/api/projects/{id}/request", "request to join", "yes"],
    ["GET", "/api/meetings", "my meetings by status", "yes"],
    ["POST", "/api/meetings/book", "book an available slot", "yes"],
    ["POST", "/api/meet/queue", "join the Meet Someone queue, get matched", "yes"],
    ["POST", "/api/meet/signal/send", "relay an SDP offer/answer or ICE candidate", "yes"],
    ["GET", "/api/meet/signal/poll", "collect signals waiting for me", "yes"],
    ["POST", "/api/calls/start", "create a call session (ringing)", "yes"],
    ["GET", "/api/notifications", "my notification feed", "yes"],
    ["POST", "/api/safety/report", "report a user/post/comment/message/story", "yes"],
    ["POST", "/api/safety/block", "block a user", "yes"],
    ["GET", "/api/search", "global search across four entity types", "yes"],
    ["GET", "/api/admin/metrics", "dashboard counters", "admin"],
    ["POST", "/api/admin/users/{id}/suspend", "suspend an account", "admin"],
], [17 * mm, 52 * mm, 0, 13 * mm])
h3("Reading the Auth column")
bl([
    "<b>no</b> &mdash; anyone may call it. Used only for landing, signup and login.",
    "<b>optional</b> &mdash; works signed out, but returns extra fields when signed in "
    "(is_liked_by_me, blocked-user filtering). Implemented with get_current_user_optional.",
    "<b>yes</b> &mdash; get_current_user_required; 401 without a valid token.",
    "<b>admin</b> &mdash; get_current_admin_user; 403 for a logged-in non-admin.",
])
code("""
# backend/lib/auth.py -- the three gates, real code
async def get_current_user_required(request: Request) -> Dict[str, Any]:
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=401,
            detail="Authentication required. Please log in to proceed.",
            headers={"WWW-Authenticate": "Bearer"})
    return user

async def get_current_admin_user(
        current_user: Dict[str, Any] = Depends(get_current_user_required)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return current_user
""")
A(PageBreak())

# ============================================================ APPENDIX B
h1("APPENDIX B &mdash; Nine real user actions, traced end to end")
p("Learn features as journeys, not as files. Each trace below is the real path through your code. "
  "Follow one with the files open beside you.")

h2("B1 &mdash; Registration")
dia("""
 Signup.tsx form (name, email, password, college, degree, branch,
   year, grad year, city, interests, skills)
   |  useState holds each field as you type (controlled inputs)
   v
 submit -> auth-context.signup(data)
   |
   v apiPost('/auth/signup', data)  [lib/api.ts]
   v
 POST /api/auth/signup  [auth_router.py]
   |  Pydantic UserSignup validates types + required fields -> 422 if bad
   |  email lowercased and trimmed
   |  db.users.find_one({email}) -> already exists? 400 with a clear message
   |  hash_password(password)   <-- bcrypt; the plain password is never stored
   |  build the user document: role='student', reputation 5.0,
   |    category_reputation (5 dimensions), privacy defaults, avatar fallback
   |  db.users.insert_one(user)
   |  db.availabilities.insert_one(default Mon-Fri weekly slots)
   |  create_access_token({sub: user_id, email, role})
   |  response.set_cookie('session_token', httponly=True, 30 days)
   v
 200 { user, token, message }
   |  auth-context stores token in localStorage, sets user state
   |  queryClient.invalidateQueries()  -> every cached screen refetches as "me"
   v
 navigate to /dashboard -> AppShell renders -> personalised greeting
""")
p("Two details worth copying into your own projects. First, "
  "<font name='Courier'>password_hash</font> is created before the insert, and the plain password "
  "is popped off the dictionary &mdash; there is no code path where it could be written to disk. "
  "Second, signup also creates a default availability record, so the Meetings page is never a "
  "broken empty screen for a new user. Good products seed their own defaults.")
note("Honest note: the token is stored in localStorage <i>and</i> an httponly cookie is set. "
     "localStorage is readable by any JavaScript on the page, so it is vulnerable to XSS; the "
     "httponly cookie is not. A hardened production version would use the cookie alone. The "
     "cookie is already there, which makes that a small change &mdash; but it is a real trade-off "
     "you should be able to explain in an interview.")

h2("B2 &mdash; Login and staying logged in")
dia("""
 Login.tsx -> auth-context.login(email, password)
   v POST /api/auth/login
   |  find user by email        -> not found? generic error (do NOT reveal
   |                               whether the email exists: that is a
   |                               user-enumeration leak)
   |  verify_password(plain, stored_hash)   <-- bcrypt re-hashes and compares
   |  suspended? refuse
   |  create_access_token(...)
   v 200 { user, token }
   |  localStorage.setItem('unisphere_auth_token', token)
   v
 LATER: the user reloads the page. React state is gone.
   AuthProvider's useEffect runs once on mount:
     token in localStorage?  no  -> isLoading=false, show public UI
                             yes -> GET /api/auth/me
                                      ok    -> setUser(me)
                                      fails -> remove token, setUser(null)
""")
code("""
// frontend/src/lib/auth-context.tsx -- session restore, real code
useEffect(() => {
  const bootstrap = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    try {
      const me = await apiGet<UserResponse>("/auth/me");
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);   // stale/expired token: clean up
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  void bootstrap();
}, []);
""")
p("<b>Why isLoading exists.</b> On the very first paint the app does not yet know whether you are "
  "logged in. Without this flag, protected screens would flash the login page and then redirect "
  "&mdash; the classic auth flicker. The empty dependency array "
  "<font name='Courier'>[]</font> means \"run once when mounted\", not on every render.")
p("<b>Why /auth/me exists at all.</b> The token contains a user id, but the user's name, avatar, "
  "college and reputation may have changed since it was issued. So the app asks the server for the "
  "current truth rather than trusting old data baked into the token.")

h2("B3 &mdash; Creating a post")
dia("""
 Feed.tsx composer: content, category, optional media_url
   v useMutation -> apiPost('/posts', { content, category, tags, media_url })
   v POST /api/posts   [posts_router.py]
   |  Depends(get_current_user_required)  -> 401 if not logged in
   |  Pydantic PostCreate validates the body
   |  build the document, stamping author details onto the post:
   |    author_id, author_name, author_avatar, author_college,
   |    author_degree_year, likes_count=0, comments_count=0, created_at
   |  db.posts.insert_one(post)
   v 200 PostResponse
   |  onSuccess -> invalidateQueries(['posts'])
   v feed refetches; the new post is at the top (sorted created_at desc)
""")
h3("Why the author's name is copied onto every post")
p("Strict relational thinking says store only <font name='Courier'>author_id</font> and look the "
  "user up when displaying. But a feed of 50 posts would then need 50 extra lookups (the classic "
  "\"N+1 query problem\"). Copying the display fields onto the post makes the feed a single query.")
p("The cost is real and you should know it: if Karan renames himself, old posts keep the old name "
  "until something updates them. This is denormalisation again &mdash; <b>read speed bought with "
  "duplication and staleness.</b> Production systems accept this deliberately and add a background "
  "job to refresh copies. Knowing you made the trade is what makes it engineering rather than an accident.")

h2("B4 &mdash; Liking a post")
p("Fully traced in Part 3 and Part 8. The one-line summary: a join document in "
  "<font name='Courier'>post_likes</font> plus an atomic <font name='Courier'>$inc</font> on the "
  "post, plus a notification for the author, then cache invalidation on the client.")

h2("B5 &mdash; Sending a connection request")
dia("""
 Discover.tsx / Profile.tsx  [Connect]
   v POST /api/connections/request { recipient_id }
   |  auth required
   |  refuse self-connection
   |  is there already a connection doc for this pair (either direction)?
   |    -> yes: return its state instead of creating a duplicate
   |  privacy: does the recipient allow connection requests?
   |  blocks: has either user blocked the other?
   |  insert { id, requester_id, recipient_id, status:'pending', created_at }
   |  insert a notification for the recipient
   v the button's label is DERIVED from that one document:
       no doc            -> "Connect"
       status=pending    -> "Pending"
       status=accepted   -> "Connected"
   v on accept: status='accepted', both users' connections_count $inc 1,
                notification back to the requester
""")
p("The important design idea: <b>the three button states are not three fields.</b> They are one "
  "document's status, read from either direction. Storing \"is_pending\" and \"is_connected\" "
  "separately guarantees they eventually contradict each other.")

h2("B6 &mdash; Sending a message")
dia("""
 Messages.tsx -> POST /api/messages/send { recipient_id, content }
   |  find a conversation whose participants contain both users,
   |    or create one
   |  insert the message { conversation_id, sender_id, content, created_at }
   |  update the conversation: last_message, last_message_at,
   |    and $inc the recipient's unread counter
   |  insert a notification
   v the thread refetches (and polls), the message appears
""")
p("<b>Why unread lives on the conversation, not computed from messages.</b> The inbox needs a "
  "badge for every conversation. Computing it honestly means scanning each thread's messages on "
  "every inbox load. One stored counter turns that into an instant read. Same trade-off as "
  "likes_count &mdash; you are starting to see that denormalisation is a pattern, not a hack.")
note("This is where polling shows its limit: the recipient learns about the message on their next "
     "poll, not the instant it is sent. That is the LEVEL 9 upgrade to WebSockets.")

h2("B7 &mdash; Creating a project and requesting to join")
dia("""
 CREATE   POST /api/projects { title, description, category, technologies,
                               required_roles, github_url, demo_url, status }
            -> owner_id = current user; insert

 JOIN     POST /api/projects/{id}/request { role, pitch }
            -> project exists? owner is not the applicant?
            -> already requested? (no duplicates)
            -> insert project_requests { project_id, applicant_id,
                                         role, pitch, status:'pending' }
            -> notify the owner

 REVIEW   POST /api/projects/{id}/requests/{req}/accept
            -> ONLY the owner may call this (ownership check)
            -> request.status='accepted'; applicant added to team_members
            -> notify the applicant
""")
p("Note why <font name='Courier'>project_requests</font> is its own collection: the owner needs a "
  "reviewable queue with history (who asked, for which role, with what pitch, and what was "
  "decided). Pushing applicants straight into a members array would throw all of that away and "
  "make \"accept\" and \"is a member\" the same unrecoverable action.")

h2("B8 &mdash; Availability and booking a meeting")
dia("""
 availabilities  = one document per user (unique index on user_id)
                   topics[], timezone, weekly_schedule[
                     { day, active, slots:[{start_time,end_time,is_booked}] }]

 meetings        = one document per actual booking
                   { host_id, guest_id, meeting_date, start, end,
                     title, description, status }

 BOOK   POST /api/meetings/book { host_id, date, start_time, title, ... }
          -> is that slot in the host's schedule and not booked?
          -> insert the meeting with status 'upcoming'
          -> mark the slot is_booked
          -> notify the host
 STATUS upcoming -> completed | cancelled, each with a notification
""")
p("Two collections instead of one is the whole trick. \"What do you offer?\" and \"what is "
  "actually booked?\" are different questions with different lifetimes. Merge them and you get "
  "contradictions like a slot that is both free and taken.")

h2("B9 &mdash; Meet Someone, and then a real video call")
p("This is the hardest flow in the project, so take it in three stages.")
h3("Stage 1 &mdash; matching (ordinary backend logic, nothing exotic)")
dia("""
 MeetSomeone.tsx: user picks intents (new friends / project partners /
   study partners / career / networking / hackathon teammates)
   plus optional filters (same field, different college, same year,
   similar interests, specific skills)
   v POST /api/meet/queue { intents, filters }
   |  write a meet_session with status 'waiting'
   |  look for another compatible waiting session
   |     none found      -> stay waiting; the UI shows "Finding a student..."
   |     found a peer    -> both sessions become status 'matched' and share
   |                        one session id
   v the UI reveals only first name, college, year, interests
     -- never email or contact details (privacy by default)
   v [Start Video] [Start Chat] [Next] [Report] [Block] always available
""")
h3("Stage 2 &mdash; what a video call needs, in plain language")
p("Two browsers must send video directly to each other. Before they can, they have to agree on "
  "codecs and find a network route between them &mdash; and neither browser knows the other "
  "exists. Your server's <i>only</i> job is to pass notes between them. That note-passing is "
  "called <b>signalling</b>.")
bl([
    "<b>SDP</b> (Session Description Protocol) &mdash; a text blob describing \"here is the video "
    "and audio I can send and receive\".",
    "<b>Offer</b> &mdash; the caller's SDP. <b>Answer</b> &mdash; the callee's SDP in reply.",
    "<b>ICE candidate</b> &mdash; one possible network address/route to reach me. Each side "
    "discovers several and sends them over.",
    "<b>STUN</b> &mdash; a tiny public service that tells your browser its own public address, "
    "because behind a home router it genuinely does not know it.",
    "<b>TURN</b> &mdash; a relay used when no direct route can be found (strict corporate or mobile "
    "networks). It costs money because it carries the media. <b>This project has STUN but not "
    "TURN</b>, which is why some networks will fail to connect: a documented production gap, not a bug.",
])
dia("""
  BROWSER A                 YOUR SERVER                 BROWSER B
      |  offer (SDP)  ---->  meet/call session  ---->  poll -> receives offer
      |                                                  creates answer
      |  poll <----------  session  <----------------  answer (SDP)
      |  ICE candidates  <---- both directions ---->  ICE candidates
      |
      |========== audio + video, DIRECT, peer to peer ==========|
                (this traffic never touches your server)
""")
h3("Stage 3 &mdash; the code that does it, lib/useWebRTC.ts")
code("""
// 1. ask the user for camera + microphone (a permission prompt appears)
if (!navigator.mediaDevices?.getUserMedia) {
  setMediaError("This browser does not support camera access.");
  return;
}
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

// 2. create the peer connection, told where to find STUN
const pc = new RTCPeerConnection(ICE_SERVERS);

// 3. put my camera/mic tracks into the connection
stream.getTracks().forEach((t) => pc.addTrack(t, stream));

// 4. whenever the browser discovers a route to me, send it to the peer
pc.onicecandidate = (e) => {
  if (e.candidate) void apiPost(`/${channel}/signal/send`, { ... });
};

// 5. when the peer's media arrives, show it
pc.ontrack = (e) => setRemoteStream(e.streams[0]);

// 6. caller side: describe myself and send the offer
const offer = await pc.createOffer({ offerToReceiveAudio: true,
                                     offerToReceiveVideo: true });
await pc.setLocalDescription(offer);
await apiPost(`/${channel}/signal/send`, { signal_type: "offer", payload: offer });

// 7. keep checking for notes from the peer
const poll = async () => {
  const res = await apiGet<{ signals: Array<{...}> }>(`/${channel}/signal/poll?...`);
  for (const sig of res.signals) {
    if (sig.signal_type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(...));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await apiPost(`/${channel}/signal/send`, { signal_type: "answer", payload: answer });
    } else if (sig.signal_type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(...));
    } else if (sig.signal_type === "ice") {
      await pc.addIceCandidate(new RTCIceCandidate(sig.payload.candidate));
    }
  }
};
pollRef.current = window.setInterval(() => void poll(), 2500);
""", "Abridged from the real file; the same nine ideas, in order")
h3("The controls are real, not cosmetic")
code("""
// mute / camera off: flip the actual track, do not fake the icon
track.enabled = !track.enabled;

// screen share: swap the outgoing video track on the sender
const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
const sender = pc.getSenders().find((s) => s.track?.kind === "video");
if (sender) await sender.replaceTrack(screen.getVideoTracks()[0]);
""")
note("The most important five lines in the whole file are the cleanup: stop every track, close the "
     "peer connection, clear the poll interval. Skip them and the user's camera light stays on "
     "after they leave the page &mdash; which users, correctly, treat as spyware. A leaked "
     "setInterval also keeps signalling for a call that no longer exists.")
h3("The demo fallback, declared openly")
p("If no second human is online, the Meet flow can pair you with an interactive simulation partner "
  "so the journey is testable alone. It is labelled as a simulation. This matters ethically and "
  "professionally: a stub that pretends to be a real peer is worse than no feature, because it "
  "destroys trust in everything else you built.")
A(PageBreak())

# ============================================================ APPENDIX C
h1("APPENDIX C &mdash; Commands, logins and how to debug")
h2("Working logins")
table([
    ["Account", "Email", "Password", "Use for"],
    ["Karan Kumar", "karan@unisphere.edu", "Student@123456", "the main student journey"],
    ["Maya Lin", "maya@stanford.edu", "Student@123456", "the second side of chat / calls"],
    ["Aarav Sharma", "aarav@mit.edu", "Student@123456", "projects and connections"],
    ["Elena Rostova", "elena@oxford.edu", "Student@123456", "cross-college discovery"],
    ["David Chen", "david@berkeley.edu", "Student@123456", "meetings and reputation"],
    ["Admin", "admin@unisphere.edu", "Admin@123456", "the /admin dashboard"],
], [32 * mm, 46 * mm, 34 * mm, 0])
p("Test chat, connections and video calls by opening two browser windows (one normal, one "
  "incognito) and logging in as two different students. This is how every developer tests a "
  "two-person feature.")
h2("Commands you will actually use")
code("""
# service state and logs (the first thing to check when something breaks)
sudo supervisorctl status backend frontend
tail -n 50 /var/log/supervisor/backend.err.log
tail -n 50 /var/log/supervisor/frontend.err.log

# restart -- ONLY needed after editing .env or installing a dependency
sudo supervisorctl restart backend frontend

# is a TypeScript / backend contract broken? the one true gate
cd /app/frontend && yarn typecheck

# call the API directly, no browser involved
curl -s http://localhost:8001/api/ | head
curl -s -X POST http://localhost:8001/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"karan@unisphere.edu","password":"Student@123456"}'

# prove that protection works: no token must mean 401
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8001/api/auth/me

# repopulate the demo data
cd /app/backend && python seed.py
""")
p("You do <b>not</b> need to restart anything for ordinary code edits: the backend reloads on save "
  "(uvicorn --reload) and the frontend hot-reloads (Vite).")
h2("How to debug like a developer, in five steps")
bl([
    "<b>1. Read the actual error.</b> Not the vibe of it &mdash; the words. \"undefined is not a "
    "function\", \"401 Unauthorized\", \"KeyError: 'author_id'\" each point somewhere specific.",
    "<b>2. Decide which side is broken.</b> Open the Network tab. If the request never leaves, it "
    "is a frontend problem. If it leaves and returns 4xx/5xx, it is a backend problem. This one "
    "question cuts your search space in half in ten seconds.",
    "<b>3. Reproduce it deliberately.</b> Find the shortest exact sequence that triggers it. A bug "
    "you cannot reproduce on demand cannot be verified as fixed.",
    "<b>4. Bisect.</b> Log or print at the halfway point of the flow. Was the data already wrong "
    "there? Move earlier. Still correct? Move later. Roughly ten steps finds a bug in a thousand-line "
    "path.",
    "<b>5. Fix, then re-run the exact original reproduction.</b> \"Should be fixed\" is not a status. "
    "If the bug touched both sides, verify both: curl for the API, and a real click for the UI.",
])
h3("Error messages you will meet in this project, decoded")
table([
    ["What you see", "What it usually means", "Where to look"],
    ["401 Unauthorized", "no token, expired token, or suspended account", "localStorage token; lib/auth.py"],
    ["403 Forbidden", "logged in, but not the owner / not admin", "the ownership check in the router"],
    ["404 Not Found", "wrong URL, or the id does not exist", "the route path; the id you passed"],
    ["422 Unprocessable", "your JSON body failed Pydantic validation", "the model in schemas.py vs what you sent"],
    ["500 Internal Error", "the backend raised an exception", "backend.err.log -- read the traceback"],
    ["undefined on screen", "TS interface and Pydantic model disagree", "types.ts vs schemas.py; run yarn typecheck"],
    ["query returns []", "the filter is wrong, not necessarily the data", "print the query; test it directly"],
    ["CORS error", "origin not allowed by the backend", "CORS_ORIGINS in backend/.env"],
], [38 * mm, 62 * mm, 0])
h2("Four real bugs from this build, and what each one teaches")
bl([
    "<b>MongoDB $in with $regex returned nothing.</b> The query looked perfectly correct and "
    "silently matched zero documents; the fix was an $or of individual $regex clauses. "
    "<i>Lesson: an empty result is not proof the data is missing. Suspect the query.</i>",
    "<b>A missing <font name='Courier'>uuid</font> import in admin_router.py.</b> Fine until the "
    "first admin write, then a 500. <i>Lesson: an error inside a rarely-taken branch only appears "
    "when that branch runs. Exercise every endpoint at least once.</i>",
    "<b>Icon names that did not exist in lucide-react.</b> Invisible in the browser, caught by "
    "yarn typecheck. <i>Lesson: the typechecker is a second pair of eyes, not bureaucracy.</i>",
    "<b>Toasts overlapped the notification bell and swallowed clicks.</b> Fixed by anchoring them "
    "bottom-right. <i>Lesson: layout collisions are invisible in code review and obvious in a "
    "screenshot. Look at your app, not only at your code.</i>",
])
h2("Git and professional workflow, briefly")
bl([
    "<b>Repository</b> &mdash; the project plus its full history.",
    "<b>Commit</b> &mdash; a saved snapshot with a message. Commit small and often; \"fixed stuff\" "
    "is a message your future self will curse.",
    "<b>Branch</b> &mdash; a parallel line of work, so an experiment cannot break the working app.",
    "<b>Merge / pull request</b> &mdash; bringing a branch back, with a chance for review first.",
    "<b>.gitignore</b> &mdash; the list of things never to commit. <font name='Courier'>.env</font> "
    "and <font name='Courier'>node_modules</font> belong here. A secret committed once lives in the "
    "history forever, even if you delete the file.",
    "<b>Dev vs production</b> &mdash; same code, different configuration, supplied by environment "
    "variables. That is why nothing in this project hardcodes a URL, a port or a key.",
])
h2("What production would still need")
bl([
    "<b>A TURN server</b> so calls connect on restrictive networks (STUN alone is not enough).",
    "<b>Real email</b> (Resend/SendGrid) for verification and password reset &mdash; the flows exist, "
    "the delivery does not.",
    "<b>Object storage</b> (S3 or similar) for uploads, with type and size validation, instead of URLs.",
    "<b>Rate limiting</b> on login, signup, reporting and posting, to blunt abuse and brute force.",
    "<b>WebSockets</b> replacing polling for chat and signalling.",
    "<b>Secure cookie-only sessions</b> instead of a token in localStorage.",
])
A(Spacer(1, 8))
p("<b>Your next step is Lesson 1's mini task and its five questions in Part 8.</b> Send me your "
  "answers &mdash; including the ones you are unsure about &mdash; and we will begin Lesson 2. "
  "I would rather correct your mental model early than teach you something on top of a crack.")


# ============================================================ RENDER
def decorate(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VIOLET)
    canvas.rect(0, A4[1] - 10 * mm, A4[0], 10 * mm, stroke=0, fill=1)
    canvas.setFillColor(AMBER)
    canvas.rect(0, A4[1] - 11.6 * mm, A4[0], 1.6 * mm, stroke=0, fill=1)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.white)
    canvas.drawString(18 * mm, A4[1] - 7 * mm, "UNISPHERE  /  FULL-STACK TEACHING HANDBOOK")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, "page %d" % doc.page)
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 16 * mm, A4[0] - 18 * mm, 16 * mm)
    canvas.restoreState()


out = "/app/frontend/public/Unisphere-FullStack-Teaching-Handbook.pdf"
doc = BaseDocTemplate(out, pagesize=A4,
                      leftMargin=18 * mm, rightMargin=18 * mm,
                      topMargin=16 * mm, bottomMargin=20 * mm,
                      title="Unisphere - Full-Stack Teaching Handbook",
                      author="E1")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=decorate)])
doc.build(story)
print("saved", out)
