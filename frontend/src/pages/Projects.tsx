import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Search, Code2, ExternalLink, Users, Sparkles, Loader2, Check, X,
  Trash2, FolderKanban, UserPlus, Pencil,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, PROJECT_CATEGORIES, timeAgo } from "@/lib/helpers";
import type { ProjectResponse, ProjectJoinRequestResponse, ProjectMatchResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/States";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  recruiting: "bg-emerald-500/15 text-emerald-300",
  in_progress: "bg-amber-500/15 text-amber-300",
  completed: "bg-white/[0.08] text-slate-400",
};

function ApplyDialog({
  open, onOpenChange, project,
}: { open: boolean; onOpenChange: (o: boolean) => void; project: ProjectResponse }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [role, setRole] = useState(project.looking_for_roles[0]?.role_name ?? "Contributor");
  const [pitch, setPitch] = useState("");
  const [match, setMatch] = useState<ProjectMatchResponse | null>(null);

  const matchMutation = useMutation({
    mutationFn: () => apiPost<ProjectMatchResponse>("/ai/match-project", { project_id: project.id, role_name: role }),
    onSuccess: (d) => {
      setMatch(d);
      if (!pitch.trim()) setPitch(d.suggested_pitch);
      toast.success(`AI match score: ${d.match_percentage}%`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      apiPost<ProjectJoinRequestResponse>(`/projects/${project.id}/apply`, {
        role_applied: role,
        pitch,
        skills: user?.skills ?? [],
      }),
    onSuccess: () => {
      toast.success("Application sent! The project owner will review it.");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto" data-testid="project-apply-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Request to join</DialogTitle>
          <DialogDescription>{project.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role you're applying for</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="apply-role-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(project.looking_for_roles.length > 0
                  ? project.looking_for_roles.map((r) => r.role_name)
                  : ["Contributor"]
                ).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="ai-project-match-btn"
            disabled={matchMutation.isPending}
            onClick={() => matchMutation.mutate()}
          >
            {matchMutation.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" />
            )}
            Check my AI match & draft a pitch
          </Button>

          {match && (
            <div data-testid="ai-match-result" className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
              <div className="flex items-baseline gap-2">
                <p data-testid="ai-match-percentage" className="font-heading text-2xl font-bold text-violet-300">
                  {match.match_percentage}%
                </p>
                <p className="text-xs text-slate-400">skill match for this role</p>
              </div>
              {match.match_strengths.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400">Your strengths</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {match.match_strengths.map((s) => (
                      <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {match.missing_skills.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400">Worth learning</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {match.missing_skills.map((s) => (
                      <span key={s} className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Your pitch</Label>
            <Textarea
              data-testid="apply-pitch-input"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Why are you a great fit for this role?"
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="apply-submit-btn"
            disabled={applyMutation.isPending || !pitch.trim()}
            onClick={() => applyMutation.mutate()}
          >
            {applyMutation.isPending ? "Sending…" : "Send application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApplicantsDialog({
  open, onOpenChange, project,
}: { open: boolean; onOpenChange: (o: boolean) => void; project: ProjectResponse }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["project-requests", project.id],
    queryFn: () => apiGet<ProjectJoinRequestResponse[]>(`/projects/${project.id}/requests`),
    enabled: open,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      apiPost(`/projects/requests/${id}/review`, { status }),
    onSuccess: (_d, v) => {
      toast.success(v.status === "accepted" ? "Applicant added to your team!" : "Application declined");
      void queryClient.invalidateQueries({ queryKey: ["project-requests", project.id] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto" data-testid="project-applicants-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Join requests</DialogTitle>
          <DialogDescription>{project.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <SkeletonCard />
          ) : requests.length === 0 ? (
            <EmptyState
              testId="project-applicants-empty"
              title="No applications yet"
              description="Share your project on the feed to attract teammates."
            />
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                data-testid={`applicant-item-${r.id}`}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={r.applicant_avatar} name={r.applicant_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${r.applicant_id}`} className="truncate text-sm font-semibold hover:text-violet-300">
                      {r.applicant_name}
                    </Link>
                    <p className="truncate text-[11px] text-slate-500">{r.applicant_college}</p>
                  </div>
                  <Badge
                    className={cn(
                      "shrink-0 border-0 text-[10px]",
                      r.status === "accepted"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : r.status === "rejected"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-amber-500/15 text-amber-300",
                    )}
                  >
                    {r.status}
                  </Badge>
                </div>

                <p className="mt-2.5 text-[11px] font-semibold text-violet-400">Applying for: {r.role_applied}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">"{r.pitch}"</p>

                {r.skills.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {r.skills.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full bg-violet-500/[0.09] px-2 py-0.5 text-[10px] text-violet-300">{s}</span>
                    ))}
                  </div>
                )}

                {r.status === "pending" && (
                  <div className="mt-3.5 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      data-testid={`applicant-accept-btn-${r.id}`}
                      onClick={() => reviewMutation.mutate({ id: r.id, status: "accepted" })}
                    >
                      <Check className="mr-1.5 size-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      data-testid={`applicant-reject-btn-${r.id}`}
                      onClick={() => reviewMutation.mutate({ id: r.id, status: "rejected" })}
                    >
                      <X className="mr-1.5 size-3.5" /> Decline
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: PROJECT_CATEGORIES[0],
    technologies: "",
    github_url: "",
    demo_url: "",
    roles: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<ProjectResponse>("/projects", {
        title: form.title,
        description: form.description,
        category: form.category,
        technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
        looking_for_roles: form.roles
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
          .map((r) => ({ role_name: r, skills_needed: [], count: 1 })),
        github_url: form.github_url,
        demo_url: form.demo_url,
        status: "recruiting",
      }),
    onSuccess: () => {
      toast.success("Project created! Students can now apply to join.");
      setForm({ title: "", description: "", category: PROJECT_CATEGORIES[0], technologies: "", github_url: "", demo_url: "", roles: "" });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto" data-testid="project-create-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Create a project</DialogTitle>
          <DialogDescription>List the roles you need and start recruiting across campuses.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project title</Label>
            <Input
              data-testid="project-title-input"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="AI Attendance System"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              data-testid="project-description-input"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What are you building and why?"
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v: string) => set("category", v)}>
              <SelectTrigger data-testid="project-category-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Technologies <span className="text-slate-500">(comma separated)</span></Label>
            <Input
              data-testid="project-technologies-input"
              value={form.technologies}
              onChange={(e) => set("technologies", e.target.value)}
              placeholder="Python, OpenCV, React"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Roles you're looking for <span className="text-slate-500">(comma separated)</span></Label>
            <Input
              data-testid="project-roles-input"
              value={form.roles}
              onChange={(e) => set("roles", e.target.value)}
              placeholder="Frontend Developer, ML Engineer"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>GitHub link</Label>
              <Input data-testid="project-github-input" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Demo link</Label>
              <Input data-testid="project-demo-input" value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="project-create-submit-btn"
            disabled={createMutation.isPending || !form.title.trim() || !form.description.trim()}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const ownerFilter = searchParams.get("owner");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [applyProject, setApplyProject] = useState<ProjectResponse | null>(null);
  const [applicantsProject, setApplicantsProject] = useState<ProjectResponse | null>(null);

  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category !== "all") params.set("category", category);
  if (ownerFilter) params.set("owner_id", ownerFilter);

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ["projects", params.toString()],
    queryFn: () => apiGet<ProjectResponse[]>(`/projects?${params.toString()}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/projects/${id}`),
    onSuccess: () => {
      toast.success("Project deleted");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiPut(`/projects/${id}`, { status }),
    onSuccess: () => {
      toast.success("Project status updated");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 data-testid="projects-heading" className="font-heading text-2xl font-bold tracking-tight">
            Project Collaboration
          </h1>
          <p className="mt-1 text-sm text-slate-400">Find teammates or join a project that needs your skills.</p>
        </div>
        <Button data-testid="project-create-btn" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-4" /> New project
        </Button>
      </div>

      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            data-testid="projects-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, tech stacks…"
            className="h-11 pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="projects-category-filter" className="h-11 w-40 shrink-0">
            <SelectValue>{(v) => (v === "all" ? "All categories" : String(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PROJECT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load projects right now." />
      ) : (projects?.length ?? 0) === 0 ? (
        <EmptyState
          testId="projects-empty-state"
          title="No projects found"
          description="Be the first to post a project and recruit teammates from any campus."
          icon={<FolderKanban className="size-6" />}
          action={
            <Button size="sm" data-testid="projects-empty-create-btn" onClick={() => setCreateOpen(true)}>
              Create a project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects!.map((p) => (
            <div
              key={p.id}
              data-testid={`project-card-${p.id}`}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="border-0 bg-violet-500/12 text-[10px] text-violet-300">{p.category}</Badge>
                  <Badge className={cn("border-0 text-[10px]", STATUS_STYLES[p.status])}>
                    {p.status.replace("_", " ")}
                  </Badge>
                </div>
                {p.is_owner && (
                  <button
                    data-testid={`project-delete-btn-${p.id}`}
                    onClick={() => deleteMutation.mutate(p.id)}
                    className="text-slate-500 transition-colors duration-200 hover:text-rose-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <h2 data-testid={`project-title-${p.id}`} className="mt-3 font-heading text-lg font-semibold">
                {p.title}
              </h2>
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-400">{p.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.technologies.slice(0, 6).map((t) => (
                  <span key={t} className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-slate-300">{t}</span>
                ))}
              </div>

              {p.looking_for_roles.length > 0 && (
                <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Looking for</p>
                  <ul className="mt-1.5 space-y-1">
                    {p.looking_for_roles.map((r) => (
                      <li key={r.role_name} className="text-xs text-slate-300">
                        · {r.role_name}
                        {r.skills_needed.length > 0 && (
                          <span className="text-slate-500"> ({r.skills_needed.join(", ")})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2.5 border-t border-white/[0.06] pt-3.5">
                <Avatar src={p.owner_avatar} name={p.owner_name} size="xs" />
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${p.owner_id}`} className="truncate text-xs font-semibold hover:text-violet-300">
                    {p.owner_name}
                  </Link>
                  <p className="truncate text-[10px] text-slate-500">{p.owner_college} · {timeAgo(p.created_at)}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
                  <Users className="size-3" /> {p.team_members.length}
                </span>
              </div>

              {p.team_members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5" data-testid={`project-team-${p.id}`}>
                  {p.team_members.map((m) => (
                    <span
                      key={m.user_id}
                      className="flex items-center gap-1.5 rounded-full bg-white/[0.04] py-0.5 pl-0.5 pr-2.5 text-[10px] text-slate-300"
                    >
                      <Avatar src={m.avatar} name={m.name} size="xs" className="size-5" />
                      {m.name.split(" ")[0]} · {m.role}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {p.github_url && (
                  <a
                    href={p.github_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`project-github-link-${p.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-slate-300 transition-colors duration-200 hover:border-violet-500/40"
                  >
                    <Code2 className="size-3" /> Code
                  </a>
                )}
                {p.demo_url && (
                  <a
                    href={p.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`project-demo-link-${p.id}`}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-slate-300 transition-colors duration-200 hover:border-violet-500/40"
                  >
                    <ExternalLink className="size-3" /> Demo
                  </a>
                )}

                {p.is_owner ? (
                  <>
                    <Button
                      size="sm"
                      className="ml-auto"
                      data-testid={`project-applicants-btn-${p.id}`}
                      onClick={() => setApplicantsProject(p)}
                    >
                      <Users className="mr-1.5 size-3.5" /> Review requests
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      data-testid={`project-status-btn-${p.id}`}
                      onClick={() =>
                        statusMutation.mutate({
                          id: p.id,
                          status: p.status === "recruiting" ? "in_progress" : p.status === "in_progress" ? "completed" : "recruiting",
                        })
                      }
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </>
                ) : p.has_applied ? (
                  <Badge
                    className="ml-auto border-0 bg-amber-500/15 px-3 py-1.5 text-amber-300"
                    data-testid={`project-applied-badge-${p.id}`}
                  >
                    Application sent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="ml-auto"
                    data-testid={`project-apply-btn-${p.id}`}
                    onClick={() => setApplyProject(p)}
                  >
                    <UserPlus className="mr-1.5 size-3.5" /> Request to join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      {applyProject && (
        <ApplyDialog open={!!applyProject} onOpenChange={(o) => !o && setApplyProject(null)} project={applyProject} />
      )}
      {applicantsProject && (
        <ApplicantsDialog
          open={!!applicantsProject}
          onOpenChange={(o) => !o && setApplicantsProject(null)}
          project={applicantsProject}
        />
      )}
    </div>
  );
}
