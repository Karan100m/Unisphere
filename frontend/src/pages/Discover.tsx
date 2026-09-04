import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, UserPlus, MessageSquare, Video, Star, Filter, X, Clock } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  getErrorMessage, COLLEGE_OPTIONS, DEGREE_OPTIONS, YEAR_OPTIONS,
  BRANCH_OPTIONS, SKILL_OPTIONS, INTEREST_OPTIONS,
} from "@/lib/helpers";
import type { UserResponse, ConversationResponse, CallSessionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/States";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const ALL = "all";

export function StudentCard({ student }: { student: UserResponse }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: connStatus } = useQuery({
    queryKey: ["connection-status", student.id],
    queryFn: () => apiGet<{ status: string; connection_id?: string }>(`/connections/status/${student.id}`),
    enabled: !!user && user.id !== student.id,
  });

  const connectMutation = useMutation({
    mutationFn: () => apiPost("/connections/request", { recipient_id: student.id, note: "" }),
    onSuccess: () => {
      toast.success(`Connection request sent to ${student.full_name.split(" ")[0]}!`);
      void queryClient.invalidateQueries({ queryKey: ["connection-status", student.id] });
      void queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const messageMutation = useMutation({
    mutationFn: () => apiPost<ConversationResponse>(`/conversations/get-or-create/${student.id}`),
    onSuccess: (conv) => navigate(`/messages?conv=${conv.id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const callMutation = useMutation({
    mutationFn: () => apiPost<CallSessionResponse>("/calls/initiate", { recipient_id: student.id, call_type: "video" }),
    onSuccess: (call) => navigate(`/calls/${call.call_id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const status = connStatus?.status ?? "none";

  return (
    <div
      data-testid={`student-card-${student.id}`}
      className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
    >
      <div className="flex items-start gap-3">
        <Link to={`/profile/${student.id}`}>
          <Avatar src={student.avatar_url} name={student.full_name} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${student.id}`}
            data-testid={`student-name-${student.id}`}
            className="block truncate font-heading text-base font-semibold hover:text-violet-300"
          >
            {student.full_name}
          </Link>
          <p className="truncate text-xs text-slate-400">{student.college}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {student.degree} {student.branch} · {student.current_year}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-0.5 text-amber-400">
              <Star className="size-3 fill-current" /> {student.reputation_score.toFixed(2)}
            </span>
            <span className="text-slate-500">{student.connections_count} connections</span>
          </div>
        </div>
      </div>

      {student.bio && <p className="mt-3.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{student.bio}</p>}

      {student.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {student.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-violet-500/[0.09] px-2 py-0.5 text-[10px] text-violet-300">
              {s}
            </span>
          ))}
        </div>
      )}

      {student.interests.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {student.interests.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-amber-500/[0.09] px-2 py-0.5 text-[10px] text-amber-300">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-4">
        {status === "connected" ? (
          <Badge className="flex-1 justify-center border-0 bg-emerald-500/15 py-1.5 text-emerald-300" data-testid={`student-connected-badge-${student.id}`}>
            Connected
          </Badge>
        ) : status === "pending_sent" || status === "pending_received" ? (
          <Badge className="flex-1 justify-center border-0 bg-amber-500/15 py-1.5 text-amber-300" data-testid={`student-pending-badge-${student.id}`}>
            <Clock className="mr-1 size-3" /> Pending
          </Badge>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            data-testid={`student-connect-btn-${student.id}`}
            disabled={connectMutation.isPending}
            onClick={() => connectMutation.mutate()}
          >
            <UserPlus className="mr-1.5 size-3.5" /> Connect
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="outline"
          data-testid={`student-message-btn-${student.id}`}
          disabled={messageMutation.isPending}
          onClick={() => messageMutation.mutate()}
        >
          <MessageSquare className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          data-testid={`student-call-btn-${student.id}`}
          disabled={callMutation.isPending}
          onClick={() => callMutation.mutate()}
        >
          <Video className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Discover() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    college: ALL,
    degree: ALL,
    branch: ALL,
    year: ALL,
    skill: ALL,
    interest: ALL,
    sort_by: "reputation",
  });

  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== ALL) params.set(k, v);
  });

  const { data: students, isLoading, isError } = useQuery({
    queryKey: ["discover-students", params.toString()],
    queryFn: () => apiGet<UserResponse[]>(`/search/students?${params.toString()}`),
  });

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "sort_by" && v !== ALL).length;

  const reset = () =>
    setFilters({ college: ALL, degree: ALL, branch: ALL, year: ALL, skill: ALL, interest: ALL, sort_by: "reputation" });

  return (
    <div className="space-y-5">
      <div>
        <h1 data-testid="discover-heading" className="font-heading text-2xl font-bold tracking-tight">
          Discover Students
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Filter by campus, major, year, skills and interests to find exactly who you need.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            data-testid="discover-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, interest or campus…"
            className="h-11 pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className="h-11 shrink-0"
          data-testid="discover-filters-toggle-btn"
          onClick={() => setShowFilters((s) => !s)}
        >
          <Filter className="size-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 grid size-5 place-items-center rounded-full bg-white/20 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div data-testid="discover-filters-panel" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["college", "College", COLLEGE_OPTIONS],
              ["degree", "Degree", DEGREE_OPTIONS],
              ["branch", "Major", BRANCH_OPTIONS],
              ["year", "Year", YEAR_OPTIONS],
              ["skill", "Skill", SKILL_OPTIONS],
              ["interest", "Interest", INTEREST_OPTIONS],
            ] as const).map(([key, label, options]) => (
              <div key={key} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">{label}</p>
                <Select
                  value={filters[key]}
                  onValueChange={(v: string) => setFilters((f) => ({ ...f, [key]: v }))}
                >
                  <SelectTrigger data-testid={`discover-filter-${key}`} size="sm">
                    <SelectValue>{(v) => (v === ALL ? `Any ${label.toLowerCase()}` : String(v))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any {label.toLowerCase()}</SelectItem>
                    {options.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <Select value={filters.sort_by} onValueChange={(v: string) => setFilters((f) => ({ ...f, sort_by: v }))}>
              <SelectTrigger data-testid="discover-sort-select" size="sm" className="w-44">
                <SelectValue>
                  {(v) => ({ reputation: "Top reputation", connections: "Most connected", newest: "Newest members" }[v as string] ?? "Sort")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reputation">Top reputation</SelectItem>
                <SelectItem value="connections">Most connected</SelectItem>
                <SelectItem value="newest">Newest members</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" data-testid="discover-reset-filters-btn" onClick={reset}>
              <X className="mr-1 size-3.5" /> Reset
            </Button>
          </div>
        </div>
      )}

      <p data-testid="discover-result-count" className="text-xs text-slate-500">
        {isLoading ? "Searching…" : `${students?.length ?? 0} students found`}
      </p>

      {/* RESULTS */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load student results. Please try again shortly." />
      ) : (students?.length ?? 0) === 0 ? (
        <EmptyState
          testId="discover-empty-state"
          title="No students match those filters"
          description="Try widening your search — remove a filter or search a broader skill."
          action={
            <Button size="sm" variant="outline" data-testid="discover-empty-reset-btn" onClick={reset}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students!.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}
