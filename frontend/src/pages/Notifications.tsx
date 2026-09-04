import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { timeAgo } from "@/lib/helpers";
import type { NotificationResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/States";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  connection_request: "Connection",
  connection_accepted: "Connection",
  message: "Message",
  incoming_call: "Call",
  post_like: "Like",
  post_comment: "Comment",
  story_reply: "Story",
  project_request: "Project",
  project_accepted: "Project",
  meeting_booked: "Meeting",
  meeting_cancelled: "Meeting",
  reputation_endorsed: "Endorsement",
  system_warning: "Safety",
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<NotificationResponse[]>("/notifications"),
  });

  const readAll = useMutation({
    mutationFn: () => apiPost("/notifications/read-all"),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readOne = useMutation({
    mutationFn: (id: string) => apiPost(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 data-testid="notifications-heading" className="font-heading text-2xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" data-testid="notifications-page-read-all-btn" onClick={() => readAll.mutate()}>
            <CheckCheck className="mr-1.5 size-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading notifications…" />
      ) : notifs.length === 0 ? (
        <EmptyState
          testId="notifications-page-empty"
          title="No notifications yet"
          description="Connection requests, likes, comments, project applications and meeting bookings all land here."
          icon={<Bell className="size-6" />}
        />
      ) : (
        <div className="space-y-2.5">
          {notifs.map((n) => (
            <button
              key={n.id}
              data-testid={`notification-page-item-${n.id}`}
              onClick={() => {
                if (!n.is_read) readOne.mutate(n.id);
                if (n.link) navigate(n.link);
              }}
              className={cn(
                "flex w-full gap-3 rounded-2xl border p-4 text-left transition-colors duration-300",
                n.is_read
                  ? "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
                  : "border-violet-500/25 bg-violet-500/[0.06] hover:border-violet-500/45",
              )}
            >
              <Avatar src={n.actor_avatar} name={n.actor_name || "Unisphere"} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-100">{n.title}</p>
                  <Badge className="border-0 bg-white/[0.06] text-[10px] text-slate-400">
                    {TYPE_LABELS[n.type] ?? "Update"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{n.message}</p>
                <p className="mt-1.5 text-[11px] text-slate-500">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-violet-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
