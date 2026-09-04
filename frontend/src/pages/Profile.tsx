import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus, MessageSquare, Video, CalendarDays, Star, MapPin, GraduationCap,
  Code2, Link2, Globe, Pencil, Sparkles, Award, Flag, Ban, Clock, Check, Loader2,
} from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  getErrorMessage, timeAgo, SKILL_OPTIONS, INTEREST_OPTIONS,
  COLLEGE_OPTIONS, DEGREE_OPTIONS, YEAR_OPTIONS, BRANCH_OPTIONS,
} from "@/lib/helpers";
import type {
  UserResponse, ReputationResponse, ConversationResponse, CallSessionResponse,
  BioEnhanceResponse, PostResponse,
} from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/PostCard";
import { ReportDialog } from "@/components/ReportDialog";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  ["communication", "Communication"],
  ["teamwork", "Teamwork"],
  ["reliability", "Reliability"],
  ["professionalism", "Professionalism"],
  ["technical", "Technical contribution"],
] as const;

function EditProfileDialog({
  open, onOpenChange, me,
}: { open: boolean; onOpenChange: (o: boolean) => void; me: UserResponse }) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    full_name: me.full_name,
    college: me.college,
    degree: me.degree,
    branch: me.branch,
    current_year: me.current_year,
    grad_year: me.grad_year,
    city_country: me.city_country,
    bio: me.bio,
    avatar_url: me.avatar_url,
    github_url: me.github_url,
    linkedin_url: me.linkedin_url,
    portfolio_url: me.portfolio_url,
    projects_summary: me.projects_summary,
  });
  const [skills, setSkills] = useState<string[]>(me.skills);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [achievements, setAchievements] = useState(me.achievements.join("\n"));
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (l: string[], s: (x: string[]) => void, i: string) =>
    s(l.includes(i) ? l.filter((x) => x !== i) : [...l, i]);

  const aiMutation = useMutation({
    mutationFn: () =>
      apiPost<BioEnhanceResponse>("/ai/enhance-bio", {
        current_bio: form.bio,
        major: `${form.degree} ${form.branch}`,
        skills,
        interests,
        tone: "professional",
      }),
    onSuccess: (d) => {
      setAiSuggestions(d.suggestions);
      toast.success("AI drafted 3 bio options for you");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPut<UserResponse>("/users/me", {
        ...form,
        grad_year: Number(form.grad_year),
        skills,
        interests,
        achievements: achievements.split("\n").map((a) => a.trim()).filter(Boolean),
      }),
    onSuccess: async () => {
      toast.success("Profile updated!");
      await refreshUser();
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto" data-testid="edit-profile-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit your profile</DialogTitle>
          <DialogDescription>Keep this fresh — it powers how students discover you.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input data-testid="edit-fullname-input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>City, Country</Label>
              <Input data-testid="edit-city-input" value={form.city_country} onChange={(e) => set("city_country", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>College</Label>
              <Select value={form.college} onValueChange={(v: string) => set("college", v)}>
                <SelectTrigger data-testid="edit-college-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([me.college, ...COLLEGE_OPTIONS])].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Major / Branch</Label>
              <Select value={form.branch} onValueChange={(v: string) => set("branch", v)}>
                <SelectTrigger data-testid="edit-branch-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([me.branch, ...BRANCH_OPTIONS])].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Degree</Label>
              <Select value={form.degree} onValueChange={(v: string) => set("degree", v)}>
                <SelectTrigger data-testid="edit-degree-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([me.degree, ...DEGREE_OPTIONS])].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Current year</Label>
              <Select value={form.current_year} onValueChange={(v: string) => set("current_year", v)}>
                <SelectTrigger data-testid="edit-year-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set([me.current_year, ...YEAR_OPTIONS])].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Grad year</Label>
              <Input
                data-testid="edit-gradyear-input"
                type="number"
                value={form.grad_year}
                onChange={(e) => set("grad_year", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Bio</Label>
              <Button
                size="xs"
                variant="outline"
                data-testid="ai-bio-enhance-btn"
                disabled={aiMutation.isPending}
                onClick={() => aiMutation.mutate()}
              >
                {aiMutation.isPending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 size-3" />
                )}
                Enhance with AI
              </Button>
            </div>
            <Textarea data-testid="edit-bio-input" value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} />
          </div>

          {aiSuggestions.length > 0 && (
            <div data-testid="ai-bio-suggestions" className="space-y-2 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">AI suggestions — tap to use</p>
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  data-testid={`ai-bio-suggestion-${i}`}
                  onClick={() => {
                    set("bio", s);
                    toast.success("Bio applied");
                  }}
                  className="block w-full rounded-lg bg-white/[0.04] px-3 py-2 text-left text-xs leading-relaxed text-slate-300 transition-colors duration-200 hover:bg-violet-500/15"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Projects summary</Label>
            <Textarea
              data-testid="edit-projects-input"
              value={form.projects_summary}
              onChange={(e) => set("projects_summary", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Achievements <span className="text-slate-500">(one per line)</span></Label>
            <Textarea
              data-testid="edit-achievements-input"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-white/[0.06] p-2.5">
              {[...new Set([...me.skills, ...SKILL_OPTIONS])].map((s) => (
                <button
                  key={s}
                  data-testid={`edit-skill-${s.replace(/[^a-zA-Z]/g, "").toLowerCase()}`}
                  onClick={() => toggle(skills, setSkills, s)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors duration-200",
                    skills.includes(s)
                      ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                      : "border-white/[0.08] text-slate-400 hover:border-white/20",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-white/[0.06] p-2.5">
              {[...new Set([...me.interests, ...INTEREST_OPTIONS])].map((s) => (
                <button
                  key={s}
                  data-testid={`edit-interest-${s.replace(/[^a-zA-Z]/g, "").toLowerCase()}`}
                  onClick={() => toggle(interests, setInterests, s)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors duration-200",
                    interests.includes(s)
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                      : "border-white/[0.08] text-slate-400 hover:border-white/20",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Avatar URL</Label>
              <Input data-testid="edit-avatar-input" value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>GitHub</Label>
              <Input data-testid="edit-github-input" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input data-testid="edit-linkedin-input" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Portfolio</Label>
              <Input data-testid="edit-portfolio-input" value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="edit-profile-cancel-btn">Cancel</Button>
          <Button data-testid="edit-profile-save-btn" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EndorseDialog({
  open, onOpenChange, target,
}: { open: boolean; onOpenChange: (o: boolean) => void; target: UserResponse }) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>({
    communication: 5, teamwork: 5, reliability: 5, professionalism: 5, technical: 5,
  });
  const [comment, setComment] = useState("");
  const [interactionType, setInteractionType] = useState("project_collab");

  const endorseMutation = useMutation({
    mutationFn: () =>
      apiPost("/reputation/endorse", {
        target_user_id: target.id,
        interaction_type: interactionType,
        ...scores,
        comment,
      }),
    onSuccess: () => {
      toast.success(`Endorsement submitted for ${target.full_name.split(" ")[0]}!`);
      void queryClient.invalidateQueries({ queryKey: ["reputation", target.id] });
      void queryClient.invalidateQueries({ queryKey: ["profile", target.id] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="endorse-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Endorse {target.full_name.split(" ")[0]}</DialogTitle>
          <DialogDescription>
            Rate based on real collaboration. You can update your endorsement, but only one counts per student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>How did you work together?</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger data-testid="endorse-interaction-select">
                <SelectValue>
                  {(v) => ({
                    project_collab: "Project collaboration",
                    meeting: "1-on-1 meeting",
                    study_session: "Study session",
                    networking: "Networking chat",
                  }[v as string] ?? "Select")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_collab">Project collaboration</SelectItem>
                <SelectItem value="meeting">1-on-1 meeting</SelectItem>
                <SelectItem value="study_session">Study session</SelectItem>
                <SelectItem value="networking">Networking chat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {CATEGORIES.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <span className="font-mono text-xs text-violet-400">{scores[key]}/5</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    data-testid={`endorse-${key}-${n}`}
                    onClick={() => setScores((s) => ({ ...s, [key]: n }))}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs transition-colors duration-200",
                      scores[key] >= n ? "bg-violet-500/25 text-violet-200" : "bg-white/[0.04] text-slate-500",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label>Your feedback</Label>
            <Textarea
              data-testid="endorse-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What was it like working with them?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="endorse-submit-btn"
            disabled={endorseMutation.isPending || !comment.trim()}
            onClick={() => endorseMutation.mutate()}
          >
            {endorseMutation.isPending ? "Submitting…" : "Submit endorsement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const targetId = id === "me" ? user?.id : id;
  const isMe = targetId === user?.id;

  const [editOpen, setEditOpen] = useState(false);
  const [endorseOpen, setEndorseOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", targetId],
    queryFn: () => apiGet<UserResponse>(`/users/${targetId}`),
    enabled: !!targetId,
  });

  const { data: reputation } = useQuery({
    queryKey: ["reputation", targetId],
    queryFn: () => apiGet<ReputationResponse>(`/reputation/user/${targetId}`),
    enabled: !!targetId,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["posts", "author", targetId],
    queryFn: () => apiGet<PostResponse[]>(`/posts?author_id=${targetId}`),
    enabled: !!targetId,
  });

  const { data: connStatus } = useQuery({
    queryKey: ["connection-status", targetId],
    queryFn: () => apiGet<{ status: string; connection_id?: string }>(`/connections/status/${targetId}`),
    enabled: !!targetId && !isMe,
  });

  const connectMutation = useMutation({
    mutationFn: () => apiPost("/connections/request", { recipient_id: targetId, note: "" }),
    onSuccess: () => {
      toast.success("Connection request sent!");
      void queryClient.invalidateQueries({ queryKey: ["connection-status", targetId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const messageMutation = useMutation({
    mutationFn: () => apiPost<ConversationResponse>(`/conversations/get-or-create/${targetId}`),
    onSuccess: (c) => navigate(`/messages?conv=${c.id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const callMutation = useMutation({
    mutationFn: () => apiPost<CallSessionResponse>("/calls/initiate", { recipient_id: targetId, call_type: "video" }),
    onSuccess: (c) => navigate(`/calls/${c.call_id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const blockMutation = useMutation({
    mutationFn: () => apiPost("/safety/block", { blocked_user_id: targetId }),
    onSuccess: () => {
      toast.success("Student blocked. They can no longer contact you.");
      navigate("/discover");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <LoadingState label="Loading profile…" />;
  if (isError || !profile) return <ErrorState message="This profile couldn't be loaded or is unavailable." />;

  const status = connStatus?.status ?? "none";
  const cat = reputation?.category_scores ?? profile.category_reputation;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* BANNER + IDENTITY */}
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]">
        <div className="relative h-32 bg-gradient-to-br from-violet-600/30 via-[#221733] to-amber-500/20 sm:h-44">
          {profile.banner_url && (
            <img src={profile.banner_url} alt="Profile banner" className="size-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#16101F] to-transparent" />
        </div>

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size="2xl"
              testId="profile-avatar"
              className="ring-4 ring-[#16101F]"
            />
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 data-testid="profile-name" className="font-heading text-2xl font-bold tracking-tight">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <Badge className="border-0 bg-emerald-500/15 text-[10px] text-emerald-300">Verified</Badge>
                )}
                {profile.role === "admin" && (
                  <Badge className="border-0 bg-rose-500/15 text-[10px] text-rose-300">Admin</Badge>
                )}
              </div>
              <p data-testid="profile-degree-line" className="mt-1 text-sm text-slate-300">
                {profile.degree} {profile.branch} • {profile.current_year}
              </p>
              <p data-testid="profile-college" className="text-sm text-violet-400">{profile.college}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="size-3" /> {profile.city_country}</span>
                <span className="flex items-center gap-1"><GraduationCap className="size-3" /> Class of {profile.grad_year}</span>
                <span data-testid="profile-connections-count">{profile.connections_count} connections</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="size-3 fill-current" />
                  <span data-testid="profile-reputation-score">{profile.reputation_score.toFixed(2)}</span>
                  <span className="text-slate-500">({profile.endorsements_count} endorsements)</span>
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 flex flex-wrap gap-2">
            {isMe ? (
              <>
                <Button size="sm" data-testid="profile-edit-btn" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-1.5 size-3.5" /> Edit profile
                </Button>
                <Button size="sm" variant="outline" data-testid="profile-settings-btn" onClick={() => navigate("/settings")}>
                  Privacy settings
                </Button>
              </>
            ) : (
              <>
                {status === "connected" ? (
                  <Badge className="border-0 bg-emerald-500/15 px-3 py-1.5 text-emerald-300" data-testid="profile-connected-badge">
                    <Check className="mr-1 size-3" /> Connected
                  </Badge>
                ) : status === "pending_sent" || status === "pending_received" ? (
                  <Badge className="border-0 bg-amber-500/15 px-3 py-1.5 text-amber-300" data-testid="profile-pending-badge">
                    <Clock className="mr-1 size-3" /> Pending
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    data-testid="profile-connect-btn"
                    disabled={connectMutation.isPending}
                    onClick={() => connectMutation.mutate()}
                  >
                    <UserPlus className="mr-1.5 size-3.5" /> Connect
                  </Button>
                )}
                <Button size="sm" variant="outline" data-testid="profile-message-btn" onClick={() => messageMutation.mutate()}>
                  <MessageSquare className="mr-1.5 size-3.5" /> Message
                </Button>
                <Button size="sm" variant="outline" data-testid="profile-videocall-btn" onClick={() => callMutation.mutate()}>
                  <Video className="mr-1.5 size-3.5" /> Video Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="profile-schedule-btn"
                  onClick={() => navigate(`/meetings?book=${profile.id}`)}
                >
                  <CalendarDays className="mr-1.5 size-3.5" /> Schedule Meeting
                </Button>
                <Button size="sm" variant="outline" data-testid="profile-endorse-btn" onClick={() => setEndorseOpen(true)}>
                  <Award className="mr-1.5 size-3.5" /> Endorse
                </Button>
                <Button size="icon-sm" variant="ghost" data-testid="profile-report-btn" onClick={() => setReportOpen(true)}>
                  <Flag className="size-4 text-slate-500" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  data-testid="profile-block-btn"
                  onClick={() => blockMutation.mutate()}
                >
                  <Ban className="size-4 text-slate-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="about">
        <TabsList variant="line" className="w-full overflow-x-auto" data-testid="profile-tabs">
          <TabsTrigger value="about" data-testid="profile-tab-about">About</TabsTrigger>
          <TabsTrigger value="posts" data-testid="profile-tab-posts">Posts ({userPosts.length})</TabsTrigger>
          <TabsTrigger value="reputation" data-testid="profile-tab-reputation">
            Reputation ({reputation?.total_reviews ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-5 space-y-4">
          {profile.bio && (
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Bio</h2>
              <p data-testid="profile-bio" className="mt-2.5 text-sm leading-relaxed text-slate-300">{profile.bio}</p>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Skills</h2>
              <div data-testid="profile-skills" className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.length === 0 ? (
                  <p className="text-xs text-slate-500">No skills listed yet.</p>
                ) : (
                  profile.skills.map((s) => (
                    <span key={s} className="rounded-full bg-violet-500/[0.09] px-2.5 py-1 text-xs text-violet-300">{s}</span>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Interests</h2>
              <div data-testid="profile-interests" className="mt-3 flex flex-wrap gap-1.5">
                {profile.interests.length === 0 ? (
                  <p className="text-xs text-slate-500">No interests listed yet.</p>
                ) : (
                  profile.interests.map((s) => (
                    <span key={s} className="rounded-full bg-amber-500/[0.09] px-2.5 py-1 text-xs text-amber-300">{s}</span>
                  ))
                )}
              </div>
            </section>
          </div>

          {profile.projects_summary && (
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Projects</h2>
              <p data-testid="profile-projects" className="mt-2.5 text-sm leading-relaxed text-slate-300">
                {profile.projects_summary}
              </p>
              <Link
                to={`/projects?owner=${profile.id}`}
                data-testid="profile-view-projects-link"
                className="mt-3 inline-block text-xs font-semibold text-violet-400 hover:text-violet-300"
              >
                View all projects →
              </Link>
            </section>
          )}

          {profile.achievements.length > 0 && (
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Achievements</h2>
              <ul data-testid="profile-achievements" className="mt-3 space-y-2">
                {profile.achievements.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm text-slate-300">
                    <Award className="mt-0.5 size-3.5 shrink-0 text-amber-400" /> {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Links</h2>
              <div data-testid="profile-links" className="mt-3 flex flex-wrap gap-2">
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="profile-github-link"
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition-colors duration-200 hover:border-violet-500/40"
                  >
                    <Code2 className="size-3.5" /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="profile-linkedin-link"
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition-colors duration-200 hover:border-violet-500/40"
                  >
                    <Link2 className="size-3.5" /> LinkedIn
                  </a>
                )}
                {profile.portfolio_url && (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="profile-portfolio-link"
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition-colors duration-200 hover:border-violet-500/40"
                  >
                    <Globe className="size-3.5" /> Portfolio
                  </a>
                )}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-5 space-y-4">
          {userPosts.length === 0 ? (
            <EmptyState
              testId="profile-posts-empty"
              title={isMe ? "You haven't posted yet" : "No posts yet"}
              description={isMe ? "Share a project update or a win with your network." : undefined}
            />
          ) : (
            userPosts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>

        <TabsContent value="reputation" className="mt-5 space-y-4">
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-baseline gap-3">
              <p data-testid="reputation-overall-score" className="font-heading text-4xl font-bold text-violet-300">
                {(reputation?.overall_score ?? profile.reputation_score).toFixed(2)}
              </p>
              <div>
                <p className="text-sm font-semibold">Overall reputation</p>
                <p className="text-xs text-slate-500">
                  From {reputation?.total_reviews ?? 0} peer endorsements
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {CATEGORIES.map(([key, label]) => {
                const val = (cat as unknown as Record<string, number>)[key] ?? 5;
                return (
                  <div key={key} data-testid={`reputation-category-${key}`}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-300">{label}</span>
                      <span className="font-mono text-violet-400">{val.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-[width] duration-500"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {(reputation?.reviews.length ?? 0) === 0 ? (
            <EmptyState
              testId="reputation-reviews-empty"
              title="No endorsements yet"
              description="Endorsements come from students who have actually collaborated."
              icon={<Award className="size-6" />}
            />
          ) : (
            reputation!.reviews.map((r) => (
              <div
                key={r.id}
                data-testid={`reputation-review-${r.id}`}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={r.reviewer_avatar} name={r.reviewer_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${r.reviewer_id}`} className="truncate text-sm font-semibold hover:text-violet-300">
                      {r.reviewer_name}
                    </Link>
                    <p className="truncate text-[11px] text-slate-500">
                      {r.reviewer_college} · {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                    <Star className="size-3 fill-current" /> {r.average_score.toFixed(2)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">"{r.comment}"</p>
                <Badge className="mt-3 border-0 bg-white/[0.05] text-[10px] text-slate-400">
                  {r.interaction_type.replace(/_/g, " ")}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {isMe && <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} me={profile} />}
      {!isMe && <EndorseDialog open={endorseOpen} onOpenChange={setEndorseOpen} target={profile} />}
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="user"
        targetId={profile.id}
        targetLabel={profile.full_name}
      />
    </div>
  );
}
