import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Check, X, UserMinus, Clock } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { getErrorMessage, timeAgo } from "@/lib/helpers";
import type { ConnectionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  { value: "accepted", label: "Connections" },
  { value: "pending_incoming", label: "Requests" },
  { value: "pending_outgoing", label: "Sent" },
];

export default function Connections() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["connections"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      apiPost(`/connections/${id}/${action}`),
    onSuccess: (_d, v) => {
      toast.success(v.action === "accept" ? "You're now connected!" : "Request declined");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/connections/${id}`),
    onSuccess: () => {
      toast.success("Connection removed");
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 data-testid="connections-heading" className="font-heading text-2xl font-bold tracking-tight">
          My Network
        </h1>
        <p className="mt-1 text-sm text-slate-400">Manage your connections and respond to incoming requests.</p>
      </div>

      <Tabs defaultValue="accepted">
        <TabsList variant="line" className="w-full" data-testid="connections-tabs">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} data-testid={`connections-tab-${t.value}`}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-5">
            <ConnectionList
              statusFilter={t.value}
              onAccept={(id) => respondMutation.mutate({ id, action: "accept" })}
              onReject={(id) => respondMutation.mutate({ id, action: "reject" })}
              onRemove={(id) => removeMutation.mutate(id)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ConnectionList({
  statusFilter, onAccept, onReject, onRemove,
}: {
  statusFilter: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { data: conns = [], isLoading } = useQuery({
    queryKey: ["connections", statusFilter],
    queryFn: () => apiGet<ConnectionResponse[]>(`/connections/my?status_filter=${statusFilter}`),
  });

  if (isLoading) return <LoadingState label="Loading your network…" />;

  if (conns.length === 0) {
    return (
      <EmptyState
        testId={`connections-empty-${statusFilter}`}
        title={
          statusFilter === "accepted"
            ? "No connections yet"
            : statusFilter === "pending_incoming"
              ? "No pending requests"
              : "No sent requests"
        }
        description="Discover students who share your interests and send the first request."
        icon={<Users className="size-6" />}
        action={
          <Link to="/discover" className={buttonVariants({ size: "sm" })} data-testid={`connections-discover-cta-${statusFilter}`}>
            Discover students
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {conns.map((c) => (
        <div
          key={c.id}
          data-testid={`connection-item-${c.id}`}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-violet-500/25"
        >
          <Avatar src={c.other_user?.avatar_url} name={c.other_user?.full_name ?? "Student"} size="md" />
          <div className="min-w-0 flex-1">
            <Link
              to={`/profile/${c.other_user?.id}`}
              data-testid={`connection-name-${c.id}`}
              className="truncate font-heading text-sm font-semibold hover:text-violet-300"
            >
              {c.other_user?.full_name}
            </Link>
            <p className="truncate text-xs text-slate-400">{c.other_user?.college}</p>
            <p className="truncate text-[11px] text-slate-500">
              {c.other_user?.degree} {c.other_user?.branch} · {timeAgo(c.updated_at)}
            </p>
            {c.note && <p className="mt-1 line-clamp-1 text-[11px] italic text-slate-500">"{c.note}"</p>}
          </div>

          <div className="flex shrink-0 gap-2">
            {statusFilter === "pending_incoming" ? (
              <>
                <Button size="sm" data-testid={`connection-accept-btn-${c.id}`} onClick={() => onAccept(c.id)}>
                  <Check className="mr-1.5 size-3.5" /> Accept
                </Button>
                <Button size="icon-sm" variant="outline" data-testid={`connection-reject-btn-${c.id}`} onClick={() => onReject(c.id)}>
                  <X className="size-4" />
                </Button>
              </>
            ) : statusFilter === "pending_outgoing" ? (
              <>
                <span className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-300">
                  <Clock className="size-3" /> Pending
                </span>
                <Button size="icon-sm" variant="outline" data-testid={`connection-withdraw-btn-${c.id}`} onClick={() => onRemove(c.id)}>
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={`/profile/${c.other_user?.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  data-testid={`connection-view-btn-${c.id}`}
                >
                  View profile
                </Link>
                <Button size="icon-sm" variant="ghost" data-testid={`connection-remove-btn-${c.id}`} onClick={() => onRemove(c.id)}>
                  <UserMinus className="size-4 text-slate-500" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
