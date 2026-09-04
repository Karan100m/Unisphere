import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Phone, Loader2, Send, MessageSquare, X,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useWebRTC } from "@/lib/useWebRTC";
import { getErrorMessage } from "@/lib/helpers";
import type { CallSessionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/States";
import { cn } from "@/lib/utils";

export default function CallRoom() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<Array<{ id: string; from: "me" | "peer"; text: string }>>([]);
  const [draft, setDraft] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [joined, setJoined] = useState(false);

  const { data: call, isLoading, isError, refetch } = useQuery({
    queryKey: ["call", callId],
    queryFn: () => apiGet<CallSessionResponse>(`/calls/${callId}`),
    enabled: !!callId,
    refetchInterval: (q) => (q.state.data?.status === "ringing" ? 3000 : false),
  });

  const isCaller = call?.caller_id === user?.id;
  const peer = call
    ? isCaller
      ? { name: call.recipient_name, avatar: call.recipient_avatar, college: call.recipient_college }
      : { name: call.caller_name, avatar: call.caller_avatar, college: call.caller_college }
    : null;

  // Live peer signaling — the room is a genuine 1-1 WebRTC channel when both
  // parties are present. Solo (no peer answered yet) falls back to a labelled
  // simulated remote tile rather than pretending a peer is connected.
  const rtc = useWebRTC({
    sessionId: callId ?? null,
    channel: "calls",
    simulate: call?.status !== "active",
  });

  useEffect(() => {
    if (!joined || call?.status !== "active") return;
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [joined, call?.status]);

  const respondMutation = useMutation({
    mutationFn: (action: "accept" | "reject") => apiPost<CallSessionResponse>(`/calls/${callId}/respond`, { action }),
    onSuccess: async (c) => {
      await refetch();
      if (c.status === "active") {
        setJoined(true);
        await rtc.connect();
      } else {
        toast.info("Call declined");
        navigate("/messages");
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const endMutation = useMutation({
    mutationFn: () => apiPost(`/calls/${callId}/end`),
    onSuccess: () => {
      rtc.hangUp();
      toast.info("Call ended");
      navigate("/messages");
    },
  });

  const joinAsCaller = async () => {
    setJoined(true);
    await rtc.connect();
  };

  const sendChat = () => {
    if (!draft.trim()) return;
    setChat((c) => [...c, { id: `${Date.now()}`, from: "me", text: draft }]);
    void apiPost("/calls/signal/send", {
      call_id: callId,
      signal_type: "chat",
      payload: { text: draft },
    }).catch(() => undefined);
    setDraft("");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (isLoading) return <LoadingState label="Connecting to the call room…" />;
  if (isError || !call || !peer) return <ErrorState message="This call session no longer exists." />;

  if (call.status === "rejected" || call.status === "ended") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <PhoneOff className="mx-auto size-10 text-slate-500" />
        <h1 data-testid="call-ended-heading" className="mt-4 font-heading text-xl font-bold">
          Call {call.status}
        </h1>
        <p className="mt-2 text-sm text-slate-400">This session is no longer active.</p>
        <Button className="mt-6" data-testid="call-back-to-messages-btn" onClick={() => navigate("/messages")}>
          Back to Messages
        </Button>
      </div>
    );
  }

  // INCOMING RINGING (recipient hasn't answered)
  if (call.status === "ringing" && !isCaller) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="relative mx-auto w-fit">
          <div className="pulse-ring absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-amber-400/30" />
          <Avatar src={peer.avatar} name={peer.name} size="2xl" ring className="relative" />
        </div>
        <h1 data-testid="incoming-call-heading" className="mt-6 font-heading text-xl font-bold">
          {peer.name}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{peer.college}</p>
        <p className="mt-4 text-sm text-violet-400">Incoming {call.call_type} call…</p>

        <div className="mt-10 flex justify-center gap-4">
          <Button
            size="lg"
            variant="destructive"
            data-testid="call-reject-btn"
            className="size-14 rounded-full p-0"
            onClick={() => respondMutation.mutate("reject")}
          >
            <PhoneOff className="size-5" />
          </Button>
          <Button
            size="lg"
            data-testid="call-accept-btn"
            className="size-14 rounded-full bg-emerald-500 p-0 hover:bg-emerald-600"
            disabled={respondMutation.isPending}
            onClick={() => respondMutation.mutate("accept")}
          >
            {respondMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Phone className="size-5" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <Avatar src={peer.avatar} name={peer.name} size="md" ring />
        <div className="min-w-0 flex-1">
          <p data-testid="call-peer-name" className="font-heading text-sm font-semibold">{peer.name}</p>
          <p className="truncate text-xs text-slate-400">{peer.college}</p>
        </div>
        <Badge
          data-testid="call-connection-status"
          className={cn(
            "border-0 font-mono text-[10px]",
            rtc.peerStatus === "connected"
              ? "bg-emerald-500/15 text-emerald-300"
              : rtc.peerStatus === "simulated"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-white/[0.06] text-slate-400",
          )}
        >
          {call.status === "ringing"
            ? "ringing…"
            : rtc.peerStatus === "connected"
              ? `● live · ${fmt(elapsed)}`
              : rtc.peerStatus === "simulated"
                ? `● local preview · ${fmt(elapsed)}`
                : rtc.peerStatus === "connecting"
                  ? "connecting…"
                  : "not started"}
        </Badge>
      </div>

      {!joined ? (
        <div className="grid place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16">
          <div className="text-center">
            <Avatar src={peer.avatar} name={peer.name} size="xl" />
            <p className="mt-4 text-sm text-slate-400">
              {call.status === "ringing" ? `Ringing ${peer.name.split(" ")[0]}…` : "Ready to join"}
            </p>
            <Button className="mt-6" data-testid="call-join-btn" onClick={() => void joinAsCaller()}>
              <Video className="mr-1.5 size-4" /> Start my camera & join
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
              <video
                ref={rtc.remoteVideoRef}
                data-testid="call-remote-video"
                playsInline
                autoPlay
                className="size-full object-cover"
              />
              {rtc.peerStatus !== "connected" && rtc.peerStatus !== "simulated" && (
                <div className="absolute inset-0 grid place-items-center bg-[#16101F]">
                  <div className="text-center">
                    <Avatar src={peer.avatar} name={peer.name} size="xl" />
                    <p className="mt-3 text-xs text-slate-400">Waiting for {peer.name.split(" ")[0]}…</p>
                  </div>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                {peer.name.split(" ")[0]}
              </span>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
              <video
                ref={rtc.localVideoRef}
                data-testid="call-local-video"
                playsInline
                autoPlay
                muted
                className="size-full scale-x-[-1] object-cover"
              />
              {rtc.mediaStatus !== "live" && (
                <div className="absolute inset-0 grid place-items-center bg-[#16101F] p-4 text-center">
                  <div>
                    {rtc.mediaStatus === "requesting" ? (
                      <Loader2 className="mx-auto size-6 animate-spin text-violet-400" />
                    ) : (
                      <VideoOff className="mx-auto size-6 text-slate-500" />
                    )}
                    <p data-testid="call-media-status" className="mt-2.5 max-w-[240px] text-xs text-slate-400">
                      {rtc.mediaError || "Starting your camera…"}
                    </p>
                    {(rtc.mediaStatus === "denied" || rtc.mediaStatus === "unsupported") && (
                      <Button size="xs" variant="outline" className="mt-3" data-testid="call-retry-media-btn" onClick={() => void rtc.startMedia()}>
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

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5">
            <Button size="icon" variant={rtc.micOn ? "outline" : "destructive"} data-testid="call-toggle-mic-btn" onClick={rtc.toggleMic}>
              {rtc.micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </Button>
            <Button size="icon" variant={rtc.camOn ? "outline" : "destructive"} data-testid="call-toggle-cam-btn" onClick={rtc.toggleCam}>
              {rtc.camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
            </Button>
            <Button
              size="icon"
              variant={rtc.sharingScreen ? "default" : "outline"}
              data-testid="call-screenshare-btn"
              onClick={() => void rtc.toggleScreenShare()}
            >
              <MonitorUp className="size-4" />
            </Button>
            <Button size="icon" variant="outline" data-testid="call-chat-toggle-btn" onClick={() => setChatOpen((s) => !s)}>
              <MessageSquare className="size-4" />
            </Button>
            <Button size="icon" variant="destructive" data-testid="call-end-btn" onClick={() => endMutation.mutate()}>
              <PhoneOff className="size-4" />
            </Button>
          </div>
        </>
      )}

      {/* IN-CALL CHAT DRAWER */}
      {chatOpen && (
        <div data-testid="call-chat-drawer" className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <p className="font-heading text-sm font-semibold">In-call chat</p>
            <button data-testid="call-chat-close-btn" onClick={() => setChatOpen(false)}>
              <X className="size-4 text-slate-500" />
            </button>
          </div>
          <div className="max-h-52 min-h-[90px] space-y-2 overflow-y-auto p-4">
            {chat.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">No messages in this call yet.</p>
            ) : (
              chat.map((l) => (
                <div key={l.id} className={cn("flex", l.from === "me" ? "justify-end" : "justify-start")}>
                  <div className="max-w-[78%] rounded-2xl bg-violet-500/90 px-3.5 py-2 text-sm text-white">{l.text}</div>
                </div>
              ))
            )}
          </div>
          <form
            className="flex gap-2 border-t border-white/[0.06] p-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
          >
            <Input
              data-testid="call-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message during the call…"
              className="h-10"
            />
            <Button type="submit" data-testid="call-chat-send-btn" disabled={!draft.trim()} className="h-10 shrink-0">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
