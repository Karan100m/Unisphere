import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Video, MessageSquare, SkipForward, PhoneOff, Mic, MicOff, VideoOff, MonitorUp,
  Flag, Ban, Loader2, Send, Sparkles, Users, ShieldCheck,
} from "lucide-react";
import { apiPost } from "@/lib/api";
import { useWebRTC } from "@/lib/useWebRTC";
import { getErrorMessage, MEET_INTENTS } from "@/lib/helpers";
import type { MeetSessionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ReportDialog } from "@/components/ReportDialog";
import { cn } from "@/lib/utils";

interface ChatLine {
  id: string;
  from: "me" | "partner";
  text: string;
}

const PARTNER_REPLIES = [
  "Hey! Great to meet you 👋 What are you working on this semester?",
  "That sounds awesome. I've been deep in a side project too — mostly backend work.",
  "Definitely up for collaborating. Which stack do you prefer for prototyping?",
  "Same here! We should team up for the next hackathon.",
  "Let me know if you want to hop into a project together — I'll send my GitHub.",
];

export default function MeetSomeone() {
  const [stage, setStage] = useState<"setup" | "searching" | "matched">("setup");
  const [intent, setIntent] = useState(MEET_INTENTS[0]);
  const [mode, setMode] = useState<"video" | "chat">("video");
  const [prefs, setPrefs] = useState({ same_field: false, different_college: true, same_year: false });
  const [session, setSession] = useState<MeetSessionResponse | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const replyIdx = useRef(0);

  const rtc = useWebRTC({
    sessionId: session?.session_id ?? null,
    channel: "meet",
    simulate: session?.is_bot ?? true,
  });

  useEffect(() => {
    if (stage !== "matched") return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [stage]);

  const matchMutation = useMutation({
    mutationFn: () =>
      apiPost<MeetSessionResponse>("/meet/queue/join", {
        intent,
        mode,
        ...prefs,
        target_skill: "",
      }),
    onSuccess: async (s) => {
      setSession(s);
      setChat([]);
      setElapsed(0);
      replyIdx.current = 0;
      setStage("matched");
      if (mode === "video") await rtc.connect();
    },
    onError: (e) => {
      toast.error(getErrorMessage(e, "We couldn't find a match right now. Try again."));
      setStage("setup");
    },
  });

  const startMatching = () => {
    setStage("searching");
    setTimeout(() => matchMutation.mutate(), 1400);
  };

  const endSessionMutation = useMutation({
    mutationFn: () => apiPost(`/meet/session/${session?.session_id}/end`),
  });

  const endSession = () => {
    rtc.hangUp();
    if (session) endSessionMutation.mutate();
    setSession(null);
    setStage("setup");
    setChat([]);
  };

  const nextStudent = () => {
    rtc.hangUp();
    if (session) endSessionMutation.mutate();
    setSession(null);
    setStage("searching");
    setTimeout(() => matchMutation.mutate(), 1200);
  };

  const blockMutation = useMutation({
    mutationFn: () => apiPost("/safety/block", { blocked_user_id: session?.partner_id }),
    onSuccess: () => {
      toast.success("Student blocked. You won't be matched with them again.");
      nextStudent();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const sendChat = (text: string) => {
    if (!text.trim() || !session) return;
    setChat((c) => [...c, { id: `${Date.now()}-me`, from: "me", text }]);
    setChatDraft("");
    void apiPost("/meet/signal/send", {
      session_id: session.session_id,
      signal_type: "chat",
      payload: { text },
    }).catch(() => undefined);

    if (session.is_bot) {
      const reply = PARTNER_REPLIES[replyIdx.current % PARTNER_REPLIES.length];
      replyIdx.current += 1;
      setTimeout(() => {
        setChat((c) => [...c, { id: `${Date.now()}-p`, from: "partner", text: reply }]);
      }, 1100);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ---------------- SETUP ----------------
  if (stage === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Badge className="mb-3 border-violet-500/30 bg-violet-500/10 text-violet-300">
            <Sparkles className="mr-1.5 size-3" /> Spontaneous discovery
          </Badge>
          <h1 data-testid="meet-heading" className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Meet Someone
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Pick what you're looking for and we'll pair you with a student who wants the same.
            Only your first name, campus and course are shared — nothing private.
          </p>
        </div>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">I'm looking for</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {MEET_INTENTS.map((i) => (
              <button
                key={i}
                data-testid={`meet-intent-${i.split(" ")[0].toLowerCase()}`}
                onClick={() => setIntent(i)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors duration-200",
                  intent === i
                    ? "border-violet-500/60 bg-violet-500/12 text-violet-200"
                    : "border-white/[0.08] text-slate-300 hover:border-white/20",
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Optional filters</p>
          <div className="mt-3 space-y-3">
            {([
              ["different_college", "Different college than mine"],
              ["same_field", "Same field / major"],
              ["same_year", "Same academic year"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2.5">
                <Checkbox
                  id={key}
                  data-testid={`meet-filter-${key}`}
                  checked={prefs[key]}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: Boolean(v) }))}
                />
                <Label htmlFor={key} className="cursor-pointer text-sm text-slate-300">{label}</Label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Connect via</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([["video", Video, "Video call"], ["chat", MessageSquare, "Text chat"]] as const).map(([m, Icon, label]) => (
              <button
                key={m}
                data-testid={`meet-mode-${m}`}
                onClick={() => setMode(m)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-4 py-5 text-sm font-medium transition-colors duration-200",
                  mode === m
                    ? "border-violet-500/60 bg-violet-500/12 text-violet-200"
                    : "border-white/[0.08] text-slate-300 hover:border-white/20",
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <Button
          size="lg"
          className="h-13 w-full text-sm font-semibold electric-glow"
          data-testid="meet-someone-start-btn"
          onClick={startMatching}
        >
          <Users className="mr-2 size-4" /> Find a student
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Report and block are available at any point during a session.
        </p>
      </div>
    );
  }

  // ---------------- SEARCHING ----------------
  if (stage === "searching") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="pulse-ring absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-amber-400/30" />
            <div className="relative grid size-20 place-items-center rounded-full border border-violet-500/40 bg-violet-500/10">
              <Loader2 className="size-8 animate-spin text-violet-400" />
            </div>
          </div>
          <div>
            <p data-testid="meet-searching-text" className="font-heading text-lg font-semibold">
              Finding a student for you…
            </p>
            <p className="mt-1.5 text-sm text-slate-400">Matching on: {intent}</p>
          </div>
          <Button variant="outline" size="sm" data-testid="meet-cancel-search-btn" onClick={() => setStage("setup")}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ---------------- MATCHED ----------------
  if (!session) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* PARTNER HEADER */}
      <div
        data-testid="meet-partner-card"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
      >
        <Avatar src={session.partner_avatar} name={session.partner_name} size="md" ring />
        <div className="min-w-0 flex-1">
          <p data-testid="meet-partner-name" className="font-heading text-sm font-semibold">
            {session.partner_name.split(" ")[0]}
          </p>
          <p className="truncate text-xs text-slate-400">
            {session.partner_college} · {session.partner_degree_year}
          </p>
        </div>
        <Badge
          data-testid="meet-connection-status"
          className={cn(
            "border-0 font-mono text-[10px]",
            mode === "chat" || rtc.peerStatus === "connected"
              ? "bg-emerald-500/15 text-emerald-300"
              : rtc.peerStatus === "simulated"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-white/[0.06] text-slate-400",
          )}
        >
          {mode === "chat"
            ? `● chat active · ${fmt(elapsed)}`
            : rtc.peerStatus === "connected"
              ? `● live · ${fmt(elapsed)}`
              : rtc.peerStatus === "simulated"
                ? `● simulated peer · ${fmt(elapsed)}`
                : rtc.peerStatus === "connecting"
                  ? "connecting…"
                  : "waiting for peer"}
        </Badge>
      </div>

      {session.partner_interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid="meet-partner-interests">
          {session.partner_interests.slice(0, 5).map((i) => (
            <span key={i} className="rounded-full bg-amber-500/[0.09] px-2.5 py-1 text-[11px] text-amber-300">{i}</span>
          ))}
        </div>
      )}

      {/* VIDEO GRID */}
      {mode === "video" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
              <video
                ref={rtc.remoteVideoRef}
                data-testid="meet-remote-video"
                playsInline
                autoPlay
                className="size-full object-cover"
              />
              {rtc.peerStatus !== "connected" && rtc.peerStatus !== "simulated" && (
                <div className="absolute inset-0 grid place-items-center bg-[#16101F]">
                  <div className="text-center">
                    <Avatar src={session.partner_avatar} name={session.partner_name} size="xl" />
                    <p className="mt-3 text-xs text-slate-400">Waiting for {session.partner_name.split(" ")[0]}…</p>
                  </div>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                {session.partner_name.split(" ")[0]}
              </span>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
              <video
                ref={rtc.localVideoRef}
                data-testid="meet-local-video"
                playsInline
                autoPlay
                muted
                className="size-full scale-x-[-1] object-cover"
              />
              {rtc.mediaStatus !== "live" && (
                <div className="absolute inset-0 grid place-items-center bg-[#16101F] p-4">
                  <div className="text-center">
                    {rtc.mediaStatus === "requesting" ? (
                      <Loader2 className="mx-auto size-6 animate-spin text-violet-400" />
                    ) : (
                      <VideoOff className="mx-auto size-6 text-slate-500" />
                    )}
                    <p data-testid="meet-media-status" className="mt-2.5 max-w-[240px] text-xs text-slate-400">
                      {rtc.mediaError || "Starting your camera…"}
                    </p>
                    {(rtc.mediaStatus === "denied" || rtc.mediaStatus === "unsupported") && (
                      <Button size="xs" variant="outline" className="mt-3" data-testid="meet-retry-media-btn" onClick={() => void rtc.startMedia()}>
                        Retry camera access
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                You {!rtc.micOn && "· muted"}
              </span>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <Button
              size="icon"
              variant={rtc.micOn ? "outline" : "destructive"}
              data-testid="webrtc-toggle-mic-btn"
              onClick={rtc.toggleMic}
            >
              {rtc.micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </Button>
            <Button
              size="icon"
              variant={rtc.camOn ? "outline" : "destructive"}
              data-testid="webrtc-toggle-cam-btn"
              onClick={rtc.toggleCam}
            >
              {rtc.camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
            </Button>
            <Button
              size="icon"
              variant={rtc.sharingScreen ? "default" : "outline"}
              data-testid="webrtc-screenshare-btn"
              onClick={() => void rtc.toggleScreenShare()}
            >
              <MonitorUp className="size-4" />
            </Button>
            <Button size="icon" variant="destructive" data-testid="webrtc-end-call-btn" onClick={endSession}>
              <PhoneOff className="size-4" />
            </Button>
            <div className="mx-1 h-8 w-px bg-white/10" />
            <Button size="sm" variant="outline" data-testid="meet-someone-skip-btn" onClick={nextStudent}>
              <SkipForward className="mr-1.5 size-3.5" /> Next student
            </Button>
            <Button size="icon-sm" variant="ghost" data-testid="meet-report-btn" onClick={() => setReportOpen(true)}>
              <Flag className="size-4 text-slate-500" />
            </Button>
            <Button size="icon-sm" variant="ghost" data-testid="meet-block-btn" onClick={() => blockMutation.mutate()}>
              <Ban className="size-4 text-slate-500" />
            </Button>
          </div>
        </>
      )}

      {/* ICEBREAKERS */}
      {session.icebreaker_topics.length > 0 && (
        <div data-testid="meet-icebreakers" className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">Icebreakers — tap to send</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {session.icebreaker_topics.map((t, i) => (
              <button
                key={i}
                data-testid={`meet-icebreaker-${i}`}
                onClick={() => sendChat(t)}
                className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition-colors duration-200 hover:border-violet-500/40 hover:text-violet-200"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CHAT */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="font-heading text-sm font-semibold">Session chat</p>
        </div>
        <div data-testid="meet-chat-messages" className="max-h-64 min-h-[110px] space-y-2.5 overflow-y-auto p-4">
          {chat.length === 0 ? (
            <p data-testid="meet-chat-empty" className="py-4 text-center text-xs text-slate-500">
              Say hello or tap an icebreaker to start the conversation.
            </p>
          ) : (
            chat.map((l) => (
              <div key={l.id} className={cn("flex", l.from === "me" ? "justify-end" : "justify-start")}>
                <div
                  data-testid={`meet-chat-line-${l.from}`}
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                    l.from === "me"
                      ? "rounded-br-md bg-violet-500/90 text-white"
                      : "rounded-bl-md bg-white/[0.06] text-slate-200",
                  )}
                >
                  {l.text}
                </div>
              </div>
            ))
          )}
        </div>
        <form
          className="flex gap-2 border-t border-white/[0.06] p-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            sendChat(chatDraft);
          }}
        >
          <Input
            data-testid="meet-chat-input"
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder="Type a message…"
            className="h-10"
          />
          <Button type="submit" data-testid="meet-chat-send-btn" disabled={!chatDraft.trim()} className="h-10 shrink-0">
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {mode === "chat" && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" data-testid="meet-start-video-btn" onClick={() => { setMode("video"); void rtc.connect(); }}>
            <Video className="mr-1.5 size-3.5" /> Start video
          </Button>
          <Button size="sm" variant="outline" data-testid="meet-someone-skip-chat-btn" onClick={nextStudent}>
            <SkipForward className="mr-1.5 size-3.5" /> Next student
          </Button>
          <Button size="sm" variant="destructive" data-testid="meet-end-chat-btn" onClick={endSession}>
            End session
          </Button>
          <Button size="icon-sm" variant="ghost" data-testid="meet-report-chat-btn" onClick={() => setReportOpen(true)}>
            <Flag className="size-4 text-slate-500" />
          </Button>
        </div>
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="user"
        targetId={session.partner_id}
        targetLabel={session.partner_name}
      />
    </div>
  );
}
