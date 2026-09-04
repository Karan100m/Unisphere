import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, Video, X, Check, Plus, ExternalLink } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/helpers";
import type { MeetingResponse, AvailabilityResponse, UserResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/States";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-amber-500/15 text-amber-300",
  cancelled: "bg-rose-500/15 text-rose-300",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function BookMeetingDialog({
  open, onOpenChange, hostId,
}: { open: boolean; onOpenChange: (o: boolean) => void; hostId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", topic: "" });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const { data: host } = useQuery({
    queryKey: ["profile", hostId],
    queryFn: () => apiGet<UserResponse>(`/users/${hostId}`),
    enabled: open,
  });

  const { data: avail } = useQuery({
    queryKey: ["availability", hostId],
    queryFn: () => apiGet<AvailabilityResponse>(`/meetings/availability/${hostId}`),
    enabled: open,
  });

  // Next 10 weekdays that the host has marked active
  const upcomingDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  }).filter((d) => {
    const dayName = DAY_NAMES[d.getDay()];
    return avail?.weekly_schedule.some((s) => s.day === dayName && s.active);
  }).slice(0, 8);

  const slotsForDate = selectedDate
    ? avail?.weekly_schedule.find((s) => s.day === DAY_NAMES[new Date(selectedDate).getDay()])?.slots ?? []
    : [];

  const bookMutation = useMutation({
    mutationFn: () =>
      apiPost<MeetingResponse>("/meetings/book", {
        host_id: hostId,
        title: form.title,
        description: form.description,
        topic: form.topic || avail?.topics[0] || "Networking",
        meeting_date: selectedDate,
        start_time: selectedSlot!.start,
        end_time: selectedSlot!.end,
      }),
    onSuccess: () => {
      toast.success("Meeting scheduled! Both of you have been notified.");
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      setForm({ title: "", description: "", topic: "" });
      setSelectedDate("");
      setSelectedSlot(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto" data-testid="book-meeting-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Schedule a meeting</DialogTitle>
          <DialogDescription>
            {host ? `Book a 30-minute slot with ${host.full_name}` : "Pick a time that works for both of you"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What's it about?</Label>
            <Select value={form.topic || avail?.topics[0] || ""} onValueChange={(v: string) => setForm((f) => ({ ...f, topic: v }))}>
              <SelectTrigger data-testid="meeting-topic-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(avail?.topics ?? ["Networking"]).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Meeting title</Label>
            <Input
              data-testid="meeting-title-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Discuss the AI gesture project"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-slate-500">(optional)</span></Label>
            <Textarea
              data-testid="meeting-description-input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Pick a date</Label>
            <div data-testid="meeting-date-picker" className="grid grid-cols-4 gap-2">
              {upcomingDates.map((d) => {
                const iso = d.toISOString().slice(0, 10);
                return (
                  <button
                    key={iso}
                    data-testid={`meeting-date-${iso}`}
                    onClick={() => {
                      setSelectedDate(iso);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-center transition-colors duration-200",
                      selectedDate === iso
                        ? "border-violet-500/60 bg-violet-500/12 text-violet-200"
                        : "border-white/[0.08] text-slate-300 hover:border-white/20",
                    )}
                  >
                    <p className="text-[10px] uppercase text-slate-500">{DAY_NAMES[d.getDay()].slice(0, 3)}</p>
                    <p className="text-sm font-semibold">{d.getDate()}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label>Available times</Label>
              {slotsForDate.length === 0 ? (
                <p className="text-xs text-slate-500">No slots published for this day.</p>
              ) : (
                <div data-testid="meeting-slot-picker" className="grid grid-cols-3 gap-2">
                  {slotsForDate.map((s) => (
                    <button
                      key={s.start_time}
                      data-testid={`meeting-slot-select-time-${s.start_time.replace(":", "")}`}
                      disabled={s.is_booked}
                      onClick={() => setSelectedSlot({ start: s.start_time, end: s.end_time })}
                      className={cn(
                        "rounded-xl border py-2.5 font-mono text-xs transition-colors duration-200",
                        selectedSlot?.start === s.start_time
                          ? "border-violet-500/60 bg-violet-500/12 text-violet-200"
                          : s.is_booked
                            ? "cursor-not-allowed border-white/[0.05] text-slate-600 line-through"
                            : "border-white/[0.08] text-slate-300 hover:border-white/20",
                      )}
                    >
                      {s.start_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="meeting-book-submit-btn"
            disabled={bookMutation.isPending || !form.title.trim() || !selectedDate || !selectedSlot}
            onClick={() => bookMutation.mutate()}
          >
            {bookMutation.isPending ? "Booking…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: avail, isLoading } = useQuery({
    queryKey: ["availability", user?.id],
    queryFn: () => apiGet<AvailabilityResponse>(`/meetings/availability/${user?.id}`),
    enabled: open && !!user,
  });

  const [schedule, setSchedule] = useState<AvailabilityResponse["weekly_schedule"] | null>(null);
  const [topicsText, setTopicsText] = useState("");

  const working = schedule ?? avail?.weekly_schedule ?? [];
  const topics = topicsText || (avail?.topics ?? []).join(", ");

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPost<AvailabilityResponse>("/meetings/availability", {
        topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
        timezone: "UTC",
        weekly_schedule: working,
      }),
    onSuccess: () => {
      toast.success("Your availability is published. Students can now book you.");
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggleDay = (day: string) =>
    setSchedule(working.map((d) => (d.day === day ? { ...d, active: !d.active } : d)));

  const toggleSlot = (day: string, start: string) =>
    setSchedule(
      working.map((d) =>
        d.day === day
          ? { ...d, slots: d.slots.filter((s) => s.start_time !== start) }
          : d,
      ),
    );

  const addSlot = (day: string) => {
    const d = working.find((x) => x.day === day);
    if (!d) return;
    const lastHour = d.slots.length > 0 ? Number(d.slots[d.slots.length - 1].start_time.split(":")[0]) : 13;
    const next = lastHour + 1;
    if (next > 21) {
      toast.error("You've reached the latest bookable hour (21:00).");
      return;
    }
    setSchedule(
      working.map((x) =>
        x.day === day
          ? {
              ...x,
              slots: [
                ...x.slots,
                { start_time: `${String(next).padStart(2, "0")}:00`, end_time: `${String(next).padStart(2, "0")}:30`, is_booked: false },
              ],
            }
          : x,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto" data-testid="availability-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Your availability</DialogTitle>
          <DialogDescription>Publish weekly slots so students can book you without back-and-forth.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState label="Loading your schedule…" />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Available for <span className="text-slate-500">(comma separated)</span></Label>
              <Input
                data-testid="availability-topics-input"
                value={topics}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder="Project discussion, Career discussion, Mentorship"
              />
            </div>

            <div className="space-y-2.5">
              {working.map((d) => (
                <div
                  key={d.day}
                  data-testid={`availability-day-${d.day.toLowerCase()}`}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <button
                      data-testid={`availability-toggle-${d.day.toLowerCase()}`}
                      onClick={() => toggleDay(d.day)}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-md transition-colors duration-200",
                          d.active ? "bg-violet-500 text-white" : "bg-white/[0.08]",
                        )}
                      >
                        {d.active && <Check className="size-3" />}
                      </span>
                      <span className={cn("text-sm font-medium", d.active ? "text-slate-100" : "text-slate-500")}>
                        {d.day}
                      </span>
                    </button>
                    <Button
                      size="xs"
                      variant="ghost"
                      data-testid={`availability-add-slot-${d.day.toLowerCase()}`}
                      onClick={() => addSlot(d.day)}
                    >
                      <Plus className="mr-1 size-3" /> Slot
                    </Button>
                  </div>

                  {d.active && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {d.slots.length === 0 ? (
                        <p className="text-[11px] text-slate-500">No slots — add one.</p>
                      ) : (
                        d.slots.map((s) => (
                          <button
                            key={s.start_time}
                            data-testid={`availability-slot-${d.day.toLowerCase()}-${s.start_time.replace(":", "")}`}
                            onClick={() => toggleSlot(d.day, s.start_time)}
                            className="group flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-colors duration-200 hover:border-rose-500/40"
                          >
                            {s.start_time}
                            <X className="size-3 text-slate-600 group-hover:text-rose-400" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="availability-save-btn" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Saving…" : "Publish availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const bookHostId = searchParams.get("book");
  const [availOpen, setAvailOpen] = useState(false);
  const [tab, setTab] = useState("upcoming");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", tab],
    queryFn: () => apiGet<MeetingResponse[]>(`/meetings/my?status_filter=${tab}`),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/meetings/${id}/cancel`),
    onSuccess: () => {
      toast.success("Meeting cancelled. The other student was notified.");
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/meetings/${id}/complete`),
    onSuccess: () => {
      toast.success("Meeting marked complete");
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 data-testid="meetings-heading" className="font-heading text-2xl font-bold tracking-tight">
            My Meetings
          </h1>
          <p className="mt-1 text-sm text-slate-400">Publish your slots and manage every scheduled conversation.</p>
        </div>
        <Button data-testid="availability-open-btn" onClick={() => setAvailOpen(true)}>
          <Clock className="mr-1.5 size-4" /> Set availability
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="w-full" data-testid="meetings-tabs">
          <TabsTrigger value="upcoming" data-testid="meetings-tab-upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" data-testid="meetings-tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="meetings-tab-cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-5 space-y-3">
          {isLoading ? (
            <LoadingState label="Loading meetings…" />
          ) : meetings.length === 0 ? (
            <EmptyState
              testId="meetings-empty-state"
              title={`No ${tab} meetings.`}
              description={
                tab === "upcoming"
                  ? "Book a slot from a student's profile to start a conversation."
                  : `Nothing in your ${tab} history yet.`
              }
              icon={<CalendarDays className="size-6" />}
              action={
                tab === "upcoming" && (
                  <Link to="/discover">
                    <Button size="sm" data-testid="meetings-discover-cta">Find students to meet</Button>
                  </Link>
                )
              }
            />
          ) : (
            meetings.map((m) => {
              const isHost = m.host_id === user?.id;
              const other = isHost
                ? { name: m.guest_name, avatar: m.guest_avatar, college: m.guest_college, id: m.guest_id }
                : { name: m.host_name, avatar: m.host_avatar, college: m.host_college, id: m.host_id };
              return (
                <div
                  key={m.id}
                  data-testid={`meeting-card-${m.id}`}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-violet-500/25"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 data-testid={`meeting-title-${m.id}`} className="font-heading text-base font-semibold">
                        {m.title}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-violet-400">
                        {m.meeting_date} · {m.start_time}–{m.end_time} UTC
                      </p>
                    </div>
                    <Badge className={cn("shrink-0 border-0 text-[10px]", STATUS_STYLES[m.status])}>
                      {m.status}
                    </Badge>
                  </div>

                  {m.description && <p className="mt-2.5 text-sm text-slate-400">{m.description}</p>}

                  <Badge className="mt-3 border-0 bg-white/[0.05] text-[10px] text-slate-400">{m.topic}</Badge>

                  <div className="mt-4 flex items-center gap-2.5 border-t border-white/[0.06] pt-3.5">
                    <Avatar src={other.avatar} name={other.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${other.id}`} className="truncate text-xs font-semibold hover:text-violet-300">
                        {other.name}
                      </Link>
                      <p className="truncate text-[10px] text-slate-500">
                        {other.college} · {isHost ? "guest" : "host"}
                      </p>
                    </div>
                  </div>

                  {m.status === "upcoming" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/discover`} className="hidden" />
                      <Button
                        size="sm"
                        data-testid={`meeting-join-btn-${m.id}`}
                        onClick={() => {
                          void navigator.clipboard?.writeText(m.meeting_link);
                          toast.success("Meeting link copied to your clipboard");
                        }}
                      >
                        <Video className="mr-1.5 size-3.5" /> Copy meeting link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`meeting-complete-btn-${m.id}`}
                        onClick={() => completeMutation.mutate(m.id)}
                      >
                        <Check className="mr-1.5 size-3.5" /> Mark complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`meeting-cancel-btn-${m.id}`}
                        onClick={() => cancelMutation.mutate(m.id)}
                      >
                        <X className="mr-1.5 size-3.5" /> Cancel
                      </Button>
                    </div>
                  )}
                  {m.status === "completed" && (
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`meeting-link-${m.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-violet-400"
                    >
                      <ExternalLink className="size-3" /> {m.meeting_link}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <AvailabilityDialog open={availOpen} onOpenChange={setAvailOpen} />
      {bookHostId && (
        <BookMeetingDialog
          open={!!bookHostId}
          onOpenChange={(o) => {
            if (!o) {
              searchParams.delete("book");
              setSearchParams(searchParams, { replace: true });
            }
          }}
          hostId={bookHostId}
        />
      )}
    </div>
  );
}
