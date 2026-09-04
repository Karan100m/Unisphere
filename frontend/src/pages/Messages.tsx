import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Send, Video, Trash2, ArrowLeft, MessageSquare, Circle, Ban } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { timeAgo, getErrorMessage } from "@/lib/helpers";
import type { ConversationResponse, MessageResponse, CallSessionResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/States";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("conv");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiGet<ConversationResponse[]>("/conversations"),
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: msgLoading } = useQuery({
    queryKey: ["messages", activeConvId],
    queryFn: () => apiGet<MessageResponse[]>(`/conversations/${activeConvId}/messages`),
    enabled: !!activeConvId,
    refetchInterval: 4000,
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeConvId]);

  const sendMutation = useMutation({
    mutationFn: () => apiPost<MessageResponse>(`/conversations/${activeConvId}/messages`, { content: draft }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/conversations/messages/${id}`),
    onSuccess: () => {
      toast.success("Message deleted");
      void queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const typingMutation = useMutation({
    mutationFn: (typing: boolean) => apiPost(`/conversations/${activeConvId}/typing`, { is_typing: typing }),
  });

  const callMutation = useMutation({
    mutationFn: () =>
      apiPost<CallSessionResponse>("/calls/initiate", {
        recipient_id: activeConv?.other_user.id,
        call_type: "video",
      }),
    onSuccess: (c) => navigate(`/calls/${c.call_id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const blockMutation = useMutation({
    mutationFn: () => apiPost("/safety/block", { blocked_user_id: activeConv?.other_user.id }),
    onSuccess: () => {
      toast.success("User blocked");
      setSearchParams({});
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const filtered = conversations.filter((c) =>
    c.other_user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.other_user.college.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDraftChange = (v: string) => {
    setDraft(v);
    if (activeConvId && !isTyping && v.length > 0) {
      setIsTyping(true);
      typingMutation.mutate(true);
      setTimeout(() => {
        setIsTyping(false);
        typingMutation.mutate(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 data-testid="messages-heading" className="font-heading text-2xl font-bold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-sm text-slate-400">Direct conversations with students across campuses.</p>
      </div>

      <div className="grid h-[calc(100vh-16rem)] min-h-[520px] gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] lg:grid-cols-[320px_1fr]">
        {/* CONVERSATION LIST */}
        <div className={cn("flex flex-col border-white/[0.07] lg:border-r", activeConvId && "hidden lg:flex")}>
          <div className="border-b border-white/[0.07] p-3.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                data-testid="messages-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <LoadingState label="Loading chats…" />
            ) : filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  testId="conversations-empty"
                  title="No conversations yet"
                  description="Message a student from their profile or the Discover page."
                  icon={<MessageSquare className="size-6" />}
                  action={
                    <Link to="/discover">
                      <Button size="sm" data-testid="messages-discover-cta">Discover students</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  data-testid={`conversation-item-${c.id}`}
                  onClick={() => setSearchParams({ conv: c.id })}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-white/[0.04] p-3.5 text-left transition-colors duration-200 hover:bg-white/[0.04]",
                    activeConvId === c.id && "bg-violet-500/[0.08]",
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.other_user.avatar_url} name={c.other_user.full_name} size="md" />
                    <Circle className="absolute -bottom-0.5 -right-0.5 size-3 fill-emerald-500 text-[#16101F]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{c.other_user.full_name}</p>
                      <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="truncate text-xs text-slate-400">{c.last_message}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span
                      data-testid={`conversation-unread-${c.id}`}
                      className="grid min-w-[20px] shrink-0 place-items-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white"
                    >
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ACTIVE CHAT */}
        <div className={cn("flex flex-col", !activeConvId && "hidden lg:flex")}>
          {!activeConv ? (
            <div className="grid flex-1 place-items-center p-6">
              <EmptyState
                testId="chat-no-selection"
                title="Select a conversation"
                description="Pick a chat on the left, or start a new one from a student's profile."
                icon={<MessageSquare className="size-6" />}
              />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-white/[0.07] p-3.5">
                <button
                  data-testid="chat-back-btn"
                  onClick={() => setSearchParams({})}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] lg:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <Link to={`/profile/${activeConv.other_user.id}`} className="shrink-0">
                  <Avatar src={activeConv.other_user.avatar_url} name={activeConv.other_user.full_name} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${activeConv.other_user.id}`}
                    data-testid="chat-header-name"
                    className="truncate text-sm font-semibold hover:text-violet-300"
                  >
                    {activeConv.other_user.full_name}
                  </Link>
                  <p data-testid="chat-online-status" className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Circle className="size-2 fill-current" /> Online
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="outline"
                  data-testid="chat-videocall-btn"
                  disabled={callMutation.isPending}
                  onClick={() => callMutation.mutate()}
                >
                  <Video className="size-4" />
                </Button>
                <Button size="icon-sm" variant="ghost" data-testid="chat-block-btn" onClick={() => blockMutation.mutate()}>
                  <Ban className="size-4 text-slate-500" />
                </Button>
              </header>

              <div ref={scrollRef} data-testid="chat-messages-list" className="flex-1 space-y-3 overflow-y-auto p-4">
                {msgLoading ? (
                  <LoadingState label="Loading messages…" />
                ) : messages.length === 0 ? (
                  <p data-testid="chat-messages-empty" className="py-12 text-center text-sm text-slate-500">
                    No messages yet. Say hello 👋
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        data-testid={`message-${m.id}`}
                        className={cn("group flex gap-2", mine ? "justify-end" : "justify-start")}
                      >
                        {!mine && <Avatar src={m.sender_avatar} name={m.sender_name} size="xs" className="mt-auto" />}
                        <div className={cn("max-w-[75%]", mine && "flex items-end gap-1.5")}>
                          {mine && (
                            <button
                              data-testid={`message-delete-btn-${m.id}`}
                              onClick={() => deleteMutation.mutate(m.id)}
                              className="mb-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            >
                              <Trash2 className="size-3.5 text-slate-500 hover:text-rose-400" />
                            </button>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-3.5 py-2.5",
                              mine
                                ? "rounded-br-md bg-violet-500/90 text-white"
                                : "rounded-bl-md bg-white/[0.06] text-slate-200",
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                            <p className={cn("mt-1 text-[10px]", mine ? "text-white/60" : "text-slate-500")}>
                              {timeAgo(m.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && (
                  <p data-testid="chat-typing-indicator" className="text-[11px] italic text-slate-500">
                    You are typing…
                  </p>
                )}
              </div>

              <form
                className="flex gap-2 border-t border-white/[0.07] p-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  sendMutation.mutate();
                }}
              >
                <Input
                  data-testid="chat-message-input"
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder="Write a message…"
                  className="h-10"
                />
                <Button
                  type="submit"
                  data-testid="chat-send-btn"
                  disabled={sendMutation.isPending || !draft.trim()}
                  className="h-10 shrink-0"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
