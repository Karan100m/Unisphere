"""Generates the Unisphere build-walkthrough PPTX deck."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

BG = RGBColor(0x0B, 0x07, 0x13)
CARD = RGBColor(0x16, 0x10, 0x1F)
VIOLET = RGBColor(0x8B, 0x5C, 0xF6)
AMBER = RGBColor(0xFB, 0xBF, 0x24)
PINK = RGBColor(0xF4, 0x72, 0xB6)
WHITE = RGBColor(0xF5, 0xF3, 0xFF)
MUTED = RGBColor(0xA8, 0x9E, 0xB8)
CODEC = RGBColor(0x9D, 0xE5, 0xB0)

HEAD_FONT = "Outfit"
BODY_FONT = "Plus Jakarta Sans"
MONO_FONT = "JetBrains Mono"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
W = prs.slide_width
H = prs.slide_height
BLANK = prs.slide_layouts[6]

_num = {"i": 0}


def new_slide():
    s = prs.slides.add_slide(BLANK)
    bg = s.shapes.add_shape(1, 0, 0, W, H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG
    bg.line.fill.background()
    bg.shadow.inherit = False
    return s


def rect(s, x, y, w, h, color, line=None, lw=1.0):
    sh = s.shapes.add_shape(5, x, y, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.shadow.inherit = False
    if line:
        sh.line.color.rgb = line
        sh.line.width = Pt(lw)
    else:
        sh.line.fill.background()
    sh.adjustments[0] = 0.06
    return sh


def text(s, x, y, w, h, runs, size=18, color=WHITE, font=BODY_FONT, bold=False,
         align=PP_ALIGN.LEFT, spacing=1.25, anchor=MSO_ANCHOR.TOP):
    tb = s.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    if isinstance(runs, str):
        runs = [runs]
    for i, line in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        if isinstance(line, tuple):
            body, opts = line
        else:
            body, opts = line, {}
        r = p.add_run()
        r.text = body
        f = r.font
        f.size = Pt(opts.get("size", size))
        f.color.rgb = opts.get("color", color)
        f.name = opts.get("font", font)
        f.bold = opts.get("bold", bold)
        p.space_after = Pt(opts.get("after", 6))
    return tb


def chapter(title, subtitle, n):
    s = new_slide()
    rect(s, Inches(0), Inches(3.05), Inches(0.22), Inches(1.6), AMBER)
    text(s, Inches(0.7), Inches(2.7), Inches(11), Inches(0.6),
         [("PHASE %s" % n, {"color": AMBER, "size": 16, "bold": True, "font": MONO_FONT})])
    text(s, Inches(0.7), Inches(3.15), Inches(11.5), Inches(1.2),
         [(title, {"size": 46, "bold": True, "font": HEAD_FONT, "color": WHITE})])
    text(s, Inches(0.7), Inches(4.45), Inches(10.5), Inches(1.0),
         [(subtitle, {"size": 19, "color": MUTED})])
    return s


def content(title, kicker, blocks, code=None, footnote=None):
    """blocks: list of (heading, [bullets])"""
    _num["i"] += 1
    s = new_slide()
    text(s, Inches(0.7), Inches(0.42), Inches(11.5), Inches(0.4),
         [(kicker.upper(), {"color": AMBER, "size": 12, "bold": True, "font": MONO_FONT})])
    text(s, Inches(0.7), Inches(0.75), Inches(11.9), Inches(0.8),
         [(title, {"size": 31, "bold": True, "font": HEAD_FONT})])
    rect(s, Inches(0.7), Inches(1.52), Inches(1.5), Inches(0.045), VIOLET)

    top = Inches(1.76)
    body_w = Inches(11.9) if not code else Inches(6.2)
    y = top
    for heading, bullets in blocks:
        if heading:
            text(s, Inches(0.7), y, body_w, Inches(0.4),
                 [(heading, {"size": 17, "bold": True, "color": PINK, "font": HEAD_FONT})])
            y += Inches(0.37)
        runs = [("•  " + b, {"size": 14.5, "color": WHITE if i % 1 == 0 else MUTED})
                for i, b in enumerate(bullets)]
        tb = text(s, Inches(0.85), y, body_w - Inches(0.15), Inches(0.3 * len(bullets)), runs,
                  spacing=1.15)
        y += Emu(int(Inches(0.34).emu * len(bullets))) + Inches(0.15)

    if code:
        cx = Inches(7.15)
        ch = Inches(0.36) * len(code) + Inches(0.5)
        rect(s, cx, top, Inches(5.5), ch, CARD, VIOLET, 1.0)
        text(s, cx + Inches(0.28), top + Inches(0.22), Inches(5.0), ch,
             [(c, {"size": 11.5, "font": MONO_FONT, "color": CODEC if not c.startswith("#") else MUTED})
              for c in code], spacing=1.1)

    if footnote:
        text(s, Inches(0.7), Inches(6.6), Inches(11.9), Inches(0.5),
             [(footnote, {"size": 13, "color": AMBER})])

    text(s, Inches(12.3), Inches(6.95), Inches(0.8), Inches(0.3),
         [(str(len(prs.slides._sldIdLst)), {"size": 11, "color": MUTED, "font": MONO_FONT})],
         align=PP_ALIGN.RIGHT)
    return s


# ---------------------------------------------------------------- 1. COVER
s = new_slide()
rect(s, Inches(0), Inches(0), Inches(0.3), H, VIOLET)
rect(s, Inches(0.3), Inches(0), Inches(0.12), H, AMBER)
text(s, Inches(1.1), Inches(1.5), Inches(11), Inches(0.5),
     [("BUILD WALKTHROUGH  /  ENGINEERING CASE STUDY", {"color": AMBER, "size": 15, "bold": True, "font": MONO_FONT})])
text(s, Inches(1.1), Inches(2.05), Inches(11.5), Inches(1.6),
     [("Building Unisphere", {"size": 60, "bold": True, "font": HEAD_FONT})])
text(s, Inches(1.1), Inches(3.25), Inches(11.5), Inches(1.2),
     [("A student social + professional + video networking platform,", {"size": 22, "color": MUTED}),
      ("built end-to-end. Every step, in order, with the reasoning.", {"size": 22, "color": MUTED})])
rect(s, Inches(1.1), Inches(4.75), Inches(3.4), Inches(0.05), PINK)
text(s, Inches(1.1), Inches(5.0), Inches(11.5), Inches(1.5),
     [("FastAPI  ·  MongoDB (Motor)  ·  React 19 + TypeScript  ·  Tailwind v4  ·  shadcn/ui  ·  TanStack Query  ·  WebRTC",
       {"size": 14, "font": MONO_FONT, "color": WHITE}),
      ("17 API routers  ·  18 pages  ·  22 collections  ·  ~10,400 lines", {"size": 14, "font": MONO_FONT, "color": AMBER})])

# ---------------------------------------------------------------- 2. HOW TO READ
content(
    "How to read this deck",
    "orientation",
    [("Structure", [
        "10 phases, in the exact order the work happened — requirements first, code last.",
        "Each phase: what I decided, why I decided it, and the code that resulted.",
        "Right-hand panels show real snippets from this repository, not pseudocode.",
    ]),
     ("The one habit that matters most", [
         "Contracts before code. Decide the data shape, then the endpoint, then the UI.",
         "Every step below is downstream of a contract decision made earlier.",
     ]),
     ("Legend", [
         "Pink heading = a decision point.  Green mono panel = real code.",
         "Amber footer line = the trap that would have cost hours if missed.",
     ])],
)

# ---------------------------------------------------------------- PHASE 0
chapter("Requirements & scope control", "Turning a 28-section brief into a buildable plan.", "00")

content(
    "Step 1 — Read the brief as a dependency graph, not a checklist",
    "phase 00 · requirements",
    [("What the brief asked for", [
        "18 feature areas: auth, profiles, feed, stories, discovery, random matching,",
        "video calls, chat, projects, meetings, communities, notifications,",
        "connections, reputation, safety, admin, search, responsive shell.",
    ]),
     ("How I re-ordered it", [
         "Nothing works without identity → Auth first.",
         "Nothing displays without data → schema + seed second.",
         "Feed / discovery / chat depend on profiles → third.",
         "Video, reputation, admin sit on top of everything → last.",
     ]),
     ("Scope rule I held to", [
         "One complete vertical slice per feature (API + types + page + empty state)",
         "beats three half-built features. Depth came after breadth was walkable.",
     ])],
    footnote="Lesson: a feature list is unordered. Your build order is the real design decision.",
)

content(
    "Step 2 — Clarify before writing a single line",
    "phase 00 · requirements",
    [("Questions I asked the user up front", [
        "Brand direction & theme → answer: 'Unisphere — Vibrant Violet & Sunset Amber'.",
        "WebRTC: real peer-to-peer, or simulated? → real, with a demo fallback.",
        "Seed data: empty app or rich demo? → rich, so every page shows real content.",
        "AI features: in or out of MVP? → in, via the managed Emergent LLM key.",
    ]),
     ("Why this pays", [
         "A theme answered on turn 1 costs nothing. Answered on turn 40 it is a rebrand",
         "across ~60 files (which is exactly what happened later — see Phase 09).",
         "Ambiguity is the most expensive thing in a codebase.",
     ])],
    code=[
        "# The four answers became hard constraints:",
        "THEME   = 'violet #8B5CF6 + amber #FBBF24'",
        "WEBRTC  = 'real RTCPeerConnection'",
        "SEED    = 'rich: 6 users, 22 collections'",
        "AI      = 'universal key'",
    ],
)

# ---------------------------------------------------------------- PHASE 1
chapter("Architecture", "Choosing the boundaries before choosing the libraries.", "01")

content(
    "Step 3 — Fix the three hard boundaries",
    "phase 01 · architecture",
    [("Boundary 1 — every route lives under /api", [
        "Frontend and backend share one origin in production; /api is the only seam.",
        "In dev, Vite proxies /api → :8001, so the frontend code never changes.",
    ]),
     ("Boundary 2 — one typed fetch layer, no scattered fetch() calls", [
         "All network access goes through src/lib/api.ts. Auth header, error shape,",
         "and 204 handling are solved once instead of 200 times.",
     ]),
     ("Boundary 3 — Pydantic model ↔ TypeScript interface, hand-synced", [
         "No codegen. So the rule: when a Pydantic model changes, its TS interface",
         "changes in the same edit. Never 'later'.",
     ])],
    code=[
        "app = FastAPI(title='Unisphere API')",
        "api_router = APIRouter(prefix='/api')",
        "",
        "api_router.include_router(auth_router)",
        "api_router.include_router(users_router)",
        "...  # 17 routers total",
        "",
        "# LAST statement in server.py — anything",
        "# registered after this is never served.",
        "app.include_router(api_router)",
    ],
    footnote="Trap: app.include_router(api_router) must be the final line. Register a route after it and it silently 404s.",
)

content(
    "Step 4 — Lay out the folders so features don't collide",
    "phase 01 · architecture",
    [("Backend — one router file per domain", [
        "backend/lib/     → db.py (Motor client + indexes), auth.py (JWT), dates.py",
        "backend/models/  → schemas.py, all Pydantic v2 request/response models",
        "backend/routers/  → 17 files: auth, users, connections, posts, stories, meet,",
        "calls, messages, projects, meetings, colleges, reputation, notifications,",
        "safety, admin, search, ai — each exposing one APIRouter",
        "backend/seed.py  → idempotent demo-data loader",
    ]),
     ("Frontend — pages thin, lib shared", [
         "src/pages/     → 18 route-level screens",
         "src/components/ → AppShell, PostCard, StoryRibbon, Avatar, States, ui/*",
         "src/lib/       → api.ts, types.ts, auth-context.tsx, useWebRTC.ts, helpers.ts",
     ]),
     ("Why one file per domain", [
         "A 3,000-line server.py is unmergeable and unreadable. 17 files of ~250 lines",
         "means a bug in search never risks breaking messaging.",
     ])],
)

# ---------------------------------------------------------------- PHASE 2
chapter("Data model", "22 collections, designed relationally — then stored in Mongo.", "02")

content(
    "Step 5 — Model entities separately, never one fat user document",
    "phase 02 · data",
    [("Core collections", [
        "users · connections · posts · post_likes · post_comments · post_bookmarks",
        "stories · conversations · messages · projects · project_requests",
        "availabilities · meetings · colleges · college_follows",
        "reputation_reviews · notifications · reports · blocks",
        "meet_sessions · call_sessions",
    ]),
     ("Two rules I applied to every collection", [
         "Join tables stay separate: post_likes is its own collection, not an array",
         "inside the post. An array of 10k likes makes the post document unreadable.",
         "String UUID primary keys, never Mongo's ObjectId — ObjectId is not JSON",
         "serialisable and leaks into every response as a bug.",
     ]),
     ("Indexes at startup, not by hand", [
         "lib/db.py declares indexes and a lifespan task applies them on boot,",
         "so a fresh database is always correctly indexed.",
     ])],
    code=[
        "@asynccontextmanager",
        "async def lifespan(app: FastAPI):",
        "    app.state.index_task = asyncio.create_task(",
        "        ensure_indexes())",
        "    yield",
        "    client.close()",
        "",
        "# ensure_indexes():",
        "for collection, model in INDEX_PLAN:",
        "    await db[collection].create_indexes([model])",
    ],
    footnote="Trap: indexes created inline in a request handler run on every call. Create them once, at startup.",
)

content(
    "Step 6 — Write the seed script early, not at the end",
    "phase 02 · data",
    [("What seed.py creates", [
        "6 personas across 5 real colleges (LPU, Stanford, MIT, Oxford, UC Berkeley),",
        "each with posts, stories, projects, availability, connections and reputation.",
    ]),
     ("Why this is step 6 and not step 40", [
         "Every page I built afterwards had real content to render immediately.",
         "Empty-state-only development hides layout bugs until the very end.",
         "Reviewers and the testing agent can log in and see a live product.",
     ]),
     ("Idempotency", [
         "The script clears and re-inserts its own fixtures, so re-running it is safe",
         "and never produces duplicate users.",
     ])],
    code=[
        "# Working demo logins",
        "karan@unisphere.edu  / Student@123456",
        "maya@stanford.edu    / Student@123456",
        "aarav@mit.edu        / Student@123456",
        "elena@oxford.edu     / Student@123456",
        "david@berkeley.edu   / Student@123456",
        "admin@unisphere.edu  / Admin@123456",
    ],
)

# ---------------------------------------------------------------- PHASE 3
chapter("Authentication & security", "Identity, hashing, JWT, and ownership checks.", "03")

content(
    "Step 7 — Password hashing and JWT issuance",
    "phase 03 · auth",
    [("Decisions", [
        "bcrypt via passlib — never a raw hash, never a reversible cipher.",
        "Stateless JWT (HS256), 30-day expiry, secret read from the environment.",
        "verify_password wrapped in try/except so a malformed hash returns False",
        "instead of throwing a 500 and leaking a stack trace.",
    ]),
     ("Token transport — accept both", [
         "Authorization: Bearer <token> for the SPA,",
         "session_token cookie as a fallback. One helper reads either.",
     ])],
    code=[
        "pwd_context = CryptContext(",
        "    schemes=['bcrypt'], deprecated='auto')",
        "",
        "def create_access_token(data, expires_delta=None):",
        "    to_encode = data.copy()",
        "    expire = datetime.now(timezone.utc) + (",
        "        expires_delta or timedelta(days=30))",
        "    to_encode.update({'exp': expire})",
        "    return jwt.encode(to_encode, JWT_SECRET,",
        "                      algorithm='HS256')",
    ],
    footnote="Secrets come from os.environ / backend/.env. Nothing sensitive is ever hardcoded or shipped to the browser.",
)

content(
    "Step 8 — Two dependencies: required user vs optional user",
    "phase 03 · auth",
    [("get_current_user — required", [
        "Raises 401 when the token is missing, expired or the user no longer exists.",
        "Used by every mutating endpoint.",
    ]),
     ("get_current_user_optional — permissive", [
         "Returns None instead of raising, for endpoints that render differently",
         "when signed out (public profile view, landing-page data).",
     ]),
     ("Authorization, separate from authentication", [
         "Knowing who you are is not permission. Every write re-checks ownership:",
         "delete post → post.user_id == me. Edit project → project.owner_id == me.",
         "Admin routes additionally require is_admin, checked server-side only.",
     ]),
     ("Client-side never decides", [
         "The UI hides the admin link, but the API is what enforces it. Hiding a",
         "button is cosmetics; the check must live on the server.",
     ])],
    code=[
        "@router.delete('/{post_id}')",
        "async def delete_post(post_id: str,",
        "        me = Depends(get_current_user)):",
        "    post = await db.posts.find_one(",
        "        {'id': post_id})",
        "    if not post:",
        "        raise HTTPException(404, 'not found')",
        "    if post['user_id'] != me['id']:",
        "        raise HTTPException(403, 'forbidden')",
        "    await db.posts.delete_one({'id': post_id})",
    ],
)

content(
    "Step 9 — Session persistence on the frontend",
    "phase 03 · auth",
    [("Pieces", [
        "session.ts   → reads/writes the token in localStorage under one key.",
        "auth-context.tsx → React context exposing { user, login, logout, loading }.",
        "api.ts       → attaches the token to every request automatically.",
    ]),
     ("The loading state matters", [
         "On first paint the app does not yet know if you're signed in. Without a",
         "loading flag, protected routes flash the login screen then redirect —",
         "the classic auth flicker. The context gates rendering until resolved.",
     ])],
    code=[
        "const token = localStorage.getItem(",
        "  'unisphere_auth_token');",
        "const headers: Record<string,string> = {};",
        "if (token)",
        "  headers['Authorization'] = `Bearer ${token}`;",
        "",
        "const res = await fetch(`${BASE}${path}`, {",
        "  method, headers, credentials: 'include',",
        "  body: body == null ? undefined",
        "                     : JSON.stringify(body),",
        "});",
    ],
)

# ---------------------------------------------------------------- PHASE 4
chapter("The typed API seam", "One fetch layer, one error type, two files kept in sync.", "04")

content(
    "Step 10 — Build the fetch layer once",
    "phase 04 · api seam",
    [("What request<T>() centralises", [
        "Base path (/api), auth header, JSON content-type only when there's a body,",
        "cookie credentials, non-2xx → typed ApiError, 204 → undefined.",
    ]),
     ("Why a custom ApiError class", [
         "fetch does not throw on 404 or 500 — it resolves. Every call site would",
         "otherwise need its own res.ok check, and one missed check is a silent bug.",
         "ApiError carries .status and .body, so the UI can branch on 403 vs 422.",
     ]),
     ("The five exports the whole app uses", [
         "apiGet · apiPost · apiPut · apiPatch · apiDelete — nothing else.",
     ])],
    code=[
        "if (!res.ok) {",
        "  const errBody = await res.json()",
        "    .catch(() => null);",
        "  throw new ApiError(res.status, errBody);",
        "}",
        "if (res.status === 204) return undefined as T;",
        "return (await res.json()) as T;",
        "",
        "export const apiGet = <T>(p: string) =>",
        "  request<T>('GET', p);",
    ],
    footnote="Trap: FastAPI reports validation failures as 422 with {detail:[...]} — a different shape from your own errors. Handle it here, once.",
)

content(
    "Step 11 — Keep schemas.py and types.ts in lockstep",
    "phase 04 · api seam",
    [("The problem", [
        "There is no type inference across HTTP. Python says one thing, TypeScript",
        "believes another, and the compiler is happy while the app breaks at runtime.",
    ]),
     ("The discipline", [
         "Add a Pydantic model and its TS interface in the same edit — same field",
         "names, same optionality. types.ts is 435 lines and mirrors schemas.py 1:1.",
     ]),
     ("The safety net", [
         "yarn typecheck. Vite only transpiles — it never typechecks — so drift is",
         "invisible in the browser until a field renders as undefined.",
     ])],
    code=[
        "# backend/models/schemas.py",
        "class PostOut(BaseModel):",
        "    id: str",
        "    content: str",
        "    likes_count: int",
        "    liked_by_me: bool",
        "",
        "// frontend/src/lib/types.ts",
        "export interface Post {",
        "  id: string; content: string;",
        "  likes_count: number; liked_by_me: boolean;",
        "}",
    ],
)

# ---------------------------------------------------------------- PHASE 5
chapter("Design system", "Making it look like a product, not a template.", "05")

content(
    "Step 12 — Commit to a palette with an opinion",
    "phase 05 · design",
    [("Unisphere — Vibrant Violet & Sunset Amber", [
        "Primary violet #8B5CF6 · accent amber #FBBF24 · pink midtone #F472B6.",
        "Surfaces are deep aubergine (#0B0713 bg, #16101F cards), not neutral slate.",
    ]),
     ("The non-obvious reason for aubergine", [
         "On grey-blue slate, amber reads as a warning colour — it looks like an error",
         "state. On a warm dark purple it reads as sunset. Surface hue changes the",
         "meaning of your accent; pick them together, never separately.",
     ]),
     ("What was deliberately avoided", [
         "Purple-on-white gradients, Inter/Roboto, perfectly centred equal-spacing",
         "layouts, uniform card grids — the visual signature of generated apps.",
     ])],
    code=[
        "/* index.css design tokens */",
        "--background: #0B0713;",
        "--card:       #16101F;",
        "--primary:    #8B5CF6;",
        "--accent:     #FBBF24;",
        "--mid:        #F472B6;",
    ],
)

content(
    "Step 13 — Typography and signature effects",
    "phase 05 · design",
    [("Three fonts, three jobs", [
        "Outfit Variable → headings, display, wordmark (creator-platform feel).",
        "Plus Jakarta Sans Variable → body and UI copy.",
        "JetBrains Mono Variable → timers, meeting slot times, tech tags.",
    ]),
     ("Loading them properly", [
         "Installed as @fontsource packages and imported in index.css. Tailwind v4",
         "raises no error for a missing font — it silently falls back, quietly",
         "discarding your entire typographic identity. Always verify visually.",
     ]),
     ("Five reusable effect classes", [
         ".sunset-text — violet→pink→amber gradient text for headlines",
         ".electric-glow — violet core + amber rim shadow on primary actions",
         ".avatar-story-aura — conic gradient ring on unseen stories",
         ".aurora-blob — slow drifting background orbs for depth",
         ".pulse-ring — used for 'matching…' and incoming-call ringing",
     ])],
    footnote="Trap: custom keyframes must be authored explicitly in Tailwind v4 too — unregistered animations fail silently, exactly like fonts.",
)

content(
    "Step 14 — One AppShell, two navigation models",
    "phase 05 · design",
    [("Desktop (≥ lg)", [
        "Left sidebar navigation + centre content column + contextual right panel.",
    ]),
     ("Mobile", [
         "Fixed bottom bar: Home | Discover | Create | Messages | Profile.",
         "Not a shrunken sidebar — a different, thumb-reachable information layout.",
     ]),
     ("Why the shell is a single component", [
         "18 pages share it. Routing, nav highlight, notification bell, user menu and",
         "responsive breakpoints are solved once; each page renders only its content.",
     ]),
     ("A real bug this surfaced", [
         "Toasts defaulted to top-right and overlapped the notification bell,",
         "swallowing clicks. Fix: anchor sonner bottom-right. Overlay collisions are",
         "invisible in code review and obvious in a screenshot — so take screenshots.",
     ])],
)

# ---------------------------------------------------------------- PHASE 6
chapter("Core features", "Vertical slices: API → types → query → UI.", "06")

content(
    "Step 15 — The repeatable four-move pattern for every feature",
    "phase 06 · features",
    [("Move 1 — endpoint", [
        "Add the route to its domain router, typed with Pydantic in and out.",
    ]),
     ("Move 2 — interface", [
         "Mirror the response model in types.ts, in the same edit.",
     ]),
     ("Move 3 — data hook", [
         "useQuery to read, useMutation to write, then invalidate the affected key.",
         "Never fetch in useEffect — you lose caching, dedupe and refetch for free.",
     ]),
     ("Move 4 — states", [
         "Loading skeleton, error surface, and a purposeful empty state with a next",
         "action ('Discover students who share your interests'), not a blank box.",
     ])],
    code=[
        "const { data: posts, isLoading } = useQuery({",
        "  queryKey: ['posts', category],",
        "  queryFn: () => apiGet<Post[]>(",
        "    `/posts?category=${category}`),",
        "});",
        "",
        "const like = useMutation({",
        "  mutationFn: (id: string) =>",
        "    apiPost(`/posts/${id}/like`),",
        "  onSuccess: () => qc.invalidateQueries(",
        "    { queryKey: ['posts'] }),",
        "});",
    ],
    footnote="Invalidate, don't hand-patch. The server stays the single source of truth for likes_count.",
)

content(
    "Step 16 — Feed, stories, connections",
    "phase 06 · features",
    [("Feed", [
        "Create posts (text, image, project update, achievement, question, event).",
        "Like / comment / share / bookmark / report; delete only your own posts.",
        "Category filters and paginated queries — never 'load every post'.",
    ]),
     ("Stories", [
         "24-hour expiry computed server-side from the stored expires_at, so a user",
         "changing their device clock cannot resurrect an expired story.",
         "Full-screen viewer with progress bars, reactions, replies, viewer tracking.",
     ]),
     ("Connections", [
         "Three states — Connect / Pending / Connected — driven by one connections",
         "document, so the button label is derived, never stored twice.",
         "Accept, reject, remove; counts computed from the same collection.",
     ])],
    code=[
        "# lib/dates.py — server anchors 'now'",
        "def utc_now():",
        "    return datetime.now(timezone.utc)",
        "",
        "# stories query",
        "await db.stories.find({",
        "  'expires_at': {'$gt': utc_now()}",
        "}).to_list(100)",
    ],
    footnote="Rule: never let the client compute 'today'. Timezones and clock drift turn client-side dates into unreproducible bugs.",
)

content(
    "Step 17 — Discovery, search, and a real MongoDB trap",
    "phase 06 · features",
    [("Discovery filters", [
        "College, degree, branch, year, city, skills, interests — combined into one",
        "Mongo query built conditionally, so unused filters add no clauses.",
    ]),
     ("Global search", [
         "One endpoint returning four buckets: students, colleges, projects, posts.",
     ]),
     ("The bug that cost real time", [
         "Filtering skills with $in over $regex objects. Mongo does not evaluate",
         "regexes nested inside $in the way you expect for partial matching, so the",
         "query returned nothing while looking perfectly correct.",
         "Fix: build an $or of individual $regex clauses instead of $in.",
     ]),
     ("Takeaway", [
         "A query that returns [] is not proof the data is missing. Test the query",
         "against the shell before assuming the seed or the UI is at fault.",
     ])],
    code=[
        "# BROKEN — silently matches nothing",
        "{'skills': {'$in': [",
        "   {'$regex': q, '$options': 'i'}]}}",
        "",
        "# CORRECT",
        "{'$or': [",
        "  {'skills': {'$regex': s, '$options': 'i'}}",
        "  for s in skills",
        "]}",
    ],
)

content(
    "Step 18 — Chat and messaging",
    "phase 06 · features",
    [("Data shape", [
        "conversations holds participants, last_message and per-user unread counts.",
        "messages holds the history, indexed by conversation_id + created_at.",
    ]),
     ("Why unread lives on the conversation", [
         "The inbox list needs a badge without scanning every message in the thread.",
         "Denormalising one counter turns an O(messages) read into O(1).",
     ]),
     ("UI", [
         "Split view: conversation list with search, unread badge, last message and",
         "timestamp; thread pane with history, composer, online status, call button.",
         "Typing indicators and polling keep the thread feeling live.",
     ])],
)

content(
    "Step 19 — Projects and meeting scheduling",
    "phase 06 · features",
    [("Projects", [
        "Title, description, category, tech stack, required roles, GitHub/demo links.",
        "Join requests are their own collection (project_requests) with a status,",
        "so an owner has a reviewable queue rather than an ambiguous member list.",
        "Owner-only actions: accept/reject, add/remove members, edit, delete.",
    ]),
     ("Meetings — Calendly-style, in two collections", [
         "availabilities = the recurring weekly windows a student offers.",
         "meetings = a concrete booking that consumes one slot.",
         "Keeping them separate is what makes 'available' and 'booked' derivable",
         "instead of contradictory.",
         "Statuses: upcoming / completed / cancelled, with notifications on each.",
     ])],
    code=[
        "availabilities: {",
        "  user_id, weekday, start, end, purposes[]",
        "}",
        "meetings: {",
        "  host_id, guest_id, slot_start, slot_end,",
        "  title, description, status",
        "}",
    ],
)

# ---------------------------------------------------------------- PHASE 7
chapter("Real-time: WebRTC", "The hardest module, and the one most often faked.", "07")

content(
    "Step 20 — What a video call actually requires",
    "phase 07 · webrtc",
    [("Media never touches the server", [
        "Video and audio flow peer-to-peer between the two browsers. The backend",
        "only relays the paperwork needed to establish that path.",
    ]),
     ("The four things the server must carry", [
         "1. An SDP offer from the caller.",
         "2. An SDP answer from the callee.",
         "3. ICE candidates from both sides (network routes).",
         "4. Call state: ringing, accepted, rejected, ended.",
     ]),
     ("So the backend stays boring on purpose", [
         "call_sessions and meet_sessions are plain documents holding offer, answer",
         "and candidate arrays. Polling those endpoints is the signalling channel —",
         "no media, no heavy sockets, no extra infrastructure for the MVP.",
     ])],
    code=[
        "call_sessions: {",
        "  id, caller_id, callee_id,",
        "  offer, answer,",
        "  caller_candidates: [], callee_candidates: [],",
        "  status: 'ringing'|'active'|'ended'",
        "}",
    ],
)

content(
    "Step 21 — useWebRTC: the browser side",
    "phase 07 · webrtc",
    [("Sequence the hook implements", [
        "getUserMedia → local stream → RTCPeerConnection with STUN servers →",
        "createOffer → POST it → poll for the answer → setRemoteDescription →",
        "exchange ICE candidates → ontrack fires → remote video plays.",
    ]),
     ("Controls wired to real tracks", [
         "Mic and camera toggles flip track.enabled on the actual MediaStreamTrack.",
         "Screen share swaps in getDisplayMedia via replaceTrack on the sender.",
         "End call stops every track and closes the peer connection — skip this and",
         "the camera light stays on after the user leaves.",
     ]),
     ("Cleanup is the whole game", [
         "Every listener, poll interval and track is torn down in the effect's return.",
         "A leaked interval keeps signalling for a call that no longer exists.",
     ])],
    code=[
        "const pc = new RTCPeerConnection({",
        "  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]",
        "});",
        "stream.getTracks().forEach(t =>",
        "  pc.addTrack(t, stream));",
        "pc.onicecandidate = e => e.candidate &&",
        "  apiPost(`/calls/${id}/candidate`, e.candidate);",
        "pc.ontrack = e =>",
        "  setRemote(e.streams[0]);",
    ],
    footnote="Production note: STUN alone fails behind symmetric NAT. A TURN server (Twilio/Metered credentials in .env) is the documented next step.",
)

content(
    "Step 22 — 'Meet Someone': matching two strangers",
    "phase 07 · webrtc",
    [("Intent-based, not blind random", [
        "The user picks intents — new friends, project partners, study partners,",
        "career chat, networking, hackathon teammates — plus optional filters",
        "(same field, different college, same year, similar interests, skills).",
    ]),
     ("Queue mechanics", [
         "Entering the pool writes a meet_session with status 'waiting'. The matcher",
         "pairs the best-scoring compatible waiting session and flips both to 'matched',",
         "handing back a shared session id that the WebRTC hook then uses.",
     ]),
     ("Privacy by default", [
         "A match reveals first name, college, year and interests — not email, not",
         "contact details. Skip / Next / Report / Block are always one tap away.",
     ]),
     ("The demo fallback, declared honestly", [
         "With no second human online, an interactive simulation partner keeps the",
         "flow testable solo. It is labelled as such — a stub that pretends to be a",
         "real peer is the one thing worse than no feature at all.",
     ])],
)

# ---------------------------------------------------------------- PHASE 8
chapter("Trust, safety & admin", "The part that decides whether strangers can be let in.", "08")

content(
    "Step 23 — Reporting, blocking, privacy controls",
    "phase 08 · safety",
    [("One report engine, many targets", [
        "A single reports collection with target_type + target_id covers users,",
        "posts, comments, messages, stories and calls. One endpoint, one queue.",
    ]),
     ("Blocking is enforced in queries, not the UI", [
         "A block must remove the other user from your feed, discovery, search and",
         "matching pool — filtered server-side. Hiding them client-side is theatre.",
     ]),
     ("Anti-abuse in reputation", [
         "Five dimensions: communication, teamwork, reliability, professionalism,",
         "technical contribution. One review per pair, and only after a real",
         "interaction — otherwise the score is just a popularity contest.",
     ]),
     ("Privacy toggles", [
         "Who can message / connect / call / see profile, college, email.",
     ])],
)

content(
    "Step 24 — Admin dashboard",
    "phase 08 · safety",
    [("Metrics", [
        "Total users, active users, new registrations, posts, messages, video calls,",
        "open reports, suspended accounts — aggregated server-side.",
    ]),
     ("Moderation actions", [
         "Review report → suspend / unsuspend / ban user, delete post or comment,",
         "manage colleges. Each action is a discrete, audited endpoint.",
     ]),
     ("Guarded twice, correctly", [
         "The nav link hides for non-admins (UX), and every /api/admin route requires",
         "is_admin (security). The second one is what actually protects the data.",
     ]),
     ("A bug worth remembering", [
         "admin_router.py was missing its uuid import — fine until the first write",
         "path executed, then a 500. Python import errors inside a rarely-hit branch",
         "only appear when that branch runs. Exercise every endpoint at least once.",
     ])],
)

# ---------------------------------------------------------------- PHASE 9
chapter("Verification & the rebrand", "Proving it works, then changing its name.", "09")

content(
    "Step 25 — The three-check verification gate",
    "phase 09 · verification",
    [("Check 1 — API smoke via curl", [
        "Hit the key endpoints, assert status and a real field in the body, plus one",
        "negative case (401 without a token) to prove auth actually rejects.",
    ]),
     ("Check 2 — yarn typecheck", [
         "The only place Pydantic ↔ TypeScript drift becomes visible. Vite never",
         "typechecks, so skipping this ships type lies to production.",
     ]),
     ("Check 3 — one Playwright happy path", [
         "Log in → feed → like → discover → message → project → screenshot, logging",
         "console errors and any response ≥ 400. Creating real data is the point.",
     ]),
     ("Run all three against the public URL, not just localhost", [
         "localhost proves the code. The public URL proves ingress, the proxy and",
         "CORS — the path real users actually take.",
     ])],
    code=[
        "curl -s -o /dev/null -w '%{http_code}' \\",
        "  $URL/api/",
        "curl -s $URL/api/auth/login -X POST \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"email\":\"...\",\"password\":\"...\"}'",
        "curl -s $URL/api/users/me   # expect 401",
        "cd frontend && yarn typecheck",
    ],
)

content(
    "Step 26 — Bugs found and how each was fixed",
    "phase 09 · verification",
    [("1 · Mongo $in + $regex returned empty sets", [
        "search_router.py and users_router.py — rebuilt as an $or of $regex clauses.",
    ]),
     ("2 · Missing uuid import in admin_router.py", [
         "500 on the first admin write. Added the import; re-ran the endpoint.",
     ]),
     ("3 · lucide-react icon names that don't exist", [
         "TypeScript caught these only at typecheck time, not in the browser.",
     ]),
     ("4 · Toast overlapping the notification bell", [
         "Sonner re-anchored bottom-right; verified with a screenshot, not a guess.",
     ]),
     ("The protocol behind all four", [
         "Reproduce it → fix it → re-run the exact same repro. 'Should be fixed' is",
         "not a status. If it touches both sides, verify both: curl and screenshot.",
     ])],
)

content(
    "Step 27 — The rebrand: Nexus → Unisphere",
    "phase 09 · verification",
    [("What actually changed", [
        "Every brand string in 18 pages and 17 routers, the CSS token palette",
        "(indigo/blue → violet/amber), the logo mark and wordmark, seed-data copy,",
        "the page title and meta description, and the API tagline.",
    ]),
     ("Why it was cheap-ish", [
         "Colours lived in CSS custom properties, not sprinkled through components,",
         "so the palette swap was one file. Brand strings were the expensive part.",
     ]),
     ("The lesson, stated plainly", [
         "Design tokens are not decoration — they are the difference between a",
         "one-file theme change and a 60-file search-and-replace. Centralise",
         "anything a stakeholder can change their mind about.",
     ])],
    code=[
        "/* one file changed the whole theme */",
        "--primary: #6366F1;  /* was indigo */",
        "--primary: #8B5CF6;  /* now violet */",
        "--accent:  #FBBF24;  /* sunset amber */",
    ],
)

# ---------------------------------------------------------------- PHASE 10
chapter("Deployment & what comes next", "Shipping it, and where the seams are.", "10")

content(
    "Step 28 — Deployment reality check",
    "phase 10 · shipping",
    [("What this app is", [
        "A Python (FastAPI) API + MongoDB + a static React build served on one origin.",
    ]),
     ("Why Vercel alone cannot host it", [
         "Vercel runs static output, Next.js and serverless functions — not a",
         "long-lived uvicorn process with a Mongo connection pool. Frontend-only",
         "deployment there produces a UI with no working API.",
     ]),
     ("Two workable paths", [
         "A · Emergent's one-click deploy — frontend, backend and database together.",
         "B · Split: frontend on Vercel, backend on Render/Railway/Fly.io, and the",
         "frontend's API base becomes an environment variable instead of '/api'.",
     ]),
     ("External services to configure for production", [
         "TURN server credentials for reliable WebRTC, SMTP/Resend for real email",
         "verification and password reset, object storage for user uploads.",
     ])],
)

content(
    "Step 29 — Performance and scale decisions already in place",
    "phase 10 · shipping",
    [("Applied", [
        "Startup-declared Mongo indexes on every query path.",
        "Paginated feed, messages, discovery and search — no unbounded reads.",
        "TanStack Query caching and dedupe instead of per-component fetching.",
        "Denormalised counters (unread, likes_count) for O(1) list rendering.",
        "Route-level code splitting so first paint doesn't ship all 18 pages.",
    ]),
     ("Deliberately deferred", [
         "WebSockets in place of polling for chat and signalling.",
         "Redis caching and rate limiting at the edge.",
         "CDN-backed media pipeline with transcoding for story video.",
         "Each is a swap behind an existing boundary — not a rewrite. That is the",
         "return on drawing the boundaries in Phase 01.",
     ])],
)

content(
    "Step 30 — Ten lessons worth stealing",
    "phase 10 · shipping",
    [("", [
        "1 · Clarify the brand, stack and scope on turn one. Ambiguity compounds.",
        "2 · Contracts before code: schema → endpoint → interface → UI.",
        "3 · One typed fetch layer. Never a hand-rolled fetch in a component.",
        "4 · Model join tables separately; never grow an array inside a document.",
        "5 · Seed rich demo data early — it exposes layout bugs immediately.",
        "6 · Authorization is per-request ownership, not a hidden button.",
        "7 · Centralise design tokens; a rebrand should be one file, not sixty.",
        "8 · The server owns 'now'. Client-side dates are unreproducible bugs.",
        "9 · Verify with three lenses: curl, typecheck, real browser click-through.",
        "10 · Never fake a feature. Ship the real flow, or label the stub honestly.",
    ])],
)

# ---------------------------------------------------------------- CLOSING
s = new_slide()
rect(s, Inches(0), Inches(0), W, Inches(0.12), VIOLET)
rect(s, Inches(0), H - Inches(0.12), W, Inches(0.12), AMBER)
text(s, Inches(1.1), Inches(1.3), Inches(11), Inches(0.5),
     [("REFERENCE", {"color": AMBER, "size": 15, "bold": True, "font": MONO_FONT})])
text(s, Inches(1.1), Inches(1.75), Inches(11.5), Inches(0.9),
     [("Where to look in the repository", {"size": 38, "bold": True, "font": HEAD_FONT})])
text(s, Inches(1.1), Inches(2.85), Inches(5.6), Inches(3.5),
     [("backend/server.py", {"size": 15, "font": MONO_FONT, "color": AMBER}),
      ("router wiring, /api prefix, lifespan", {"size": 13, "color": MUTED}),
      ("backend/lib/auth.py", {"size": 15, "font": MONO_FONT, "color": AMBER}),
      ("hashing, JWT, user dependencies", {"size": 13, "color": MUTED}),
      ("backend/lib/db.py", {"size": 15, "font": MONO_FONT, "color": AMBER}),
      ("Motor client, index plan", {"size": 13, "color": MUTED}),
      ("backend/models/schemas.py", {"size": 15, "font": MONO_FONT, "color": AMBER}),
      ("every Pydantic model", {"size": 13, "color": MUTED}),
      ("backend/seed.py", {"size": 15, "font": MONO_FONT, "color": AMBER}),
      ("demo personas and content", {"size": 13, "color": MUTED})], spacing=1.1)
text(s, Inches(7.2), Inches(2.85), Inches(5.4), Inches(3.5),
     [("frontend/src/lib/api.ts", {"size": 15, "font": MONO_FONT, "color": PINK}),
      ("typed fetch layer + ApiError", {"size": 13, "color": MUTED}),
      ("frontend/src/lib/types.ts", {"size": 15, "font": MONO_FONT, "color": PINK}),
      ("TS mirrors of the Pydantic models", {"size": 13, "color": MUTED}),
      ("frontend/src/lib/useWebRTC.ts", {"size": 15, "font": MONO_FONT, "color": PINK}),
      ("peer connection, signalling, controls", {"size": 13, "color": MUTED}),
      ("frontend/src/components/AppShell.tsx", {"size": 15, "font": MONO_FONT, "color": PINK}),
      ("responsive nav shell", {"size": 13, "color": MUTED}),
      ("memory/SPEC.md", {"size": 15, "font": MONO_FONT, "color": PINK}),
      ("the living specification", {"size": 13, "color": MUTED})], spacing=1.1)
text(s, Inches(1.1), Inches(6.35), Inches(11), Inches(0.5),
     [("Unisphere — Your Campus Is Bigger Than Your Campus.", {"size": 16, "color": WHITE, "bold": True, "font": HEAD_FONT})])

out = "/app/frontend/public/Unisphere-Build-Walkthrough.pptx"
prs.save(out)
print("saved", out, "slides:", len(prs.slides._sldIdLst))
