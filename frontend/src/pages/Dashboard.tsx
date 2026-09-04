import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, CalendarDays, FolderKanban, Video, ArrowRight, Star, Check, X, Building2, Zap,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { greeting, timeAgo, getErrorMessage } from "@/lib/helpers";
import type {
  UserResponse, ConnectionResponse, MeetingResponse, ProjectResponse, PostResponse, CollegeResponse,
} from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SkeletonCard } from "@/components/States";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recommended = [], isLoading: recLoading } = useQuery({
    queryKey: ["discover-students", "dashboard"],
    queryFn: () => apiGet<UserResponse[]>("/search/students?limit=6"),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["connections", "pending_incoming"],
    queryFn: () => apiGet<ConnectionResponse[]>("/connections/my?status_filter=pending_incoming"),
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", "upcoming"],
    queryFn: () => apiGet<MeetingResponse[]>("/meetings/my?status_filter=upcoming"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "recruiting"],
    queryFn: () => apiGet<ProjectResponse[]>("/projects?status=recruiting"),
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["posts", "all"],
    queryFn: () => apiGet<PostResponse[]>("/posts?limit=4"),
  });

  const { data: colleges = [] } = useQuery({
    queryKey: ["colleges"],
    queryFn: () => apiGet<CollegeResponse[]>("/colleges"),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      apiPost(`/connections/${id}/${action}`),
    onSuccess: (_d, v) => {
      toast.success(v.action === "accept" ? "Connection accepted!" : "Request declined");
      void queryClient.invalidateQueries({ queryKey: ["connections"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const STATS = [
    { label: "Connections", value: user?.connections_count ?? 0, icon: Users, testId: "stat-connections" },
    { label: "Reputation", value: (user?.reputation_score ?? 5).toFixed(2), icon: Star, testId: "stat-reputation" },
    { label: "Upcoming meetings", value: meetings.length, icon: CalendarDays, testId: "stat-meetings" },
    { label: "Open projects", value: projects.length, icon: FolderKanban, testId: "stat-projects" },
  ];

  return (
    <div className="space-y-6">
      {/* HERO GREETING */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-violet-600/12 via-[#16101F] to-amber-500/[0.06] p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-violet-500/20 blur-[90px]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">{greeting()}</p>
          <h1 data-testid="dashboard-greeting" className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {user?.full_name.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-400">
            {user?.degree} {user?.branch} · {user?.current_year} at {user?.college}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/meet" data-testid="dashboard-meet-cta">
              <Button size="sm" className="electric-glow">
                <Video className="mr-1.5 size-4" /> Meet Someone
              </Button>
            </Link>
            <Link to="/feed?create=1" className={buttonVariants({ variant: "outline", size: "sm" })} data-testid="dashboard-post-cta">
              <Zap className="mr-1.5 size-4" /> Share an update
            </Link>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            data-testid={s.testId}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
          >
            <s.icon className="size-4 text-violet-400" />
            <p className="mt-3 font-heading text-2xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* CONNECTION REQUESTS */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Connection requests</h2>
              <Link to="/connections" data-testid="dashboard-connections-link" className="text-xs text-violet-400 hover:text-violet-300">
                Manage network
              </Link>
            </div>
            {requests.length === 0 ? (
              <EmptyState
                testId="dashboard-requests-empty"
                title="No pending requests"
                description="When students want to connect with you, they'll appear here."
                icon={<Users className="size-6" />}
              />
            ) : (
              <div className="space-y-2.5">
                {requests.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    data-testid={`dashboard-request-${r.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                  >
                    <Avatar src={r.other_user?.avatar_url} name={r.other_user?.full_name ?? "Student"} size="md" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${r.other_user?.id}`}
                        className="truncate font-heading text-sm font-semibold hover:text-violet-300"
                      >
                        {r.other_user?.full_name}
                      </Link>
                      <p className="truncate text-xs text-slate-400">{r.other_user?.college}</p>
                      {r.note && <p className="mt-1 line-clamp-1 text-[11px] italic text-slate-500">"{r.note}"</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="icon-sm"
                        data-testid={`dashboard-accept-btn-${r.id}`}
                        onClick={() => respondMutation.mutate({ id: r.id, action: "accept" })}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        data-testid={`dashboard-reject-btn-${r.id}`}
                        onClick={() => respondMutation.mutate({ id: r.id, action: "reject" })}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RECENT POSTS */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Recent from your network</h2>
              <Link to="/feed" data-testid="dashboard-feed-link" className="text-xs text-violet-400 hover:text-violet-300">
                Open feed
              </Link>
            </div>
            {postsLoading ? (
              <SkeletonCard />
            ) : posts.length === 0 ? (
              <EmptyState testId="dashboard-posts-empty" title="The feed is quiet" description="Share the first update with your campus." />
            ) : (
              <div className="space-y-2.5">
                {posts.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    to="/feed"
                    data-testid={`dashboard-post-${p.id}`}
                    className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={p.author_avatar} name={p.author_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.author_name}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {p.author_college} · {timeAgo(p.created_at)}
                        </p>
                      </div>
                      <Badge className="shrink-0 border-0 bg-violet-500/10 text-[10px] text-violet-300">{p.category}</Badge>
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-sm text-slate-300">{p.content}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* PROJECT OPPORTUNITIES */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Project opportunities</h2>
              <Link to="/projects" data-testid="dashboard-projects-link" className="text-xs text-violet-400 hover:text-violet-300">
                Browse all
              </Link>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                testId="dashboard-projects-empty"
                title="No open projects right now"
                description="Create one and start recruiting teammates from any campus."
                icon={<FolderKanban className="size-6" />}
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {projects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects?id=${p.id}`}
                    data-testid={`dashboard-project-${p.id}`}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <Badge className="mb-2 border-0 bg-amber-500/10 text-[10px] text-amber-300">{p.category}</Badge>
                    <p className="truncate font-heading text-sm font-semibold">{p.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{p.description}</p>
                    {p.looking_for_roles.length > 0 && (
                      <p className="mt-2.5 text-[11px] text-violet-400">
                        Hiring: {p.looking_for_roles.map((r) => r.role_name).join(", ")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT PANEL */}
        <aside className="space-y-6">
          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Recommended students</h2>
            {recLoading ? (
              <SkeletonCard />
            ) : recommended.length === 0 ? (
              <EmptyState
                testId="dashboard-recommended-empty"
                title="No recommendations yet"
                description="Discover students who share your interests."
              />
            ) : (
              <div className="space-y-2.5">
                {recommended.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    to={`/profile/${s.id}`}
                    data-testid={`dashboard-recommended-${s.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <Avatar src={s.avatar_url} name={s.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.full_name}</p>
                      <p className="truncate text-[11px] text-slate-500">{s.college}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-amber-400">
                      <Star className="size-3 fill-current" /> {s.reputation_score.toFixed(1)}
                    </span>
                  </Link>
                ))}
                <Link
                  to="/discover"
                  data-testid="dashboard-discover-link"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2.5 text-xs font-semibold text-violet-400 transition-colors duration-200 hover:bg-violet-500/[0.06]"
                >
                  Discover more students <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Upcoming meetings</h2>
            {meetings.length === 0 ? (
              <EmptyState
                testId="dashboard-meetings-empty"
                title="No upcoming meetings"
                description="Book a slot with a student to talk projects or careers."
                icon={<CalendarDays className="size-6" />}
                action={
                  <Link to="/meetings" className={buttonVariants({ size: "sm", variant: "outline" })} data-testid="dashboard-meetings-cta">
                    Open scheduler
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {meetings.slice(0, 3).map((m) => (
                  <Link
                    key={m.id}
                    to="/meetings"
                    data-testid={`dashboard-meeting-${m.id}`}
                    className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors duration-300 hover:border-violet-500/25"
                  >
                    <p className="truncate text-sm font-semibold">{m.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-violet-400">
                      {m.meeting_date} · {m.start_time}–{m.end_time}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      with {m.host_id === user?.id ? m.guest_name : m.host_name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Suggested communities</h2>
            <div className="space-y-2.5">
              {colleges.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  to={`/communities?id=${c.id}`}
                  data-testid={`dashboard-college-${c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors duration-300 hover:border-violet-500/25"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-400">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.short_name}</p>
                    <p className="truncate text-[11px] text-slate-500">{c.student_count.toLocaleString()} students</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
