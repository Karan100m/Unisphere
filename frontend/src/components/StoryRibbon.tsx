import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, Eye, Send, Flag, ChevronRight, ChevronLeft } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/helpers";
import type { UserStoriesGroup } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ReportDialog } from "@/components/ReportDialog";

const EMOJIS = ["🔥", "👏", "💡", "🚀", "❤️", "😂"];

const BG_COLORS = ["#8B5CF6", "#FBBF24", "#F472B6", "#F97316", "#34D399", "#16101F"];

export function StoryRibbon() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerGroupIdx, setViewerGroupIdx] = useState<number | null>(null);
  const [storyIdx, setStoryIdx] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const [newStory, setNewStory] = useState({
    media_url: "",
    media_type: "text" as "text" | "image",
    caption: "",
    text_background_color: BG_COLORS[0],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => apiGet<UserStoriesGroup[]>("/stories"),
  });

  const createMutation = useMutation({
    mutationFn: () => apiPost("/stories", newStory),
    onSuccess: () => {
      toast.success("Story posted! It'll disappear in 24 hours.");
      setCreateOpen(false);
      setNewStory({ media_url: "", media_type: "text", caption: "", text_background_color: BG_COLORS[0] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const viewMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/stories/${id}/view`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["stories"] }),
  });

  const reactMutation = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => apiPost(`/stories/${id}/react`, { emoji }),
    onSuccess: () => {
      toast.success("Reaction sent!");
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      apiPost(`/stories/${id}/reply`, { message }),
    onSuccess: () => {
      toast.success("Reply sent as a direct message!");
      setReplyText("");
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const activeGroup = viewerGroupIdx !== null ? groups[viewerGroupIdx] : null;
  const activeStory = activeGroup?.stories[storyIdx] ?? null;

  useEffect(() => {
    if (activeStory && !activeStory.viewed_by_me) {
      viewMutation.mutate(activeStory.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStory?.id]);

  const closeViewer = () => {
    setViewerGroupIdx(null);
    setStoryIdx(0);
  };

  const nextStory = () => {
    if (!activeGroup) return;
    if (storyIdx < activeGroup.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (viewerGroupIdx !== null && viewerGroupIdx < groups.length - 1) {
      setViewerGroupIdx(viewerGroupIdx + 1);
      setStoryIdx(0);
    } else {
      closeViewer();
    }
  };

  const prevStory = () => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (viewerGroupIdx !== null && viewerGroupIdx > 0) {
      setViewerGroupIdx(viewerGroupIdx - 1);
      setStoryIdx(0);
    }
  };

  return (
    <>
      <div
        data-testid="story-ribbon"
        className="flex gap-3.5 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
      >
        {/* Add story */}
        <button
          data-testid="story-create-btn"
          onClick={() => setCreateOpen(true)}
          className="group flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <div className="relative">
            <Avatar src={user?.avatar_url} name={user?.full_name ?? "You"} size="lg" className="opacity-70" />
            <span className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full border-2 border-[#0B0713] bg-violet-500 text-white transition-transform duration-200 group-hover:scale-110">
              <Plus className="size-3.5" />
            </span>
          </div>
          <span className="truncate text-[10px] text-slate-400">Your story</span>
        </button>

        {groups.length === 0 ? (
          <div data-testid="stories-empty" className="flex items-center px-2 text-xs text-slate-500">
            No active stories yet — share the first one.
          </div>
        ) : (
          groups.map((g, i) => (
            <button
              key={g.user_id}
              data-testid={`story-avatar-${g.user_id}`}
              onClick={() => {
                setViewerGroupIdx(i);
                setStoryIdx(0);
              }}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <div className={g.has_unseen ? "avatar-story-aura" : "rounded-full p-[2.5px] ring-1 ring-white/10"}>
                <div className="rounded-full bg-[#0B0713] p-[2px]">
                  <Avatar src={g.user_avatar} name={g.user_name} size="lg" />
                </div>
              </div>
              <span className="w-full truncate text-center text-[10px] text-slate-400">
                {g.user_name.split(" ")[0]}
              </span>
            </button>
          ))
        )}
      </div>

      {/* CREATE STORY DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" data-testid="story-create-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Share a story</DialogTitle>
            <DialogDescription>Text or image. Disappears automatically after 24 hours.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {(["text", "image"] as const).map((t) => (
                <button
                  key={t}
                  data-testid={`story-type-${t}-btn`}
                  onClick={() => setNewStory((s) => ({ ...s, media_type: t }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize transition-colors duration-200 ${
                    newStory.media_type === t
                      ? "border-violet-500/60 bg-violet-500/10 text-violet-200"
                      : "border-white/[0.08] text-slate-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {newStory.media_type === "image" && (
              <Input
                data-testid="story-media-url-input"
                placeholder="Paste an image URL"
                value={newStory.media_url}
                onChange={(e) => setNewStory((s) => ({ ...s, media_url: e.target.value }))}
              />
            )}

            <Textarea
              data-testid="story-caption-input"
              placeholder="What's happening on campus?"
              value={newStory.caption}
              onChange={(e) => setNewStory((s) => ({ ...s, caption: e.target.value }))}
              rows={3}
            />

            {newStory.media_type === "text" && (
              <div className="flex gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    data-testid={`story-bg-${c.replace("#", "").toLowerCase()}`}
                    onClick={() => setNewStory((s) => ({ ...s, text_background_color: c }))}
                    style={{ background: c }}
                    className={`size-8 rounded-lg transition-transform duration-200 ${
                      newStory.text_background_color === c ? "scale-110 ring-2 ring-white/50" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              data-testid="story-publish-btn"
              disabled={createMutation.isPending || (!newStory.caption.trim() && !newStory.media_url.trim())}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Posting…" : "Post story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STORY VIEWER */}
      {activeGroup && activeStory && (
        <div
          data-testid="story-viewer"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
        >
          <button
            data-testid="story-viewer-close-btn"
            onClick={closeViewer}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          <button
            data-testid="story-prev-btn"
            onClick={prevStory}
            className="absolute left-2 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-8"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            data-testid="story-next-btn"
            onClick={nextStory}
            className="absolute right-2 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-8"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="flex w-full max-w-sm flex-col gap-3">
            {/* progress */}
            <div className="flex gap-1">
              {activeGroup.stories.map((_, i) => (
                <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className={`h-full rounded-full bg-white ${i <= storyIdx ? "w-full" : "w-0"}`} />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <Avatar src={activeStory.user_avatar} name={activeStory.user_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p data-testid="story-viewer-author" className="truncate text-sm font-semibold text-white">
                  {activeStory.user_name}
                </p>
                <p className="truncate text-[11px] text-white/60">{activeStory.user_college}</p>
              </div>
              <span
                data-testid="story-viewer-views-count"
                className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80"
              >
                <Eye className="size-3" /> {activeStory.views_count}
              </span>
              {activeStory.user_id !== user?.id && (
                <button
                  data-testid="story-report-btn"
                  onClick={() => setReportOpen(true)}
                  className="grid size-8 place-items-center rounded-full bg-white/10 text-white/70 hover:text-rose-400"
                >
                  <Flag className="size-3.5" />
                </button>
              )}
            </div>

            {/* content */}
            <div
              data-testid="story-viewer-content"
              style={activeStory.media_type === "text" ? { background: activeStory.text_background_color } : undefined}
              className="relative flex aspect-[9/14] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10"
            >
              {activeStory.media_type === "image" && activeStory.media_url ? (
                <>
                  <img src={activeStory.media_url} alt="Story" className="size-full object-cover" />
                  {activeStory.caption && (
                    <p className="absolute bottom-0 w-full bg-gradient-to-t from-black/85 to-transparent p-5 text-sm font-medium text-white">
                      {activeStory.caption}
                    </p>
                  )}
                </>
              ) : (
                <p className="px-7 text-center font-heading text-xl font-bold leading-snug text-white">
                  {activeStory.caption}
                </p>
              )}
            </div>

            {/* reactions */}
            <div className="flex justify-center gap-2">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  data-testid={`story-react-${em}`}
                  onClick={() => reactMutation.mutate({ id: activeStory.id, emoji: em })}
                  className="grid size-10 place-items-center rounded-full bg-white/10 text-lg transition-transform duration-200 hover:scale-115 hover:bg-white/20"
                >
                  {em}
                </button>
              ))}
            </div>

            {activeStory.reactions.length > 0 && (
              <p data-testid="story-reactions-summary" className="text-center text-[11px] text-white/60">
                {activeStory.reactions.map((r) => r.emoji).join(" ")} · {activeStory.reactions.length} reactions
              </p>
            )}

            {activeStory.user_id !== user?.id && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!replyText.trim()) return;
                  replyMutation.mutate({ id: activeStory.id, message: replyText });
                }}
              >
                <Input
                  data-testid="story-reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply privately…"
                  className="h-10 border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40"
                />
                <Button type="submit" data-testid="story-reply-send-btn" disabled={replyMutation.isPending}>
                  <Send className="size-4" />
                </Button>
              </form>
            )}
          </div>

          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            targetType="story"
            targetId={activeStory.id}
            targetLabel={`Story by ${activeStory.user_name}`}
          />
        </div>
      )}
    </>
  );
}
