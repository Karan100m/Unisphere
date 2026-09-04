import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Ban, LogOut, Check, ShieldCheck, Mail } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/helpers";
import type { PrivacySettings, BlockedUserResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState, LoadingState } from "@/components/States";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const PRIVACY_ROWS = [
  {
    key: "who_can_message" as const,
    label: "Who can message me",
    options: [
      { value: "everyone", label: "Everyone" },
      { value: "connections", label: "My connections only" },
      { value: "none", label: "No one" },
    ],
  },
  {
    key: "who_can_connect" as const,
    label: "Who can send connection requests",
    options: [
      { value: "everyone", label: "Everyone" },
      { value: "same_college", label: "Students from my college" },
    ],
  },
  {
    key: "who_can_call" as const,
    label: "Who can video call me",
    options: [
      { value: "everyone", label: "Everyone" },
      { value: "connections", label: "My connections only" },
    ],
  },
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [privacy, setPrivacy] = useState<PrivacySettings>(
    user?.privacy ?? {
      who_can_message: "everyone",
      who_can_connect: "everyone",
      who_can_call: "everyone",
      is_profile_public: true,
      show_email: false,
    },
  );

  const { data: blocked = [], isLoading: blockedLoading } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => apiGet<BlockedUserResponse[]>("/safety/blocked-users"),
  });

  const saveMutation = useMutation({
    mutationFn: () => apiPut<PrivacySettings>("/users/me/privacy", privacy),
    onSuccess: async () => {
      toast.success("Privacy settings saved");
      await refreshUser();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => apiPost("/safety/unblock", { blocked_user_id: id }),
    onSuccess: () => {
      toast.success("User unblocked");
      void queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiPost("/auth/verify-email"),
    onSuccess: async () => {
      toast.success("Email verified");
      await refreshUser();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 data-testid="settings-heading" className="font-heading text-2xl font-bold tracking-tight">
          Settings & Privacy
        </h1>
        <p className="mt-1 text-sm text-slate-400">Control who can reach you and what other students can see.</p>
      </div>

      {/* ACCOUNT */}
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Account</h2>
        <div className="mt-4 flex items-center gap-3">
          <Avatar src={user?.avatar_url} name={user?.full_name ?? "You"} size="lg" />
          <div className="min-w-0 flex-1">
            <p data-testid="settings-user-name" className="font-heading text-base font-semibold">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.college}</p>
          </div>
          {user?.is_verified ? (
            <span
              data-testid="settings-verified-badge"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300"
            >
              <ShieldCheck className="size-3.5" /> Verified
            </span>
          ) : (
            <Button size="sm" variant="outline" data-testid="settings-verify-email-btn" onClick={() => verifyMutation.mutate()}>
              <Mail className="mr-1.5 size-3.5" /> Verify email
            </Button>
          )}
        </div>
      </section>

      {/* PRIVACY */}
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Privacy controls</h2>

        <div className="mt-4 space-y-4">
          {PRIVACY_ROWS.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <Label>{row.label}</Label>
              <Select
                value={privacy[row.key]}
                onValueChange={(v: string) => setPrivacy((p) => ({ ...p, [row.key]: v }))}
              >
                <SelectTrigger data-testid={`privacy-${row.key}-select`}>
                  <SelectValue>
                    {(v) => row.options.find((o) => o.value === v)?.label ?? "Select"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {row.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-sm font-medium">Public profile</p>
              <p className="text-[11px] text-slate-500">Allow any student to view your full profile</p>
            </div>
            <Switch
              data-testid="privacy-profile-public-switch"
              checked={privacy.is_profile_public}
              onCheckedChange={(v) => setPrivacy((p) => ({ ...p, is_profile_public: v }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show my email address</p>
              <p className="text-[11px] text-slate-500">Hidden by default for your safety</p>
            </div>
            <Switch
              data-testid="privacy-show-email-switch"
              checked={privacy.show_email}
              onCheckedChange={(v) => setPrivacy((p) => ({ ...p, show_email: v }))}
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          data-testid="privacy-save-btn"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "Saving…" : <><Check className="mr-1.5 size-4" /> Save privacy settings</>}
        </Button>
      </section>

      {/* BLOCKED USERS */}
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Blocked students</h2>

        <div className="mt-4">
          {blockedLoading ? (
            <LoadingState label="Loading blocked list…" />
          ) : blocked.length === 0 ? (
            <EmptyState
              testId="blocked-users-empty"
              title="You haven't blocked anyone"
              description="Blocked students can't message, call or connect with you."
              icon={<Ban className="size-6" />}
            />
          ) : (
            <div className="space-y-2.5">
              {blocked.map((b) => (
                <div
                  key={b.blocked_user_id}
                  data-testid={`blocked-user-${b.blocked_user_id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
                >
                  <Avatar src={b.avatar_url} name={b.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.full_name}</p>
                    <p className="truncate text-[11px] text-slate-500">{b.college}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`unblock-btn-${b.blocked_user_id}`}
                    onClick={() => unblockMutation.mutate(b.blocked_user_id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ADMIN + LOGOUT */}
      {user?.role === "admin" && (
        <Button
          variant="outline"
          className="w-full"
          data-testid="settings-admin-link-btn"
          onClick={() => navigate("/admin")}
        >
          <Shield className="mr-1.5 size-4" /> Open Admin Dashboard
        </Button>
      )}

      <Button
        variant="destructive"
        className="w-full"
        data-testid="settings-logout-btn"
        onClick={async () => {
          await logout();
          navigate("/");
        }}
      >
        <LogOut className="mr-1.5 size-4" /> Log out
      </Button>
    </div>
  );
}
