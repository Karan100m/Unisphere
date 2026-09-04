import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, FileText, MessageSquare, Video, Flag, ShieldOff, FolderKanban,
  UserPlus, Check, X, Trash2, ArrowLeft, Ban, ShieldCheck,
} from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, timeAgo } from "@/lib/helpers";
import type { AdminStatsResponse, ReportResponse, UserResponse, PostResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  reviewed: "bg-amber-500/15 text-amber-300",
  dismissed: "bg-white/[0.08] text-slate-400",
  action_taken: "bg-emerald-500/15 text-emerald-300",
};

function BarChart({ data }: { data: AdminStatsResponse["activity_timeline"] }) {
  const max = Math.max(...data.map((d) => Math.max(d.active_users, d.posts, d.calls)), 1);
  return (
    <div data-testid="admin-activity-chart" className="flex h-40 items-end gap-2.5">
      {data.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-32 w-full items-end justify-center gap-0.5">
            <div
              className="w-1/3 rounded-t bg-violet-500 transition-[height] duration-500"
              style={{ height: `${(d.active_users / max) * 100}%` }}
              title={`${d.active_users} active users`}
            />
            <div
              className="w-1/3 rounded-t bg-amber-400 transition-[height] duration-500"
              style={{ height: `${(d.posts / max) * 100}%` }}
              title={`${d.posts} posts`}
            />
            <div
              className="w-1/3 rounded-t bg-emerald-400 transition-[height] duration-500"
              style={{ height: `${(d.calls / max) * 100}%` }}
              title={`${d.calls} calls`}
            />
          </div>
          <span className="text-[10px] text-slate-500">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [reportFilter, setReportFilter] = useState("pending");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<AdminStatsResponse>("/admin/stats"),
    enabled: user?.role === "admin",
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports", reportFilter],
    queryFn: () => apiGet<ReportResponse[]>(`/admin/reports?status_filter=${reportFilter}`),
    enabled: user?.role === "admin",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiGet<UserResponse[]>("/admin/users"),
    enabled: user?.role === "admin",
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "admin"],
    queryFn: () => apiGet<PostResponse[]>("/posts?limit=30"),
    enabled: user?.role === "admin",
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "action_taken" | "dismissed" }) =>
      apiPost(`/admin/reports/${id}/resolve?action=${action}&action_notes=Reviewed by admin`),
    onSuccess: (_d, v) => {
      toast.success(v.action === "action_taken" ? "Action recorded on this report" : "Report dismissed");
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "suspend" | "unsuspend" }) =>
      apiPost(`/admin/users/${id}/moderation`, { action, reason: "Community guidelines" }),
    onSuccess: (d) => {
      toast.success((d as { message: string }).message);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/posts/${id}`),
    onSuccess: () => {
      toast.success("Post removed by moderation");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (authLoading) return <LoadingState label="Verifying admin access…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldOff className="mx-auto size-10 text-rose-400" />
        <h1 data-testid="admin-access-denied" className="mt-4 font-heading text-xl font-bold">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          This dashboard is restricted to platform administrators.
        </p>
        <Link to="/dashboard">
          <Button className="mt-6" data-testid="admin-back-btn">
            <ArrowLeft className="mr-1.5 size-4" /> Back to my dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const METRICS = [
    { label: "Total users", value: stats?.total_users ?? 0, icon: Users, testId: "admin-metric-users" },
    { label: "Active users", value: stats?.active_users ?? 0, icon: ShieldCheck, testId: "admin-metric-active" },
    { label: "New this week", value: stats?.new_registrations_this_week ?? 0, icon: UserPlus, testId: "admin-metric-new" },
    { label: "Posts", value: stats?.total_posts ?? 0, icon: FileText, testId: "admin-metric-posts" },
    { label: "Messages", value: stats?.total_messages ?? 0, icon: MessageSquare, testId: "admin-metric-messages" },
    { label: "Video calls", value: stats?.total_video_calls ?? 0, icon: Video, testId: "admin-metric-calls" },
    { label: "Projects", value: stats?.total_projects ?? 0, icon: FolderKanban, testId: "admin-metric-projects" },
    { label: "Pending reports", value: stats?.pending_reports ?? 0, icon: Flag, testId: "admin-metric-reports" },
    { label: "Suspended", value: stats?.suspended_accounts ?? 0, icon: Ban, testId: "admin-metric-suspended" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 border-rose-500/30 bg-rose-500/10 text-rose-300">Restricted</Badge>
        <h1 data-testid="admin-heading" className="font-heading text-2xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-400">Platform health, moderation queue and user management.</p>
      </div>

      {/* METRICS */}
      {statsLoading ? (
        <LoadingState label="Loading platform metrics…" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {METRICS.map((m) => (
            <div
              key={m.label}
              data-testid={m.testId}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
            >
              <m.icon className="size-4 text-violet-400" />
              <p className="mt-3 font-heading text-2xl font-bold">{m.value.toLocaleString()}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="analytics">
        <TabsList variant="line" className="w-full overflow-x-auto" data-testid="admin-tabs">
          <TabsTrigger value="analytics" data-testid="admin-tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports" data-testid="admin-tab-reports">Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-tab-users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="posts" data-testid="admin-tab-posts">Posts ({posts.length})</TabsTrigger>
        </TabsList>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-5 space-y-4">
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">7-day activity</h2>
              <div className="flex gap-3 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-violet-500" /> Active users</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-400" /> Posts</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-emerald-400" /> Calls</span>
              </div>
            </div>
            <div className="mt-5">
              {stats?.activity_timeline && stats.activity_timeline.length > 0 ? (
                <BarChart data={stats.activity_timeline} />
              ) : (
                <EmptyState testId="admin-chart-empty" title="No activity data yet" />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <h2 className="font-heading text-base font-semibold">Projects by category</h2>
            <div data-testid="admin-category-chart" className="mt-5 space-y-3">
              {Object.entries(stats?.category_distribution ?? {}).map(([cat, count]) => {
                const max = Math.max(...Object.values(stats?.category_distribution ?? { a: 1 }), 1);
                return (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-300">{cat}</span>
                      <span className="font-mono text-violet-400">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-[width] duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {["pending", "action_taken", "dismissed", "all"].map((f) => (
              <button
                key={f}
                data-testid={`admin-report-filter-${f}`}
                onClick={() => setReportFilter(f)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors duration-200",
                  reportFilter === f
                    ? "border-violet-500/60 bg-violet-500/10 text-violet-200"
                    : "border-white/[0.08] text-slate-400 hover:border-white/20",
                )}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {reports.length === 0 ? (
            <EmptyState
              testId="admin-reports-empty"
              title="No reports in this queue"
              description="Reported users, posts, comments and stories appear here for review."
              icon={<Flag className="size-6" />}
            />
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                data-testid={`admin-report-${r.id}`}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-white/[0.06] text-[10px] capitalize text-slate-300">
                        {r.target_type}
                      </Badge>
                      <Badge className={cn("border-0 text-[10px]", STATUS_STYLES[r.status])}>
                        {r.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p data-testid={`admin-report-reason-${r.id}`} className="mt-2.5 text-sm font-semibold">
                      {r.reason}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Target: {r.target_name || r.target_id}</p>
                    {r.details && <p className="mt-1.5 text-xs italic text-slate-500">"{r.details}"</p>}
                    <p className="mt-2 text-[11px] text-slate-500">
                      Reported by {r.reporter_name} · {timeAgo(r.created_at)}
                    </p>
                    {r.action_notes && (
                      <p className="mt-1.5 text-[11px] text-emerald-400">Notes: {r.action_notes}</p>
                    )}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      data-testid={`admin-report-action-btn-${r.id}`}
                      onClick={() => resolveMutation.mutate({ id: r.id, action: "action_taken" })}
                    >
                      <Check className="mr-1.5 size-3.5" /> Take action
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`admin-report-dismiss-btn-${r.id}`}
                      onClick={() => resolveMutation.mutate({ id: r.id, action: "dismissed" })}
                    >
                      <X className="mr-1.5 size-3.5" /> Dismiss
                    </Button>
                    {r.target_type === "post" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`admin-report-delete-post-btn-${r.id}`}
                        onClick={() => deletePostMutation.mutate(r.target_id)}
                      >
                        <Trash2 className="mr-1.5 size-3.5" /> Remove post
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="mt-5 space-y-2.5">
          {users.length === 0 ? (
            <EmptyState testId="admin-users-empty" title="No users found" />
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                data-testid={`admin-user-${u.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <Avatar src={u.avatar_url} name={u.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/profile/${u.id}`} className="truncate text-sm font-semibold hover:text-violet-300">
                      {u.full_name}
                    </Link>
                    {u.role === "admin" && (
                      <Badge className="border-0 bg-rose-500/15 text-[10px] text-rose-300">Admin</Badge>
                    )}
                    {u.is_suspended && (
                      <Badge className="border-0 bg-amber-500/15 text-[10px] text-amber-300" data-testid={`admin-user-suspended-${u.id}`}>
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">{u.email}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {u.college} · {u.connections_count} connections · ★ {u.reputation_score.toFixed(2)}
                  </p>
                </div>
                {u.role !== "admin" && (
                  <Button
                    size="sm"
                    variant={u.is_suspended ? "outline" : "destructive"}
                    data-testid={`admin-user-moderate-btn-${u.id}`}
                    onClick={() => moderateMutation.mutate({ id: u.id, action: u.is_suspended ? "unsuspend" : "suspend" })}
                  >
                    {u.is_suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* POSTS */}
        <TabsContent value="posts" className="mt-5 space-y-2.5">
          {posts.length === 0 ? (
            <EmptyState testId="admin-posts-empty" title="No posts on the platform" />
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                data-testid={`admin-post-${p.id}`}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar src={p.author_avatar} name={p.author_name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{p.author_name}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {p.author_college} · {timeAgo(p.created_at)}
                    </p>
                  </div>
                  {p.is_reported && (
                    <Badge className="border-0 bg-rose-500/15 text-[10px] text-rose-300">Reported</Badge>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    data-testid={`admin-post-delete-btn-${p.id}`}
                    onClick={() => deletePostMutation.mutate(p.id)}
                  >
                    <Trash2 className="size-4 text-slate-500" />
                  </Button>
                </div>
                <p className="mt-2.5 line-clamp-2 text-sm text-slate-300">{p.content}</p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {p.likes_count} likes · {p.comments_count} comments
                </p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
