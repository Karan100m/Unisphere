import { ApiError } from "@/lib/api";

export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) {
    const body = err.body as { detail?: unknown } | null;
    if (body && typeof body.detail === "string") return body.detail;
    if (body && Array.isArray(body.detail)) {
      const first = body.detail[0] as { msg?: string; loc?: string[] } | undefined;
      if (first?.msg) return `${first.loc?.slice(-1)[0] ?? "Field"}: ${first.msg}`;
    }
    if (err.status === 401) return "Please log in to continue.";
    if (err.status === 403) return "You do not have permission for this action.";
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export const COLLEGE_OPTIONS = [
  "Stanford University",
  "Massachusetts Institute of Technology",
  "Lovely Professional University",
  "University of Oxford",
  "UC Berkeley",
];

export const DEGREE_OPTIONS = ["B.Tech", "B.S.", "B.A.", "B.Com", "MBBS", "B.Des", "BBA", "B.Sc"];

export const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export const BRANCH_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "EECS",
  "Symbolic Systems",
  "Mechanical & Robotics",
  "Bioengineering & CS",
  "Product Design",
  "Philosophy, Politics & Economics",
  "Electronics & Communication",
  "Business Management",
];

export const SKILL_OPTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "C++", "Rust", "Go",
  "Machine Learning", "PyTorch", "OpenCV", "FastAPI", "Figma", "Tailwind CSS",
  "Kubernetes", "Docker", "SQL", "MongoDB", "Flutter", "ROS2", "Blender", "GraphQL",
];

export const INTEREST_OPTIONS = [
  "AI/ML", "Startups", "Hackathons", "Web Development", "Robotics", "Computer Vision",
  "FinTech", "HealthTech", "CleanTech", "Design Systems", "Open Source", "Research",
  "Product Management", "Cloud Architecture", "Blockchain", "Community Building",
];

export const PROJECT_CATEGORIES = [
  "AI/ML", "Web Dev", "Mobile", "Robotics", "Blockchain", "FinTech", "Design", "Research", "Biotech",
];

export const POST_CATEGORIES = [
  { value: "general", label: "Student Life" },
  { value: "project", label: "Project Update" },
  { value: "achievement", label: "Achievement" },
  { value: "event", label: "College Event" },
  { value: "hackathon", label: "Hackathon" },
  { value: "internship", label: "Internship" },
  { value: "question", label: "Question" },
];

export const MEET_INTENTS = [
  "New Friends",
  "Project Partners",
  "Study Partners",
  "Career Discussion",
  "Networking",
  "Hackathon Teammates",
];

export const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate content",
  "Spam or scam",
  "Impersonation / fake profile",
  "Hate speech",
  "Other safety concern",
];
