import { useRef, useState, useCallback, useEffect } from "react";
import { apiPost, apiGet } from "@/lib/api";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type MediaStatus = "idle" | "requesting" | "live" | "denied" | "unsupported";
export type PeerStatus = "idle" | "connecting" | "connected" | "simulated" | "ended";

interface UseWebRTCOptions {
  sessionId: string | null;
  /** Endpoint prefix: "/meet" or "/calls" */
  channel: "meet" | "calls";
  /** When true, the remote side is a simulation partner (no live peer). */
  simulate: boolean;
}

/**
 * Real WebRTC media + peer signaling over the backend polling endpoints.
 * Local media is genuine getUserMedia. When `simulate` is true (no live peer in
 * the room), the remote tile mirrors an interactive simulated partner instead of
 * pretending a peer connection exists — the status badge reflects this honestly.
 */
export function useWebRTC({ sessionId, channel, simulate }: UseWebRTCOptions) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<number | null>(null);

  const [mediaStatus, setMediaStatus] = useState<MediaStatus>("idle");
  const [peerStatus, setPeerStatus] = useState<PeerStatus>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [mediaError, setMediaError] = useState<string>("");

  const attachLocal = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      void localVideoRef.current.play().catch(() => undefined);
    }
  }, []);

  /** Request real camera + mic. */
  const startMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaStatus("unsupported");
      setMediaError("This browser does not support camera access (getUserMedia unavailable).");
      return null;
    }
    setMediaStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      attachLocal(stream);
      setMediaStatus("live");
      setMediaError("");
      return stream;
    } catch (err) {
      setMediaStatus("denied");
      setMediaError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Camera and microphone permission was denied. Enable it in your browser to start video."
          : "No camera or microphone was detected on this device.",
      );
      return null;
    }
  }, [attachLocal]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && sessionId) {
        void apiPost(`/${channel}/signal/send`, {
          ...(channel === "meet" ? { session_id: sessionId } : { call_id: sessionId }),
          signal_type: "ice-candidate",
          payload: { candidate: e.candidate.toJSON() },
        }).catch(() => undefined);
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        void remoteVideoRef.current.play().catch(() => undefined);
        setPeerStatus("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setPeerStatus("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setPeerStatus(simulate ? "simulated" : "ended");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, channel, simulate]);

  /** Start the call: real media, real peer connection + offer via backend signaling. */
  const connect = useCallback(async () => {
    const stream = await startMedia();
    if (!sessionId) return;

    setPeerStatus("connecting");

    if (simulate) {
      // No live peer is present. Mirror the local stream into the remote tile so
      // the operator sees a working room, and label the state as simulated.
      if (stream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        void remoteVideoRef.current.play().catch(() => undefined);
      }
      setPeerStatus("simulated");
      return;
    }

    const pc = createPeerConnection();
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await apiPost(`/${channel}/signal/send`, {
        ...(channel === "meet" ? { session_id: sessionId } : { call_id: sessionId }),
        signal_type: "offer",
        payload: { sdp: offer.sdp, type: offer.type },
      });
    } catch {
      setPeerStatus(simulate ? "simulated" : "connecting");
    }
  }, [sessionId, simulate, startMedia, createPeerConnection, channel]);

  /** Poll the backend for the peer's offer/answer/candidates. */
  useEffect(() => {
    if (!sessionId || simulate) return;

    const poll = async () => {
      try {
        const res = await apiGet<{ signals: Array<{ signal_type: string; payload: Record<string, unknown> }> }>(
          `/${channel}/signal/poll/${sessionId}`,
        );
        const pc = pcRef.current;
        if (!pc) return;

        for (const sig of res.signals) {
          if (sig.signal_type === "offer" && pc.signalingState === "stable" && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: "offer", sdp: sig.payload.sdp as string }),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await apiPost(`/${channel}/signal/send`, {
              ...(channel === "meet" ? { session_id: sessionId } : { call_id: sessionId }),
              signal_type: "answer",
              payload: { sdp: answer.sdp, type: answer.type },
            });
          } else if (sig.signal_type === "answer" && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp: sig.payload.sdp as string }),
            );
          } else if (sig.signal_type === "ice-candidate" && sig.payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.payload.candidate as RTCIceCandidateInit));
          }
        }
      } catch {
        // polling is best-effort; a transient failure must not break the room
      }
    };

    pollRef.current = window.setInterval(() => void poll(), 2500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [sessionId, simulate, channel]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, [camOn]);

  const toggleScreenShare = useCallback(async () => {
    if (sharingScreen) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setSharingScreen(false);
      if (localStreamRef.current) attachLocal(localStreamRef.current);
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMediaError("Screen sharing is not supported in this browser.");
      return;
    }
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screen;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screen;
        void localVideoRef.current.play().catch(() => undefined);
      }
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screen.getVideoTracks()[0]);
      screen.getVideoTracks()[0].onended = () => {
        setSharingScreen(false);
        if (localStreamRef.current) attachLocal(localStreamRef.current);
      };
      setSharingScreen(true);
    } catch {
      setMediaError("Screen share was cancelled.");
    }
  }, [sharingScreen, attachLocal]);

  const hangUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    localStreamRef.current = null;
    screenStreamRef.current = null;
    pcRef.current = null;
    if (pollRef.current) window.clearInterval(pollRef.current);
    setPeerStatus("ended");
    setMediaStatus("idle");
    setSharingScreen(false);
  }, []);

  useEffect(() => () => hangUp(), [hangUp]);

  return {
    localVideoRef,
    remoteVideoRef,
    mediaStatus,
    peerStatus,
    mediaError,
    micOn,
    camOn,
    sharingScreen,
    connect,
    startMedia,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    hangUp,
  };
}
