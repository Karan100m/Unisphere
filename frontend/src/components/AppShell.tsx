import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home, Compass, Video, MessageSquare, FolderKanban, CalendarDays, Building2,
  Bell, Search, LogOut, Settings, Shield, User, Plus, Zap, Users,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/helpers";
import type { NotificationResponse, CallSessionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/States";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home, testId: "nav-home" },
  { to: "/feed", label: "Feed", icon: Zap, testId: "nav-feed" },
  { to: "/discover", label: "Discover", icon: Compass, testId: "nav-discover" },
  { to: "/meet", label: "Meet Someone", icon: Video, testId: "nav-meet" },
  { to: "/messages", label: "Messages", icon: MessageSquare, testId: "nav-messages" },
  { to: "/projects", label: "Projects", icon: FolderKanban, testId: "nav-projects" },
  { to: "/meetings", label: "Meetings", icon: CalendarDays, testId: "nav-meetings" },
  { to: "/communities", label: "Communities", icon: Building2, testId: "nav-communities" },
  { to: "/connections", label: "Network", icon: Users, testId: "nav-connections" },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: Home, testId: "mobile-nav-home" },
  { to: "/discover", label: "Discover", icon: Compass, testId: "mobile-nav-discover" },
  { to: "/feed?create=1", label: "Create", icon: Plus, testId: "mobile-nav-create" },
  { to: "/messages", label: "Chats", icon: MessageSquare, testId: "mobile-nav-messages" },
  { to: "/profile/me", label: "Profile", icon: User, testId: "mobile-nav-profile" },
];

function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<NotificationResponse[]>("/notifications"),
    refetchInterval: 15000,
  });

  const unread = notifs.filter((n) => !n.is_read).length;

  const readAll = useMutation({
    mutationFn: () => apiPost("/notifications/read-all"),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readOne = useMutation({
    mutationFn: (id: string) => apiPost(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        data-testid="notification-bell-btn"
        className="relative grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 transition-colors duration-200 hover:border-violet-500/40 hover:text-violet-300"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
          >
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] max-w-[92vw] glass-dropdown p-0">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <p className="font-heading text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              data-testid="notifications-mark-all-read-btn"
              onClick={() => readAll.mutate()}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {notifs.length === 0 ? (
            <p data-testid="notifications-empty" className="px-4 py-8 text-center text-sm text-slate-400">
              You're all caught up. No new notifications.
            </p>
          ) : (
            notifs.slice(0, 12).map((n) => (
              <button
                key={n.id}
                data-testid={`notification-item-${n.id}`}
                onClick={() => {
                  if (!n.is_read) readOne.mutate(n.id);
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
                className={cn(
                  "flex w-full gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors duration-200 hover:bg-white/[0.04]",
                  !n.is_read && "bg-violet-500/[0.06]",
                )}
              >
                <Avatar src={n.actor_avatar} name={n.actor_name || "Unisphere"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-100">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-slate-400">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-1 size-2 shrink-0 rounded-full bg-violet-400" />}
              </button>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          data-testid="notifications-view-all-link"
          onClick={() => setOpen(false)}
          className="block border-t border-white/[0.08] px-4 py-2.5 text-center text-xs font-semibold text-violet-400 hover:text-violet-300"
        >
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function IncomingCallBanner() {
  const navigate = useNavigate();
  const { data: activeCall } = useQuery({
    queryKey: ["active-call"],
    queryFn: () => apiGet<CallSessionResponse | null>("/calls/active"),
    refetchInterval: 8000,
  });

  if (!activeCall) return null;

  return (
    <div
      data-testid="incoming-call-banner"
      className="fixed left-1/2 top-4 z-[70] w-[min(94vw,420px)] -translate-x-1/2 rounded-2xl border border-violet-500/40 bg-[#16101F]/95 p-4 shadow-2xl backdrop-blur-xl electric-glow"
    >
      <div className="flex items-center gap-3">
        <Avatar src={activeCall.caller_avatar} name={activeCall.caller_name} size="md" ring />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold">{activeCall.caller_name}</p>
          <p className="text-xs text-slate-400">Incoming {activeCall.call_type} call…</p>
        </div>
        <Button
          size="sm"
          data-testid="incoming-call-accept-btn"
          onClick={() => navigate(`/calls/${activeCall.call_id}`)}
        >
          Answer
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");

  if (isLoading) return <LoadingState label="Loading your campus…" className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const isActive = (to: string) => location.pathname === to.split("?")[0];

  return (
    <div className="min-h-screen bg-[#0B0713]">
      <IncomingCallBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0713]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-6">
          <Link to="/dashboard" data-testid="brand-logo-link" className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 font-heading text-sm font-black text-white">
              U
            </div>
            <span className="hidden font-heading text-lg font-bold tracking-tight sm:block">
              Uni<span className="text-amber-400">sphere</span>
            </span>
          </Link>

          <form
            className="relative ml-auto w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(searchQ)}`);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              data-testid="global-search-input"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search students, colleges, projects…"
              className="h-10 rounded-xl border-white/[0.08] bg-white/[0.03] pl-9 text-sm"
            />
          </form>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger data-testid="user-menu-trigger" className="rounded-full">
              <Avatar src={user.avatar_url} name={user.full_name} size="sm" ring />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 glass-dropdown">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-semibold" data-testid="user-menu-name">{user.full_name}</p>
                <p className="truncate text-xs text-slate-400">{user.college}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="user-menu-profile" onClick={() => navigate("/profile/me")}>
                <User className="mr-2 size-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="user-menu-settings" onClick={() => navigate("/settings")}>
                <Settings className="mr-2 size-4" /> Settings & Privacy
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem data-testid="user-menu-admin" onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 size-4" /> Admin Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="user-menu-logout"
                variant="destructive"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                <LogOut className="mr-2 size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 lg:px-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col gap-1 overflow-y-auto py-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive(item.to)
                  ? "bg-violet-500/12 text-violet-300"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          ))}
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-amber-500/[0.04] p-4">
            <Badge className="mb-2 bg-violet-500/20 text-violet-200">Spontaneous</Badge>
            <p className="font-heading text-sm font-semibold leading-snug">
              Meet a student from another campus right now
            </p>
            <Link to="/meet" data-testid="sidebar-meet-cta">
              <Button size="sm" className="mt-3 w-full">
                Start matching
              </Button>
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 pt-5 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        data-testid="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0E0917]/95 backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.to);
            const isCreate = item.label === "Create";
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={item.testId}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors duration-200",
                  active ? "text-violet-400" : "text-slate-500",
                )}
              >
                {isCreate ? (
                  <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-amber-400 text-white">
                    <item.icon className="size-4" />
                  </span>
                ) : (
                  <item.icon className="size-[18px]" />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
